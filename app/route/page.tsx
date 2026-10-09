'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import placesData from '@/data/places.json';
import { Place } from '@/lib/types';
import { countRiskPlacesNearRoute } from '@/lib/geo';
import { RouteWithRisk } from '@/components/RouteMap';

// Client-only dynamic import for Route Leaflet Map
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[55vh] md:h-[500px] rounded-2xl bg-slate-100 flex items-center justify-center border border-gray-200">
      <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
        <svg className="animate-spin h-7 w-7 text-emerald-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Loading Route Map...</span>
      </div>
    </div>
  ),
});

export default function RoutePage() {
  const places = placesData as Place[];

  // Two dropdowns: From, To listing places from data/places.json
  const [fromId, setFromId] = useState<string>(places[0]?.id || '');
  const [toId, setToId] = useState<string>(places[2]?.id || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [routes, setRoutes] = useState<RouteWithRisk[]>([]);
  const [safestRoute, setSafestRoute] = useState<RouteWithRisk | null>(null);
  const [riskPlacesOnRoute, setRiskPlacesOnRoute] = useState<Place[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const fromPlace = places.find((p) => p.id === fromId) || null;
  const toPlace = places.find((p) => p.id === toId) || null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fromPlace || !toPlace) return;

    if (fromPlace.id === toPlace.id) {
      setErrorMsg('Please select two distinct locations for From and To.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setHasQueried(true);

    try {
      // Call free OSRM server: https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson&alternatives=true
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromPlace.lng},${fromPlace.lat};${toPlace.lng},${toPlace.lat}?overview=full&geometries=geojson&alternatives=true`;
      const res = await fetch(osrmUrl);

      if (!res.ok) {
        throw new Error(`OSRM server returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No driving route found between these locations.');
      }

      // Analyze each route for nearby risk points
      const analyzedRoutes: RouteWithRisk[] = data.routes.map((r: any, idx: number) => {
        const coords: [number, number][] = r.geometry.coordinates; // [lng, lat]
        const riskCheck = countRiskPlacesNearRoute(coords, places, 400);

        return {
          id: idx,
          coordinates: coords,
          distanceMeters: r.distance,
          durationSeconds: r.duration,
          riskCount: riskCheck.count,
          riskPlaces: riskCheck.riskPlaces,
          isSafest: false,
        };
      });

      // Find route with fewest risk points
      let minRisks = Infinity;
      let minIdx = 0;
      analyzedRoutes.forEach((r, idx) => {
        if (r.riskCount < minRisks) {
          minRisks = r.riskCount;
          minIdx = idx;
        }
      });

      // Mark the safest route
      analyzedRoutes[minIdx].isSafest = true;
      const chosen = analyzedRoutes[minIdx];

      setRoutes(analyzedRoutes);
      setSafestRoute(chosen);
      setRiskPlacesOnRoute(chosen.riskPlaces);
    } catch (err: any) {
      console.error('Route error:', err);
      setErrorMsg(
        err?.message || 'Could not fetch routing path from OSRM. Please check your internet connection and try again.'
      );
      setRoutes([]);
      setSafestRoute(null);
      setRiskPlacesOnRoute([]);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial mount for default route
  useEffect(() => {
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Safe Route Planner
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Query open driving routes and automatically identify nearby hazards (&lt;400m) including monsoon restrictions, steep ghats, and high-risk water bodies.
        </p>
      </div>

      {/* Two Dropdowns (From, To) Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Dropdown: From */}
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="from-place" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              From Location
            </label>
            <select
              id="from-place"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 font-medium"
            >
              {places.map((place) => (
                <option key={`from-${place.id}`} value={place.id}>
                  {place.name} ({place.category})
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown: To */}
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="to-place" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              To Location
            </label>
            <select
              id="to-place"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 font-medium"
            >
              {places.map((place) => (
                <option key={`to-${place.id}`} value={place.id}>
                  {place.name} ({place.category})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Routing...</span>
                </>
              ) : (
                <span>Find Route</span>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Map Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-gray-900">Route Map & Corridor Hazards</h2>
          {safestRoute && (
            <div className="text-xs text-gray-600 flex items-center gap-3">
              <span>
                Distance: <strong className="text-gray-900">{(safestRoute.distanceMeters / 1000).toFixed(1)} km</strong>
              </span>
              <span>
                Est. Time: <strong className="text-gray-900">{Math.round(safestRoute.durationSeconds / 60)} min</strong>
              </span>
              <span>
                Routes Analyzed: <strong className="text-gray-900">{routes.length}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Client-Only Leaflet Map */}
        <RouteMap
          fromPlace={fromPlace}
          toPlace={toPlace}
          routes={routes}
          safestRoute={safestRoute}
          riskPlacesOnChosenRoute={riskPlacesOnRoute}
        />
      </section>

      {/* Under the map: List risk places near the chosen route as warnings, with their note */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Corridor Risk Assessment</h2>

        {riskPlacesOnRoute.length > 0 ? (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                Caution: The selected route passes within 400 meters of {riskPlacesOnRoute.length} recorded hazard or restricted zone{riskPlacesOnRoute.length > 1 ? 's' : ''}:
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskPlacesOnRoute.map((place) => (
                <div
                  key={place.id}
                  className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      {place.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-red-100 text-red-800">
                      {place.monsoon_restricted ? 'Monsoon Restricted' : place.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600">{place.description}</p>

                  {/* Note / Advisory */}
                  <div className="bg-red-50/70 p-2.5 rounded-lg border border-red-100 text-xs text-red-900">
                    <strong className="font-bold">Warning / Advisory Note:</strong> {place.note || 'Exercise caution in this area.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : hasQueried && !loading ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm font-semibold flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>No known risk zones on this route</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
