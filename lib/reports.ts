import { CitizenReport } from './types';

export const CL_REPORTS_KEY = 'cl_reports';

export const SEED_REPORTS: CitizenReport[] = [
  {
    id: 'seed-rep-1',
    text: 'Waterlogged road and heavy flood puddles near Khandala underpass making two-wheeler transit dangerous',
    category: 'weather',
    severity: 4,
    lat: 18.7520,
    lng: 73.3950,
    summary: 'Waterlogged road and heavy flood puddles near Khandala underpass...',
    createdAt: 'Today, 08:30 AM',
  },
  {
    id: 'seed-rep-2',
    text: 'Slippery wet steps at Bhaja Caves caused a tourist fall accident on steep stairs',
    category: 'safety',
    severity: 4,
    lat: 18.7343,
    lng: 73.4700,
    summary: 'Slippery wet steps at Bhaja Caves caused a tourist...',
    createdAt: 'Today, 10:15 AM',
  },
  {
    id: 'seed-rep-3',
    text: 'Garbage, dirty plastic food containers and smelly waste accumulating along Tiger Point cliff trail',
    category: 'cleanliness',
    severity: 2,
    lat: 18.7106,
    lng: 73.3729,
    summary: 'Garbage, dirty plastic food containers and smelly waste accumulating along...',
    createdAt: 'Today, 11:45 AM',
  },
];

export function getStoredReports(): CitizenReport[] {
  if (typeof window === 'undefined') return SEED_REPORTS;

  try {
    const raw = localStorage.getItem(CL_REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(CL_REPORTS_KEY, JSON.stringify(SEED_REPORTS));
      return SEED_REPORTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(CL_REPORTS_KEY, JSON.stringify(SEED_REPORTS));
      return SEED_REPORTS;
    }
    return parsed;
  } catch {
    return SEED_REPORTS;
  }
}

export function saveReport(report: CitizenReport): CitizenReport[] {
  if (typeof window === 'undefined') return [report];

  const current = getStoredReports();
  const updated = [report, ...current];
  localStorage.setItem(CL_REPORTS_KEY, JSON.stringify(updated));
  return updated;
}
