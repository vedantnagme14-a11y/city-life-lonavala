'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { classify, ClassificationResult } from '@/lib/nlp';
import { CitizenReport } from '@/lib/types';
import { getStoredReports, saveReport } from '@/lib/reports';

// Client-only dynamic import for Report Pin Map
const ReportPinMap = dynamic(() => import('@/components/ReportPinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-slate-100 flex items-center justify-center border border-gray-300 text-xs text-slate-500">
      Loading interactive pin map...
    </div>
  ),
});

export default function ReportPage() {
  const [text, setText] = useState('');
  const [pinLat, setPinLat] = useState(18.7546);
  const [pinLng, setPinLng] = useState(73.4062);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [lastClassification, setLastClassification] = useState<ClassificationResult | null>(null);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load and seed reports from localStorage
  useEffect(() => {
    setReports(getStoredReports());
  }, []);

  // "Use my location" button
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPinLat(pos.coords.latitude);
        setPinLng(pos.coords.longitude);
        setLocationStatus(`Location found: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        setLocationStatus('Could not access GPS. Centered at Lonavala town.');
        setPinLat(18.7546);
        setPinLng(73.4062);
      },
      { timeout: 7000 }
    );
  };

  // Optional photo resized to max 400px as a data URL
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoDataUrl(resizedUrl);
        } else {
          setPhotoDataUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);

    // Classify using keyword-based classifier in lib/nlp.ts
    const result = classify(text);
    setLastClassification(result);

    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      text: text.trim(),
      category: result.category,
      severity: result.severity,
      lat: Number(pinLat.toFixed(4)),
      lng: Number(pinLng.toFixed(4)),
      summary: result.summary,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoUrl: photoDataUrl || undefined,
    };

    // Save report to localStorage key "cl_reports"
    const updated = saveReport(newReport);
    setReports(updated);

    setText('');
    setPhotoDataUrl(null);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Citizen Reporting Portal
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Report live road blocks, flood zones, safety concerns, or cleanliness issues. Submissions are classified client-side and saved locally.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-gray-900">Submit an Incident or Alert</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Textarea */}
            <div>
              <label htmlFor="report-text" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Incident Description *
              </label>
              <textarea
                id="report-text"
                rows={4}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe what you observed (e.g., 'waterlogged road and flood puddles after heavy rain, dangerous for children')..."
                className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setText('Dangerous slippery stairs and serious accident risk for children near Bhaja Caves')}
                  className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md"
                >
                  Test Sample 1 (Safety)
                </button>
                <button
                  type="button"
                  onClick={() => setText('Massive traffic jam and pothole on old highway road')}
                  className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md"
                >
                  Test Sample 2 (Traffic)
                </button>
              </div>
            </div>

            {/* Small Leaflet Pin Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pin Location on Map
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                >
                  <span>📍</span>
                  <span>Use My Location</span>
                </button>
              </div>

              {locationStatus && (
                <div className="text-[11px] text-gray-500 mb-2 italic">
                  {locationStatus}
                </div>
              )}

              <ReportPinMap
                pinLat={pinLat}
                pinLng={pinLng}
                onPinChange={(lat, lng) => {
                  setPinLat(lat);
                  setPinLng(lng);
                }}
              />
              <div className="text-[11px] text-gray-500 mt-1">
                Pin Coordinates: <strong>{pinLat.toFixed(4)}, {pinLng.toFixed(4)}</strong>
              </div>
            </div>

            {/* Optional photo resized to max 400px as a data URL */}
            <div>
              <label htmlFor="photo-file" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Attach Photo (Optional, auto-resized to max 400px)
              </label>
              <input
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
              {photoDataUrl && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={photoDataUrl}
                    alt="Resized preview"
                    className="h-28 w-auto rounded-lg border border-gray-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-sm transition shadow-xs"
            >
              Submit Citizen Report
            </button>
          </form>

          {/* Classification result display after submit */}
          {lastClassification && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Classification Result
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Verified & Saved
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Classified Category:</span>
                  <span className="font-extrabold text-gray-900 text-sm uppercase">
                    {lastClassification.category}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Assigned Severity:</span>
                  <span className="font-extrabold text-red-600 text-sm">
                    {lastClassification.severity} / 5
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-700 pt-1 border-t border-slate-200">
                <strong className="text-gray-900">Summary (First 12 words):</strong> {lastClassification.summary}
              </div>
            </div>
          )}
        </div>

        {/* Existing Reports Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Community Reports</h2>
            <span className="text-xs font-semibold text-gray-500">{reports.length} Reports</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {reports.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                        r.category === 'safety'
                          ? 'bg-red-100 text-red-800'
                          : r.category === 'weather'
                          ? 'bg-blue-100 text-blue-800'
                          : r.category === 'traffic'
                          ? 'bg-amber-100 text-amber-800'
                          : r.category === 'cleanliness'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r.category}
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      Severity: {r.severity}/5
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{r.createdAt}</span>
                </div>

                <div className="font-bold text-xs text-gray-900">{r.summary}</div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>

                {r.photoUrl && (
                  <div className="pt-1">
                    <img
                      src={r.photoUrl}
                      alt="Report attachment"
                      className="h-20 w-auto rounded-md border border-gray-100 object-cover"
                    />
                  </div>
                )}

                <div className="text-[10px] text-gray-400">
                  Coordinates: {r.lat}, {r.lng}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
