'use client';

import { Place } from '@/lib/types';
import { calculateOverallScore } from '@/lib/score';

interface PlaceCardProps {
  place: Place;
  onClose?: () => void;
  isWeatherAlert?: boolean;
}

export default function PlaceCard({ place, onClose, isWeatherAlert }: PlaceCardProps) {
  const overall = calculateOverallScore(place.scores);

  const categoryBadgeColors: Record<string, string> = {
    heritage: 'bg-amber-100 text-amber-800 border-amber-300',
    attraction: 'bg-blue-100 text-blue-800 border-blue-300',
    food: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    hotel: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    risk: 'bg-red-100 text-red-800 border-red-300',
  };

  const scoreLabels = [
    { key: 'safety', label: 'Safety', val: place.scores.safety, max: 5 },
    { key: 'cleanliness', label: 'Cleanliness', val: place.scores.cleanliness, max: 5 },
    { key: 'affordability', label: 'Affordability', val: place.scores.affordability, max: 5 },
    { key: 'rating', label: 'Rating', val: place.scores.rating, max: 5 },
    { key: 'accessibility', label: 'Accessibility', val: place.scores.accessibility, max: 5 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden w-full max-w-md transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 relative bg-slate-50">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center border border-gray-200 shadow-xs transition"
            aria-label="Close card"
          >
            ✕
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-2 pr-8">
          <span
            className={`text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
              categoryBadgeColors[place.category] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {place.category}
          </span>

          {place.monsoon_restricted && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isWeatherAlert
                  ? 'bg-red-600 text-white animate-pulse shadow-xs'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              ⚠️ Monsoon Restricted
            </span>
          )}

          {place.category === 'risk' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
              High Risk Area
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 leading-snug">{place.name}</h3>

        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
          <div>
            Price: <strong className="text-gray-900 font-semibold">{place.approx_cost_inr === 0 ? 'Free' : `₹${place.approx_cost_inr}`}</strong>
            {place.price_level > 0 && <span className="ml-1 text-gray-400">({'₹'.repeat(place.price_level)})</span>}
          </div>
          <div>
            Overall Score: <strong className="text-emerald-700 font-bold text-sm">{overall}</strong> / 5
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed">{place.description}</p>

        {/* 5 Scores */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
            5 Quality & Safety Scores
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {scoreLabels.map((s) => (
              <div key={s.key} className="flex flex-col">
                <div className="flex justify-between items-center text-gray-700 mb-0.5">
                  <span className="font-medium">{s.label}</span>
                  <span className="font-bold text-gray-900">{s.val} / {s.max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      s.key === 'safety' && s.val < 3
                        ? 'bg-red-500'
                        : s.val >= 4
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${(s.val / s.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note / Advisory */}
        {place.note && (
          <div
            className={`p-3 rounded-lg text-xs leading-relaxed border ${
              place.monsoon_restricted || place.category === 'risk'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <strong>Note / Advisory:</strong> {place.note}
          </div>
        )}

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
