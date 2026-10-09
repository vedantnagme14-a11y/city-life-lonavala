# TRD — City Life: Lonavala

## Rules for the coding agent (save credits)
- Do exactly what each task says. No extra features, no refactors, no tests, no docs unless asked.
- Use ONLY the libraries listed below. Do not install anything else.
- Keep code simple; JavaScript or TypeScript, minimal files. Do not rewrite files that already work.
- Do not run long browser/test loops. One npm run build check at the end of each task is enough.

## Stack
- Next.js (App Router) + Tailwind CSS
- Map: leaflet + react-leaflet (OpenStreetMap tiles, no key)
- Weather: Open-Meteo REST (no key)
- Routing: OSRM public server https://router.project-osrm.org (no key)

## Folder structure
```
app/
  page.tsx             # Explore map + filters + weather banner
  compare/page.tsx     # Best vs worst + side-by-side
  route/page.tsx       # Route check + safety warnings
  report/page.tsx      # Citizen report form
  assistant/page.tsx   # AI / City guide assistant
components/            # Map.tsx, PlaceCard.tsx, Nav.tsx, WeatherBanner.tsx
data/places.json       # seed places (provided)
lib/score.ts           # overall score calculation
lib/geo.ts             # haversine + route risk check
```
