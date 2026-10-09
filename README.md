# City Life: Lonavala

> **A smart, budget-aware, and safety-first guide for Lonavala.**  
> Powered by open data, real-time meteorological forecasts, and citizen reports — **No API keys needed and No database required**.

Live Demo: [https://city-life-lonavala.vercel.app](https://city-life-lonavala.vercel.app) *(Placeholder)*

---

## 🎯 The Problem

Visitors and weekend tourists from Mumbai and Pune often encounter scattered and fragmented information when visiting Lonavala:
- Where to eat authentic and budget-friendly meals.
- Which heritage sites and trekking routes are family-friendly versus steep.
- Crucial monsoon hazards: fatal waterfall drowning spots (e.g. Bhushi Dam, Pavana Dam) and dangerous ghat choke points under prohibitory orders.
- Unpredictable Sahyadri monsoon rainfall leading to localized flash floods and landslides.

**City Life: Lonavala** solves this by unifying local directory data, live weather conditions, hazard routing, and crowdsourced citizen incident alerts into a single, lightning-fast web application.

---

## ✨ Features (All 6 MVP Features Implemented)

### 1. 🗺️ Interactive Explore Map (`/`)
- Client-only dynamic **Leaflet** map with OpenStreetMap tiles centered on Lonavala (`18.7546, 73.4062`).
- Distinct category-coded markers:
  - 🔴 **Red markers** for high-risk zones and monsoon-restricted destinations.
  - 🟡 **Amber** for Heritage & Forts, 🔵 **Blue** for Attractions, 🟢 **Emerald** for Food, 🟣 **Indigo** for Hotels.
- Category filter chips (`All`, `Attractions`, `Heritage`, `Food`, `Hotels`, `Risk Zones`, `Monsoon Restricted Only`).
- Clicking markers opens an in-depth **Place Card** featuring descriptions, costs, advisory notes, and the 5 quality/safety scores (Safety, Cleanliness, Affordability, Rating, Accessibility).
- Displays live crowdsourced citizen report pins directly on the map with popup details.

### 2. ⛈️ Live Weather Alert Banner
- Integrates the free **Open-Meteo REST API** (`https://api.open-meteo.com/v1/forecast`).
- Real-time rule: If precipitation $> 2\text{ mm}$ or maximum 6-hour rain probability $> 60\%$, automatically triggers a prominent alert:
  > **"Heavy rain alert: avoid waterfalls, dams and viewpoints"**
- Marks monsoon-restricted destinations with animated caution badges.
- Includes a live weather condition monitor and manual alert simulation toggle for dry weather testing.

### 3. ⚖️ Place Comparison Engine (`/compare`)
- 5 interactive weight sliders (Safety $35\%$, Cleanliness $20\%$, Affordability $20\%$, Rating $15\%$, Accessibility $10\%$) powering:
  $$\text{Overall Score} = w_{\text{safety}} \cdot \text{safety} + w_{\text{cleanliness}} \cdot \text{cleanliness} + w_{\text{affordability}} \cdot \text{affordability} + w_{\text{rating}} \cdot \text{rating} + w_{\text{accessibility}} \cdot \text{accessibility}$$
- **Best 3** and **Worst 3** ranked lists with colored score progress bars.
- Side-by-side comparison table for 2–3 selected destinations with **automatic best-value highlighting** in every attribute row.

### 4. 🛣️ Safer Route & Corridor Hazard Check (`/route`)
- Two dropdowns to select *From* and *To* locations.
- Connects to the free public **OSRM driving router** (`https://router.project-osrm.org`).
- Evaluates candidate routes using the Haversine formula to detect any risk areas or monsoon restrictions lying within $400\text{ m}$ of the corridor (sampling every 10th point).
- Renders the safest route in **solid green** and alternatives in **dashed grey**.
- Displays warning cards and notes for all flagged hazards along the route.

### 5. 📢 Citizen Incident Reporting (`/report`)
- Incident submission form with:
  - Description textarea.
  - Interactive Leaflet pin map (tap to place/move pin) + **"Use my location"** geolocation button.
  - Image upload with automatic client-side canvas downscaling to $\le 400\text{px}$ Data URL.
- **Offline NLP Classifier (`lib/nlp.ts`)**: Auto-classifies category (`safety`, `cleanliness`, `traffic`, `weather`, `other`), assigns severity ($1\text{–}5$), and summarizes the incident into 12 words.
- Persists to `localStorage` key `"cl_reports"`, automatically seeding 3 realistic sample Lonavala reports when first loaded.

### 6. 🤖 Offline AI City Assistant (`/assistant`)
- 100% client-side natural language processor (`lib/assistant.ts`) with zero external API keys.
- Detects user intent (cheapest, safest, best, comparison), budget thresholds (`"under 300"`), tags (`veg`, `family`, `rain`, `trek`), and categories.
- During rainy/monsoon inquiries, automatically excludes prohibited water bodies and prioritizes indoor/rain-safe spots.
- Returns 2–3 specific recommendations with one-line rationales, pricing, safety notes, and proximity warnings for any recent citizen incident within $1\text{ km}$.
- Includes 4 quick-action suggested question chips.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Mapping**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) with OpenStreetMap tiles
- **Live Weather**: [Open-Meteo REST API](https://open-meteo.com/) *(No key required)*
- **Routing Engine**: [OSRM Public Routing API](https://project-osrm.org/) *(No key required)*
- **Intelligence**: Offline keyword NLP classifier & rule-based assistant *(No LLM API keys required)*
- **Storage**: Browser LocalStorage & Static JSON *(No database required)*

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x, 20.x, or newer
- npm or yarn

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/city-life-lonavala.git
   cd city-life-lonavala
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Start production server:**
   ```bash
   npm run start
   ```

> 🔒 **No API Keys or Database Setup Required:**  
> The application is completely functional out of the box with zero environment variables or database configurations.

---

## 📂 Project Structure

```
├── app/
│   ├── page.tsx               # Explore map, weather banner & directory
│   ├── compare/page.tsx       # Weight sliders, rankings & comparison matrix
│   ├── route/page.tsx         # OSRM routing & corridor hazard detection
│   ├── report/page.tsx        # Citizen reporting form with pin map
│   ├── assistant/page.tsx     # Offline AI chat guide & suggestion chips
│   ├── layout.tsx             # Root layout with top navigation
│   └── globals.css            # Tailwind & Leaflet global styles
├── components/
│   ├── Nav.tsx                # Responsive top navigation header
│   ├── Map.tsx                # Client-only main Leaflet map
│   ├── PlaceCard.tsx          # Place details, 5 scores & advisory badge
│   ├── WeatherBanner.tsx      # Open-Meteo live weather & alert banner
│   ├── RouteMap.tsx           # Route polyline renderer (green/grey dashed)
│   └── ReportPinMap.tsx       # Tappable incident pin map
├── data/
│   └── places.json            # Curated Lonavala seed directory
├── lib/
│   ├── assistant.ts           # Offline natural language guide engine
│   ├── geo.ts                 # Haversine distance & 400m risk checker
│   ├── nlp.ts                 # Keyword classifier (category, severity, summary)
│   ├── reports.ts             # LocalStorage manager & 3 seed reports
│   ├── score.ts               # Weighted score calculation formula
│   └── types.ts               # Shared TypeScript data models
└── README.md
```

---

## 📜 License
MIT License. Built for community safety and tourism exploration.
