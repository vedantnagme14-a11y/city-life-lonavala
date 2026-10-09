export interface PlaceScores {
  safety: number;
  cleanliness: number;
  affordability: number;
  rating: number;
  accessibility: number;
}

export interface Place {
  id: string;
  name: string;
  category: 'heritage' | 'attraction' | 'food' | 'hotel' | 'risk';
  lat: number;
  lng: number;
  price_level: number;
  approx_cost_inr: number;
  scores: PlaceScores;
  tags: string[];
  description: string;
  monsoon_restricted: boolean;
  note: string;
}

export interface WeatherData {
  temperature: number;
  precipitation: number;
  maxPrecipitationProb: number;
  isHeavyRainAlert: boolean;
}

export interface CitizenReport {
  id: string;
  text: string;
  category: 'safety' | 'cleanliness' | 'traffic' | 'weather' | 'other';
  severity: number;
  lat: number;
  lng: number;
  summary: string;
  createdAt: string;
  photoUrl?: string;
}
