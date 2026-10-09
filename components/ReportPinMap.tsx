'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ReportPinMapProps {
  pinLat: number;
  pinLng: number;
  onPinChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onPinChange }: { onPinChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPinChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapPanToPin({ pinLat, pinLng }: { pinLat: number; pinLng: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([pinLat, pinLng]);
  }, [pinLat, pinLng, map]);
  return null;
}

export default function ReportPinMap({ pinLat, pinLng, onPinChange }: ReportPinMapProps) {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-300 relative">
      <MapContainer
        center={[pinLat, pinLng]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-0 cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onPinChange={onPinChange} />
        <MapPanToPin pinLat={pinLat} pinLng={pinLng} />

        <CircleMarker
          center={[pinLat, pinLng]}
          radius={11}
          pathOptions={{
            color: '#991b1b',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="text-xs font-bold text-red-700">Incident Pin</span>
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-700 shadow-xs border border-gray-200">
        Tap anywhere on the map to place/adjust pin
      </div>
    </div>
  );
}
