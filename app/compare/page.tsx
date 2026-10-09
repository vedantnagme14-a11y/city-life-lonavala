'use client';

import { useState, useMemo } from 'react';
import placesData from '@/data/places.json';
import { Place } from '@/lib/types';
import { calculateOverallScore, ScoreWeights, DEFAULT_WEIGHTS } from '@/lib/score';

export default function ComparePage() {
  const places = placesData as Place[];

  // 5 weight sliders (defaults above)
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selected 2-3 places for side-by-side comparison (default to 2 places for immediate demonstration)
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([
    'bhushi-dam',
    'tungarli-lake',
  ]);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'attraction', label: 'Attractions' },
    { id: 'heritage', label: 'Heritage & Forts' },
    { id: 'food', label: 'Food & Dhabas' },
    { id: 'hotel', label: 'Hotels & Lodges' },
    { id: 'risk', label: 'Risk Zones' },
  ];

  // Filter places by category
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'all') return places;
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  // Score each place using the weights
  const scoredPlaces = useMemo(() => {
    return filteredPlaces.map((p) => ({
      place: p,
      overall: calculateOverallScore(p.scores, weights),
    })).sort((a, b) => b.overall - a.overall);
  }, [filteredPlaces, weights]);

  // "Best 3" and "Worst 3" lists by overall score
  const best3 = useMemo(() => scoredPlaces.slice(0, 3), [scoredPlaces]);
  const worst3 = useMemo(() => {
    if (scoredPlaces.length <= 3) return [...scoredPlaces].reverse();
    return [...scoredPlaces].slice(-3).reverse();
  }, [scoredPlaces]);

  // Handle selecting / unselecting places for the side-by-side table
  const handleTogglePlace = (id: string) => {
    if (selectedPlaceIds.includes(id)) {
      if (selectedPlaceIds.length > 2) {
        setSelectedPlaceIds(selectedPlaceIds.filter((pId) => pId !== id));
      } else {
        // Keep at least 1 or allow unselecting down to 0 with feedback
        setSelectedPlaceIds(selectedPlaceIds.filter((pId) => pId !== id));
      }
    } else {
      if (selectedPlaceIds.length >= 3) {
        // Shift oldest and add new
        setSelectedPlaceIds([selectedPlaceIds[1], selectedPlaceIds[2], id]);
      } else {
        setSelectedPlaceIds([...selectedPlaceIds, id]);
      }
    }
  };

  const selectedPlaces = useMemo(() => {
    return selectedPlaceIds
      .map((id) => places.find((p) => p.id === id))
      .filter((p): p is Place => Boolean(p));
  }, [selectedPlaceIds, places]);

  // Best values for each row in side-by-side table
  const rowBestValues = useMemo(() => {
    if (selectedPlaces.length === 0) return {};

    const maxSafety = Math.max(...selectedPlaces.map((p) => p.scores.safety));
    const maxCleanliness = Math.max(...selectedPlaces.map((p) => p.scores.cleanliness));
    const maxAffordability = Math.max(...selectedPlaces.map((p) => p.scores.affordability));
    const maxRating = Math.max(...selectedPlaces.map((p) => p.scores.rating));
    const maxAccessibility = Math.max(...selectedPlaces.map((p) => p.scores.accessibility));
    const maxOverall = Math.max(...selectedPlaces.map((p) => calculateOverallScore(p.scores, weights)));
    const minPrice = Math.min(...selectedPlaces.map((p) => p.approx_cost_inr));

    return {
      safety: maxSafety,
      cleanliness: maxCleanliness,
      affordability: maxAffordability,
      rating: maxRating,
      accessibility: maxAccessibility,
      overall: maxOverall,
      price: minPrice,
    };
  }, [selectedPlaces, weights]);

  // Helper for score bar color
  const getScoreBarColor = (score: number) => {
    if (score >= 4.0) return 'bg-emerald-500';
    if (score >= 3.2) return 'bg-blue-500';
    if (score >= 2.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Place Comparison & Scoring Engine
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Adjust the 5 scoring weights, filter categories, inspect Best 3 & Worst 3 rankings, and compare 2–3 places side by side.
        </p>
      </div>

      {/* 1. Five Weight Sliders */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">1. Adjust Scoring Formula Weights</h2>
            <p className="text-xs text-gray-500">
              Formula: <code>overall = {weights.safety.toFixed(2)}*safety + {weights.cleanliness.toFixed(2)}*cleanliness + {weights.affordability.toFixed(2)}*affordability + {weights.rating.toFixed(2)}*rating + {weights.accessibility.toFixed(2)}*accessibility</code>
            </p>
          </div>
          <button
            onClick={() => setWeights(DEFAULT_WEIGHTS)}
            className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition self-start sm:self-auto"
          >
            Reset to Default Weights
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Safety Slider */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Safety</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                {(weights.safety).toFixed(2)} ({Math.round(weights.safety * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.safety}
              onChange={(e) => setWeights({ ...weights, safety: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.0</span>
              <span>Default: 0.35</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Cleanliness Slider */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Cleanliness</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                {(weights.cleanliness).toFixed(2)} ({Math.round(weights.cleanliness * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.cleanliness}
              onChange={(e) => setWeights({ ...weights, cleanliness: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.0</span>
              <span>Default: 0.20</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Affordability Slider */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Affordability</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                {(weights.affordability).toFixed(2)} ({Math.round(weights.affordability * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.affordability}
              onChange={(e) => setWeights({ ...weights, affordability: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.0</span>
              <span>Default: 0.20</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Rating Slider */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Rating</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                {(weights.rating).toFixed(2)} ({Math.round(weights.rating * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.rating}
              onChange={(e) => setWeights({ ...weights, rating: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.0</span>
              <span>Default: 0.15</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Accessibility Slider */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Accessibility</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                {(weights.accessibility).toFixed(2)} ({Math.round(weights.accessibility * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.accessibility}
              onChange={(e) => setWeights({ ...weights, accessibility: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.0</span>
              <span>Default: 0.10</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Filter */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">2. Filter by Category</h2>
          <span className="text-xs text-gray-500 font-medium">
            Filtering {filteredPlaces.length} places
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition shadow-2xs ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. "Best 3" and "Worst 3" list with colored score bars */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best 3 List */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h3 className="font-extrabold text-gray-900 text-base">Best 3 Places</h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Highest Overall Score
            </span>
          </div>

          <div className="space-y-4">
            {best3.map((item, idx) => {
              const p = item.place;
              const barColor = getScoreBarColor(item.overall);
              const percentage = Math.min(100, Math.max(0, (item.overall / 5) * 100));

              return (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-gray-900">{p.name}</span>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-800">
                      {item.overall.toFixed(2)} <span className="text-[11px] font-normal text-gray-500">/ 5</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{p.category}</span>
                    <span>Safety: {p.scores.safety}/5 • Cost: {p.approx_cost_inr === 0 ? 'Free' : `₹${p.approx_cost_inr}`}</span>
                  </div>

                  {/* Colored Score Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Worst 3 List */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-red-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="font-extrabold text-gray-900 text-base">Worst 3 Places</h3>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              Lowest Overall Score
            </span>
          </div>

          <div className="space-y-4">
            {worst3.map((item, idx) => {
              const p = item.place;
              const barColor = getScoreBarColor(item.overall);
              const percentage = Math.min(100, Math.max(0, (item.overall / 5) * 100));

              return (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-gray-900">{p.name}</span>
                    </div>
                    <span className="font-extrabold text-sm text-red-800">
                      {item.overall.toFixed(2)} <span className="text-[11px] font-normal text-gray-500">/ 5</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">
                      {p.category} {p.monsoon_restricted && '(Monsoon Restricted)'}
                    </span>
                    <span>Safety: {p.scores.safety}/5 • Cost: {p.approx_cost_inr === 0 ? 'Free' : `₹${p.approx_cost_inr}`}</span>
                  </div>

                  {/* Colored Score Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Side-by-Side Comparison Section (User selects 2-3 places) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                3. Side-by-Side Comparison (Select 2–3 Places)
              </h2>
              <p className="text-xs text-gray-500">
                Click places below to toggle them into the comparison table. Best value in each row is highlighted automatically!
              </p>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-gray-600">Selected: </span>
              <span className={`font-extrabold ${selectedPlaceIds.length >= 2 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {selectedPlaceIds.length} / 3 places
              </span>
            </div>
          </div>

          {/* Place Selector Chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {places.map((place) => {
              const isSelected = selectedPlaceIds.includes(place.id);
              return (
                <button
                  key={place.id}
                  onClick={() => handleTogglePlace(place.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {place.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side-by-side comparison table */}
        {selectedPlaces.length < 2 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm">
            Please select at least <strong>2 places</strong> (up to 3) from the options above to view the side-by-side comparison matrix.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              {/* Table Header: Place Names */}
              <thead>
                <tr className="bg-slate-100 border-b border-gray-200">
                  <th className="p-3 sm:p-4 font-bold text-gray-700 w-36 sm:w-48">
                    Metric / Attribute
                  </th>
                  {selectedPlaces.map((p) => (
                    <th key={p.id} className="p-3 sm:p-4 font-extrabold text-gray-900 border-l border-gray-200 min-w-[200px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm sm:text-base font-bold">{p.name}</div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-gray-200 text-gray-700 mt-1 inline-block">
                            {p.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTogglePlace(p.id)}
                          className="text-gray-400 hover:text-red-600 text-xs p-1"
                          title="Remove from comparison"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {/* Overall Score Row */}
                <tr className="bg-slate-50/70">
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Overall Score
                    <span className="block text-[11px] font-normal text-gray-500">Based on active weights</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const score = calculateOverallScore(p.scores, weights);
                    const isBest = score === rowBestValues.overall;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 transition ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-black' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-extrabold">{score.toFixed(2)}</span>
                          {isBest && (
                            <span className="text-[10px] uppercase tracking-wide bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Safety Score Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Safety Score
                    <span className="block text-[11px] font-normal text-gray-500">Weight: {(weights.safety).toFixed(2)}</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const val = p.scores.safety;
                    const isBest = val === rowBestValues.safety;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{val} / 5</span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Cleanliness Score Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Cleanliness Score
                    <span className="block text-[11px] font-normal text-gray-500">Weight: {(weights.cleanliness).toFixed(2)}</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const val = p.scores.cleanliness;
                    const isBest = val === rowBestValues.cleanliness;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{val} / 5</span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Affordability Score Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Affordability Score
                    <span className="block text-[11px] font-normal text-gray-500">Weight: {(weights.affordability).toFixed(2)}</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const val = p.scores.affordability;
                    const isBest = val === rowBestValues.affordability;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{val} / 5</span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Rating Score Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Rating Score
                    <span className="block text-[11px] font-normal text-gray-500">Weight: {(weights.rating).toFixed(2)}</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const val = p.scores.rating;
                    const isBest = val === rowBestValues.rating;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{val} / 5</span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Accessibility Score Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Accessibility Score
                    <span className="block text-[11px] font-normal text-gray-500">Weight: {(weights.accessibility).toFixed(2)}</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const val = p.scores.accessibility;
                    const isBest = val === rowBestValues.accessibility;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{val} / 5</span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Price Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Price (Approx. Cost)
                    <span className="block text-[11px] font-normal text-gray-500">Lower cost = better value</span>
                  </td>
                  {selectedPlaces.map((p) => {
                    const isBest = p.approx_cost_inr === rowBestValues.price;
                    return (
                      <td
                        key={p.id}
                        className={`p-3 sm:p-4 border-l border-gray-200 ${
                          isBest ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {p.approx_cost_inr === 0 ? 'Free (₹0)' : `₹${p.approx_cost_inr}`}
                            {p.price_level > 0 && <span className="text-gray-400 text-xs ml-1">({'₹'.repeat(p.price_level)})</span>}
                          </span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ★ Best Value
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Advisory / Note Row */}
                <tr>
                  <td className="p-3 sm:p-4 font-bold text-gray-900">
                    Note / Advisory
                    <span className="block text-[11px] font-normal text-gray-500">Safety alerts</span>
                  </td>
                  {selectedPlaces.map((p) => (
                    <td key={p.id} className="p-3 sm:p-4 border-l border-gray-200 text-xs text-gray-700">
                      {p.monsoon_restricted && (
                        <div className="mb-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-sm inline-block">
                          ⚠️ Monsoon Restricted
                        </div>
                      )}
                      <div>{p.note || 'No specific hazard note.'}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
