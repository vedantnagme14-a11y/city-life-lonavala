import placesData from '@/data/places.json';
import { Place, CitizenReport } from './types';
import { calculateOverallScore } from './score';
import { haversine } from './geo';

export interface AssistantSuggestion {
  place: Place;
  reason: string;
  price: string;
  safetyNote?: string;
  nearbyReportWarning?: string;
}

export interface AssistantResponse {
  answerText: string;
  suggestions: AssistantSuggestion[];
  comparedPlaces?: Place[];
}

const places = placesData as Place[];

/**
 * Parses user questions for categories, budget, tags, intents, and produces
 * 2-3 tailored recommendations with reasons, pricing, safety advisories, and nearby incident warnings.
 */
export function queryAssistant(
  question: string,
  reports: CitizenReport[] = []
): AssistantResponse {
  const q = question.toLowerCase();

  // 1. Check for Comparison Intent: "compare X vs Y" or "compare X and Y"
  const compareMatch = q.match(/compare\s+([^vs|and]+)\s+(?:vs|and)\s+(.+)/i);
  if (compareMatch) {
    const term1 = compareMatch[1].trim();
    const term2 = compareMatch[2].trim();

    const matchedPlaces = places.filter((p) => {
      const name = p.name.toLowerCase();
      return name.includes(term1) || term1.includes(name) || name.includes(term2) || term2.includes(name);
    });

    if (matchedPlaces.length >= 2) {
      const p1 = matchedPlaces[0];
      const p2 = matchedPlaces[1];
      const s1 = calculateOverallScore(p1.scores);
      const s2 = calculateOverallScore(p2.scores);

      let comparisonReason = `${p1.name} (Score ${s1}/5, Safety ${p1.scores.safety}/5) vs ${p2.name} (Score ${s2}/5, Safety ${p2.scores.safety}/5). `;
      if (p1.monsoon_restricted || p2.monsoon_restricted) {
        const restricted = p1.monsoon_restricted ? p1.name : p2.name;
        const safer = p1.monsoon_restricted ? p2.name : p1.name;
        comparisonReason += `Note: ${restricted} has active monsoon prohibitory restrictions, making ${safer} the significantly safer alternative!`;
      } else {
        comparisonReason += `Both are accessible; check notes for crowd and stair climb requirements.`;
      }

      return {
        answerText: `Comparison Analysis:\n${comparisonReason}`,
        suggestions: matchedPlaces.slice(0, 2).map((place) =>
          formatSuggestion(place, `Overall Score ${calculateOverallScore(place.scores)}/5`, reports)
        ),
        comparedPlaces: matchedPlaces.slice(0, 2),
      };
    }
  }

  // 2. Category words detection
  let targetCategory: string | null = null;
  if (q.includes('food') || q.includes('eat') || q.includes('restaurant') || q.includes('dhaba') || q.includes('chikki') || q.includes('snack')) {
    targetCategory = 'food';
  } else if (q.includes('hotel') || q.includes('stay') || q.includes('lodge') || q.includes('resort')) {
    targetCategory = 'hotel';
  } else if (q.includes('heritage') || q.includes('history') || q.includes('fort') || q.includes('cave')) {
    targetCategory = 'heritage';
  } else if (q.includes('attraction') || q.includes('view') || q.includes('lake') || q.includes('dam') || q.includes('point')) {
    targetCategory = 'attraction';
  }

  // 3. Budget extraction ("under 300", "below 500", "less than 200", "< 300", etc.)
  let maxBudget: number | null = null;
  const budgetMatch = q.match(/(?:under|below|less than|within|budget of|<)\s*₹?\s*(\d+)/i);
  if (budgetMatch) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // 4. Tags extraction
  const possibleTags = ['veg', 'family', 'trek', 'budget', 'rain', 'sunset', 'indoor'];
  const matchedTags = possibleTags.filter((tag) => q.includes(tag));

  // 5. Intent detection
  const isCheapestIntent = q.includes('cheapest') || q.includes('lowest cost') || q.includes('cheap');
  const isSafestIntent = q.includes('safest') || q.includes('safe') || q.includes('safety');
  const isRainMentioned = q.includes('rain') || q.includes('monsoon') || q.includes('wet') || q.includes('storm');

  // 6. Filtering places
  let filtered = [...places];

  // If question mentions rain or monsoon: EXCLUDE monsoon_restricted places
  if (isRainMentioned) {
    filtered = filtered.filter((p) => !p.monsoon_restricted);
  }

  // Apply category filter if detected
  if (targetCategory) {
    filtered = filtered.filter((p) => p.category === targetCategory);
  }

  // Apply budget filter if detected
  if (maxBudget !== null) {
    filtered = filtered.filter((p) => p.approx_cost_inr <= maxBudget);
  }

  // Filter or boost by tags
  if (matchedTags.length > 0) {
    const withTag = filtered.filter((p) => p.tags.some((t) => matchedTags.includes(t)));
    if (withTag.length >= 2) {
      filtered = withTag;
    }
  }

  // Prefer "rainy-day" tag if rain is mentioned
  if (isRainMentioned) {
    const rainyDayPlaces = filtered.filter((p) => p.tags.includes('rainy-day') || p.tags.includes('indoor'));
    if (rainyDayPlaces.length > 0) {
      // Put rainy-day places first
      const otherPlaces = filtered.filter((p) => !p.tags.includes('rainy-day') && !p.tags.includes('indoor'));
      filtered = [...rainyDayPlaces, ...otherPlaces];
    }
  }

  // Fallback if over-filtered
  if (filtered.length === 0) {
    filtered = places.filter((p) => !isRainMentioned || !p.monsoon_restricted);
  }

  // 7. Ranking places
  if (isCheapestIntent) {
    filtered.sort((a, b) => a.approx_cost_inr - b.approx_cost_inr);
  } else if (isSafestIntent) {
    filtered.sort((a, b) => {
      if (b.scores.safety !== a.scores.safety) {
        return b.scores.safety - a.scores.safety;
      }
      return calculateOverallScore(b.scores) - calculateOverallScore(a.scores);
    });
  } else {
    // Ranked by overall score from lib/score.ts
    filtered.sort((a, b) => calculateOverallScore(b.scores) - calculateOverallScore(a.scores));
  }

  // Pick top 2-3 suggestions
  const topPlaces = filtered.slice(0, 3);

  // Generate customized answer text
  let summaryPrefix = 'Based on your inquiry, here are top recommended recommendations:';
  if (isRainMentioned) {
    summaryPrefix = 'Monsoon Advisory Applied: High-risk dams, waterfalls, and cliff edges were excluded. Recommended rain-safe options:';
  } else if (isCheapestIntent && maxBudget !== null) {
    summaryPrefix = `Found budget-friendly options within ₹${maxBudget}:`;
  } else if (isSafestIntent) {
    summaryPrefix = 'Prioritized highest safety ratings (4-5/5) with verified road accessibility:';
  }

  const suggestions: AssistantSuggestion[] = topPlaces.map((place) => {
    let reason = '';
    if (isRainMentioned && (place.tags.includes('rainy-day') || place.tags.includes('indoor'))) {
      reason = 'Ideal sheltered indoor choice protected from torrential downpours.';
    } else if (place.scores.safety >= 4 && isSafestIntent) {
      reason = `High safety rating (${place.scores.safety}/5) with secure family-friendly accessibility.`;
    } else if (place.approx_cost_inr === 0) {
      reason = 'Free public access with excellent historical and scenic value.';
    } else if (isCheapestIntent || (maxBudget !== null && place.approx_cost_inr <= maxBudget)) {
      reason = `Affordable value at ₹${place.approx_cost_inr} with solid ${place.scores.affordability}/5 affordability rating.`;
    } else {
      reason = `Top-rated choice (Overall: ${calculateOverallScore(place.scores)}/5) known for ${place.tags.slice(0, 2).join(' & ')}.`;
    }

    return formatSuggestion(place, reason, reports);
  });

  return {
    answerText: summaryPrefix,
    suggestions,
  };
}

function formatSuggestion(
  place: Place,
  reason: string,
  reports: CitizenReport[]
): AssistantSuggestion {
  const priceDisplay = place.approx_cost_inr === 0 ? 'Free (₹0)' : `₹${place.approx_cost_inr}`;

  // Check if recent reports in localStorage "cl_reports" are near (within 1 km = 1000m)
  let nearbyReportWarning: string | undefined = undefined;
  for (const report of reports) {
    const dist = haversine(place.lat, place.lng, report.lat, report.lng);
    if (dist <= 1000) {
      nearbyReportWarning = `Recent citizen report nearby (~${Math.round(dist)}m): "${report.summary}" (Severity ${report.severity}/5)`;
      break;
    }
  }

  return {
    place,
    reason,
    price: priceDisplay,
    safetyNote: place.note || undefined,
    nearbyReportWarning,
  };
}
