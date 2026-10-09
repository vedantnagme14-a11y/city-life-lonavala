'use client';

import { useEffect, useState } from 'react';
import { WeatherData } from '@/lib/types';

interface WeatherBannerProps {
  onWeatherLoaded?: (data: WeatherData) => void;
  overrideAlert?: boolean | null;
}

export default function WeatherBanner({ onWeatherLoaded, overrideAlert }: WeatherBannerProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=18.7546&longitude=73.4062&current=temperature_2m,precipitation&hourly=precipitation_probability&forecast_hours=6'
        );
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();

        const currentTemp = data.current?.temperature_2m ?? 24;
        const precip = data.current?.precipitation ?? 0;
        const hourlyProbs: number[] = data.hourly?.precipitation_probability ?? [];
        const maxProb = hourlyProbs.length > 0 ? Math.max(...hourlyProbs) : 0;

        const isAlert = precip > 2 || maxProb > 60;

        const weatherInfo: WeatherData = {
          temperature: currentTemp,
          precipitation: precip,
          maxPrecipitationProb: maxProb,
          isHeavyRainAlert: isAlert,
        };

        if (isMounted) {
          setWeather(weatherInfo);
          setLoading(false);
          if (onWeatherLoaded) onWeatherLoaded(weatherInfo);
        }
      } catch (err) {
        console.error('Weather error:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
          // Fallback safe state
          const fallback: WeatherData = {
            temperature: 24,
            precipitation: 0,
            maxPrecipitationProb: 15,
            isHeavyRainAlert: false,
          };
          setWeather(fallback);
          if (onWeatherLoaded) onWeatherLoaded(fallback);
        }
      }
    }

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [onWeatherLoaded]);

  if (loading) {
    return (
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 text-center text-xs sm:text-sm text-slate-600 flex items-center justify-center gap-2">
        <svg className="animate-spin h-4 w-4 text-emerald-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Checking Lonavala live weather via Open-Meteo...</span>
      </div>
    );
  }

  const isAlertActive = overrideAlert !== undefined && overrideAlert !== null ? overrideAlert : weather?.isHeavyRainAlert;

  if (isAlertActive) {
    return (
      <aside aria-label="Weather Alert" className="bg-red-600 text-white font-medium text-xs sm:text-sm px-4 py-3 shadow-inner flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 animate-pulse text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-center tracking-wide">
            Heavy rain alert: avoid waterfalls, dams and viewpoints
          </span>
          {weather && (
            <span className="hidden md:inline-block text-xs bg-red-700/80 px-2 py-0.5 rounded-sm border border-red-500">
              {weather.temperature}°C • Precip: {weather.precipitation}mm • Rain prob: {weather.maxPrecipitationProb}%
            </span>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Current Weather" className="bg-sky-50 border-b border-sky-100 text-sky-900 text-xs sm:text-sm px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Lonavala Live Weather: <strong className="font-bold text-sky-950">{weather?.temperature}°C</strong>
          </span>
          <span className="text-sky-700 text-xs hidden sm:inline">
            (Precipitation: {weather?.precipitation}mm, Rain risk: {weather?.maxPrecipitationProb}%)
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          Conditions Safe
        </span>
      </div>
    </aside>
  );
}
