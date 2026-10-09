'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '@/lib/types';

export interface RouteWithRisk {
  id: number;
  coordinates: [number, number][]; // [lng, lat]
  distanceMeters: number;
  durationSeconds: number;
  riskCount: number;
  riskPlaces: Place[];
  isSafest: boolean;
}

interface RouteMapProps {
  fromPlace: Place | null;
  toPlace: Place | null;
  routes: RouteWithRisk[];
  safestRoute: RouteWithRisk | null;
  riskPlacesOnChosenRoute: Place[];
}

function MapBoundsUpdater({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 14 });
    }
  }, [coordinates, map]);

  return null;
}

export default function RouteMap({
  fromPlace,
  toPlace,
  routes,
  safestRoute,
  riskPlacesOnChosenRoute,
}: RouteMapProps) {
  const centerLat = fromPlace ? fromPlace.lat : 18.7546;
  const centerLng = fromPlace ? fromPlace.lng : 73.4062;

  // Collect all coordinates for bounds fitting
  const allCoords = safestRoute ? safestRoute.coordinates : [];

  return (
    <div className="w-full h-[55vh] md:h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-xs relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allCoords.length > 0 && <MapBoundsUpdater coordinates={allCoords} />}

        {/* 1. Draw alternative routes in grey dashed */}
        {routes
          .filter((r) => !r.isSafest)
          .map((route) => {
            const positions = route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
            return (
              <Polyline
                key={`alt-${route.id}`}
                positions={positions}
                pathOptions={{
                  color: '#6b7280',
                  weight: 4,
                  dashArray: '8, 8',
                  opacity: 0.7,
                }}
              >
                <Tooltip sticky>
                  <span className="text-xs font-semibold">
                    Alternative Route ({route.riskCount} risk spot{route.riskCount === 1 ? '' : 's'})
                  </span>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* 2. Draw the safest route (fewest risk points) in solid green */}
        {safestRoute && (
          <Polyline
            key={`safest-${safestRoute.id}`}
            positions={safestRoute.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])}
            pathOptions={{
              color: '#16a34a',
              weight: 6,
              opacity: 0.95,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-bold text-emerald-800">
                Safest Route • {safestRoute.riskCount} risk points
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* Origin Marker */}
        {fromPlace && (
          <CircleMarker
            center={[fromPlace.lat, fromPlace.lng]}
            radius={9}
            pathOptions={{
              color: '#065f46',
              fillColor: '#10b981',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              <span className="font-bold text-xs text-emerald-900">Start: {fromPlace.name}</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Destination Marker */}
        {toPlace && (
          <CircleMarker
            center={[toPlace.lat, toPlace.lng]}
            radius={9}
            pathOptions={{
              color: '#1e3a8a',
              fillColor: '#3b82f6',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              <span className="font-bold text-xs text-blue-900">End: {toPlace.name}</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Risk places along the chosen route */}
        {riskPlacesOnChosenRoute.map((place) => (
          <CircleMarker
            key={`risk-marker-${place.id}`}
            center={[place.lat, place.lng]}
            radius={8}
            pathOptions={{
              color: '#991b1b',
              fillColor: '#ef4444',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="text-xs font-bold text-red-700">
                ⚠️ Hazard: {place.name}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend on map */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-gray-200 text-xs shadow-md hidden sm:block">
        <div className="font-bold text-gray-700 text-[10px] uppercase mb-1">Route Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 bg-emerald-600 rounded-sm inline-block" />
            <span className="font-medium text-emerald-900">Safest Route (Fewest Risks)</span>
          </div>
          {routes.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-gray-500 inline-block" />
              <span className="text-gray-600">Alternative Route</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="text-red-700 font-medium">Near-Route Hazard (&lt;400m)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
