import { PlaceScores } from './types';

export interface ScoreWeights {
  safety: number;
  cleanliness: number;
  affordability: number;
  rating: number;
  accessibility: number;
}

export type Weights = ScoreWeights;

export const DEFAULT_WEIGHTS: ScoreWeights = {
  safety: 0.35,
  cleanliness: 0.20,
  affordability: 0.20,
  rating: 0.15,
  accessibility: 0.10,
};

export function calculateOverallScore(
  scores: PlaceScores | { safety: number; cleanliness: number; affordability: number; rating: number; accessibility: number },
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const overall =
    weights.safety * scores.safety +
    weights.cleanliness * scores.cleanliness +
    weights.affordability * scores.affordability +
    weights.rating * scores.rating +
    weights.accessibility * scores.accessibility;

  return Math.round(overall * 100) / 100;
}

export const getOverallScore = calculateOverallScore;
