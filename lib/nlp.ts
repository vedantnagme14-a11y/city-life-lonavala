export interface ClassificationResult {
  category: 'safety' | 'cleanliness' | 'traffic' | 'weather' | 'other';
  severity: number;
  summary: string;
}

const CATEGORY_KEYWORDS: Record<'safety' | 'cleanliness' | 'traffic' | 'weather', string[]> = {
  safety: ['unsafe', 'theft', 'harassment', 'drowning', 'slippery', 'accident', 'fall', 'dark', 'fight'],
  cleanliness: ['garbage', 'dirty', 'litter', 'smell', 'toilet', 'waste'],
  traffic: ['jam', 'traffic', 'blocked', 'congestion', 'pothole', 'road', 'parking'],
  weather: ['rain', 'fog', 'flood', 'landslide', 'waterlogged', 'storm'],
};

const SEVERITY_BOOSTERS = [
  'urgent',
  'danger',
  'serious',
  'injured',
  'accident',
  'flood',
  'drowning',
  'many',
  'children',
];

/**
 * Keyword-based classifier (no external API):
 * classify(text) returns {category, severity 1-5, summary}
 */
export function classify(text: string): ClassificationResult {
  const normalized = text.toLowerCase();

  // Count matches per category
  const scores: Record<'safety' | 'cleanliness' | 'traffic' | 'weather', number> = {
    safety: 0,
    cleanliness: 0,
    traffic: 0,
    weather: 0,
  };

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<['safety' | 'cleanliness' | 'traffic' | 'weather', string[]]>) {
    for (const kw of keywords) {
      // Use regex word boundary or direct inclusion
      const regex = new RegExp(`\\b${kw}`, 'i');
      if (regex.test(normalized)) {
        scores[cat]++;
      }
    }
  }

  // Pick category with most keyword matches, else "other"
  let chosenCategory: 'safety' | 'cleanliness' | 'traffic' | 'weather' | 'other' = 'other';
  let maxCount = 0;

  for (const [cat, count] of Object.entries(scores) as Array<['safety' | 'cleanliness' | 'traffic' | 'weather', number]>) {
    if (count > maxCount) {
      maxCount = count;
      chosenCategory = cat;
    }
  }

  // Severity starts at 2, +1 for each booster found (cap 5)
  let severity = 2;
  for (const booster of SEVERITY_BOOSTERS) {
    const regex = new RegExp(`\\b${booster}`, 'i');
    if (regex.test(normalized)) {
      severity++;
    }
  }
  severity = Math.min(5, Math.max(1, severity));

  // Summary = first 12 words
  const words = text.trim().split(/\s+/).filter(Boolean);
  const summary = words.slice(0, 12).join(' ') + (words.length > 12 ? '...' : '');

  return {
    category: chosenCategory,
    severity,
    summary: summary || 'Citizen Report',
  };
}
