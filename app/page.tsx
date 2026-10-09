'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import placesData from '@/data/places.json';
import { Place, WeatherData, CitizenReport } from '@/lib/types';
import { getStoredReports } from '@/lib/reports';
import WeatherBanner from '@/components/WeatherBanner';
import PlaceCard from '@/components/PlaceCard';

// Client-only Leaflet map (dynamic import, ssr:false)
const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[60vh] md:h-[calc(100vh-12rem)] flex items-center justify-center bg-slate-100 text-slate-500">
      <div className="flex flex-col items-center gap-2">
        <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm font-medium">Loading Lonavala interactive map...</span>
      </div>
    </div>
  ),
});

export default function ExplorePage() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [weatherAlertActive, setWeatherAlertActive] = useState<boolean>(false);
  const [testAlertOverride, setTestAlertOverride] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const places = placesData as Place[];

  useEffect(() => {
    // Load citizen reports from localStorage (seeds 3 sample Lonavala reports if empty)
    setReports(getStoredReports());
  }, []);

  const handleWeatherLoaded = (data: WeatherData) => {
    setWeatherAlertActive(data.isHeavyRainAlert);
  };

  const effectiveAlert = testAlertOverride !== null ? testAlertOverride : weatherAlertActive;

  const filteredPlaces = places.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <main className="flex flex-col flex-1 min-h-[calc(100vh-4rem)]">
      {/* Weather banner using Open-Meteo */}
      <WeatherBanner onWeatherLoaded={handleWeatherLoaded} overrideAlert={testAlertOverride} />

      {/* Weather simulation test toggle bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Weather Alert Status:</span>
          {effectiveAlert ? (
            <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded-full">
              ⚠️ Heavy Rain Alert ACTIVE
            </span>
          ) : (
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
              ✓ Normal Conditions
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Simulate Alert:</span>
          <button
            onClick={() => setTestAlertOverride(testAlertOverride === true ? false : true)}
            className="text-[11px] font-semibold px-2 py-0.5 rounded-sm border border-slate-300 hover:bg-slate-200 transition text-slate-700"
          >
            {testAlertOverride === true ? 'Reset to Live API' : 'Simulate Heavy Rain'}
          </button>
        </div>
      </div>

      {/* Main Map View */}
      <div className="flex-1 flex flex-col relative">
        <LeafletMap
          places={places}
          reports={reports}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          isWeatherAlert={effectiveAlert}
        />
      </div>

      {/* Quick Explore Bottom Drawer / List for mobile & desktop browsing */}
      <section className="bg-white border-t border-gray-200 p-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Explore Lonavala Directory</h2>
              <p className="text-xs text-gray-500">
                Click any place below or tap markers on the map above to view safety scores & details
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search places or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredPlaces.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <button
                  key={place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-gray-900 truncate">{place.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                        place.category === 'risk'
                          ? 'bg-red-100 text-red-800'
                          : place.monsoon_restricted
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {place.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 line-clamp-2 mb-2">{place.description}</div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                    <span>
                      Safety: <strong className="text-gray-800">{place.scores.safety}/5</strong>
                    </span>
                    <span>{place.approx_cost_inr === 0 ? 'Free' : `₹${place.approx_cost_inr}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile Modal Card overlay if place selected */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:hidden p-3 animate-in fade-in">
          <div className="w-full max-h-[85vh] overflow-y-auto">
            <PlaceCard
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              isWeatherAlert={effectiveAlert}
            />
          </div>
        </div>
      )}
    </main>
  );
}
