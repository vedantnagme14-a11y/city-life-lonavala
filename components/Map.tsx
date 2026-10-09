'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Place, CitizenReport } from '@/lib/types';
import PlaceCard from './PlaceCard';

interface MapProps {
  places: Place[];
  reports?: CitizenReport[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  isWeatherAlert: boolean;
}

// Controller component to smoothly fly and center map when a place is chosen
function MapFlyToController({ targetPlace }: { targetPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (targetPlace) {
      map.flyTo([targetPlace.lat, targetPlace.lng], 14, {
        duration: 1.2,
      });
    }
  }, [targetPlace, map]);

  return null;
}

export default function Map({
  places,
  reports = [],
  selectedPlace,
  onSelectPlace,
  isWeatherAlert,
}: MapProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [monsoonOnly, setMonsoonOnly] = useState(false);
  const [showReports, setShowReports] = useState(true);
  
  // On-map directory panel toggle & search state
  const [showDirectoryPanel, setShowDirectoryPanel] = useState<boolean>(true);
  const [directorySearch, setDirectorySearch] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Places' },
    { id: 'attraction', label: 'Attractions' },
    { id: 'heritage', label: 'Heritage & Forts' },
    { id: 'food', label: 'Food & Dhabas' },
    { id: 'hotel', label: 'Hotels & Resorts' },
    { id: 'risk', label: 'Risk Zones' },
  ];

  // Filter places
  const filteredPlaces = places.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) {
      return false;
    }
    if (monsoonOnly && !p.monsoon_restricted) {
      return false;
    }
    if (directorySearch) {
      const q = directorySearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchTag = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchCat && !matchTag) return false;
    }
    return true;
  });

  const getMarkerColors = (place: Place) => {
    // Red if category is risk or monsoon_restricted
    if (place.category === 'risk' || place.monsoon_restricted) {
      return {
        fill: '#ef4444',
        border: '#991b1b',
        name: 'Risk / Restricted',
      };
    }
    switch (place.category) {
      case 'heritage':
        return { fill: '#f59e0b', border: '#b45309', name: 'Heritage' };
      case 'attraction':
        return { fill: '#0284c7', border: '#0369a1', name: 'Attraction' };
      case 'food':
        return { fill: '#10b981', border: '#047857', name: 'Food' };
      case 'hotel':
        return { fill: '#6366f1', border: '#4338ca', name: 'Hotel' };
      default:
        return { fill: '#64748b', border: '#334155', name: 'Other' };
    }
  };

  const getReportColor = (cat: string) => {
    switch (cat) {
      case 'safety':
        return { fill: '#dc2626', border: '#7f1d1d' };
      case 'cleanliness':
        return { fill: '#059669', border: '#064e3b' };
      case 'traffic':
        return { fill: '#d97706', border: '#78350f' };
      case 'weather':
        return { fill: '#2563eb', border: '#1e3a8a' };
      default:
        return { fill: '#7c3aed', border: '#4c1d95' };
    }
  };

  const handleChooseLocation = (place: Place) => {
    onSelectPlace(place);
  };

  return (
    <div className="relative w-full flex-1 flex flex-col">
      {/* Category Filter Chips Bar */}
      <div className="bg-white/95 backdrop-blur-xs border-b border-gray-200 px-4 py-3 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Filter:
            </span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition-all shadow-2xs ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            {/* Quick toggle for monsoon restricted places */}
            <button
              onClick={() => setMonsoonOnly(!monsoonOnly)}
              className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                monsoonOnly
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <span>⚠️</span>
              <span>Monsoon Restricted Only</span>
            </button>

            {/* Toggle Community Reports */}
            {reports.length > 0 && (
              <button
                onClick={() => setShowReports(!showReports)}
                className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  showReports
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <span>📢</span>
                <span>Citizen Reports ({reports.length})</span>
              </button>
            )}

            {/* Toggle On-Map Directory Button */}
            <button
              onClick={() => setShowDirectoryPanel(!showDirectoryPanel)}
              className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                showDirectoryPanel
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <span>📍</span>
              <span>{showDirectoryPanel ? 'Hide On-Map Directory' : 'Show Locations Directory'}</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredPlaces.length}</strong> places
            {reports.length > 0 && showReports && (
              <span> + <strong className="text-purple-700">{reports.length}</strong> citizen alerts</span>
            )}
          </div>
        </div>
      </div>

      {/* Map + Overlays Container */}
      <div className="relative w-full h-[65vh] md:h-[calc(100vh-12rem)] flex-1">
        <MapContainer
          center={[18.7546, 73.4062]}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Smooth FlyTo controller when user selects a place from on-map directory */}
          <MapFlyToController targetPlace={selectedPlace} />

          {/* Places Markers on the map */}
          {filteredPlaces.map((place) => {
            const colors = getMarkerColors(place);
            const isSelected = selectedPlace?.id === place.id;

            return (
              <CircleMarker
                key={place.id}
                center={[place.lat, place.lng]}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  color: isSelected ? '#111827' : colors.border,
                  fillColor: colors.fill,
                  fillOpacity: isSelected ? 1 : 0.85,
                  weight: isSelected ? 4 : 2,
                }}
                eventHandlers={{
                  click: () => handleChooseLocation(place),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="font-sans text-xs font-semibold px-1 py-0.5">
                    {place.name}
                    {place.monsoon_restricted && (
                      <span className="text-red-600 block text-[10px]">⚠️ Monsoon Warning</span>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Citizen Reports Pins */}
          {showReports &&
            reports.map((report) => {
              const repColor = getReportColor(report.category);

              return (
                <CircleMarker
                  key={`report-${report.id}`}
                  center={[report.lat, report.lng]}
                  radius={8}
                  pathOptions={{
                    color: repColor.border,
                    fillColor: repColor.fill,
                    fillOpacity: 0.95,
                    weight: 3,
                    dashArray: '3, 3',
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs max-w-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-800">
                          {report.category}
                        </span>
                        <span className="text-[11px] font-bold text-red-600">
                          Severity: {report.severity}/5
                        </span>
                      </div>
                      <div className="font-bold text-gray-900 leading-snug">
                        {report.summary}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        🕒 Reported: {report.createdAt}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>

        {/* ON-MAP LOCATIONS DIRECTORY PANEL */}
        {showDirectoryPanel && (
          <aside
            aria-label="Lonavala Locations Directory"
            className="absolute top-4 left-4 z-20 w-80 sm:w-96 max-h-[82vh] bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200"
          >
            {/* Directory Header */}
            <div className="p-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  📍
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                    Locations Directory
                  </h3>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Choose to view & fly on map
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDirectoryPanel(false)}
                className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-xs transition"
                title="Hide directory overlay"
              >
                ✕
              </button>
            </div>

            {/* Search Input inside Directory */}
            <div className="p-3 border-b border-gray-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter locations by name, tag..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-slate-50"
                />
                <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">
                  🔍
                </span>
                {directorySearch && (
                  <button
                    onClick={() => setDirectorySearch('')}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List of Locations */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[50vh] divide-y divide-gray-100">
              {filteredPlaces.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 italic">
                  No places match your search or filter.
                </div>
              ) : (
                filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  const colors = getMarkerColors(place);

                  return (
                    <button
                      key={`dir-${place.id}`}
                      onClick={() => handleChooseLocation(place)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-500 shadow-sm ring-1 ring-emerald-400'
                          : 'bg-white hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 border"
                          style={{ backgroundColor: colors.fill, borderColor: colors.border }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-gray-900 truncate">
                            {place.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold uppercase text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-sm">
                              {place.category}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {place.approx_cost_inr === 0 ? 'Free' : `₹${place.approx_cost_inr}`}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ★ {place.scores.rating}
                            </span>
                          </div>
                          {place.monsoon_restricted && (
                            <span className="text-[9px] font-bold text-red-600 block mt-0.5">
                              ⚠️ Monsoon Warning
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}>
                          {isSelected ? '✓ On Map' : 'Select'}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          Safety: {place.scores.safety}/5
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-2.5 bg-slate-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
              <span>{filteredPlaces.length} places available</span>
              <span className="text-emerald-700 font-semibold">Tapping flies map to pin</span>
            </div>
          </aside>
        )}

        {/* Legend Overlay on Map */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-md border border-gray-200 text-xs hidden sm:block">
          <div className="font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-wider">Map Legend</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-red-700" />
              <span>Risk / Restricted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700" />
              <span>Attraction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700" />
              <span>Heritage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700" />
              <span>Food</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-700" />
              <span>Hotel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-purple-800 bg-purple-500" />
              <span className="font-semibold text-purple-900">Citizen Pin</span>
            </div>
          </div>
        </div>

        {/* Selected Place Card Modal / Floating Panel */}
        {selectedPlace && (
          <div className="absolute top-4 right-4 z-20 max-w-sm w-[90%] sm:w-96 animate-in fade-in slide-in-from-top-2 duration-200">
            <PlaceCard
              place={selectedPlace}
              onClose={() => onSelectPlace(null)}
              isWeatherAlert={isWeatherAlert}
            />
          </div>
        )}
      </div>
    </div>
  );
}
