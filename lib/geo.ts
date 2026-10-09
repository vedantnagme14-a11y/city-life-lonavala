import { Place } from './types';

/**
 * Haversine distance in meters between two lat/lng coordinates
 */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const haversineDistanceMeters = haversine;

export interface RiskCheckResult {
  count: number;
  riskPlaces: Place[];
}

/**
 * Counts places with category "risk" or monsoon_restricted=true lying within 400 m
 * of any sampled route point (sampling every 10th point).
 */
export function countRiskPlacesNearRoute(
  coordinates: [number, number][], // array of [lng, lat]
  places: Place[],
  radiusMeters = 400
): RiskCheckResult {
  const candidatePlaces = places.filter(
    (p) => p.category === 'risk' || p.monsoon_restricted === true
  );

  const matchedRiskPlaces = new Map<string, Place>();

  if (!coordinates || coordinates.length === 0) {
    return { count: 0, riskPlaces: [] };
  }

  // Sample every 10th point
  for (let i = 0; i < coordinates.length; i += 10) {
    const [lng, lat] = coordinates[i];

    for (const place of candidatePlaces) {
      if (!matchedRiskPlaces.has(place.id)) {
        const dist = haversine(lat, lng, place.lat, place.lng);
        if (dist <= radiusMeters) {
          matchedRiskPlaces.set(place.id, place);
        }
      }
    }
  }

  // Also verify the endpoint if it wasn't an exact multiple of 10
  const lastIndex = coordinates.length - 1;
  if (lastIndex % 10 !== 0) {
    const [lng, lat] = coordinates[lastIndex];
    for (const place of candidatePlaces) {
      if (!matchedRiskPlaces.has(place.id)) {
        const dist = haversine(lat, lng, place.lat, place.lng);
        if (dist <= radiusMeters) {
          matchedRiskPlaces.set(place.id, place);
        }
      }
    }
  }

  const list = Array.from(matchedRiskPlaces.values());
  return {
    count: list.length,
    riskPlaces: list,
  };
}

export const findRisksNearRoute = countRiskPlacesNearRoute;
