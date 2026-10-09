# PRD — City Life: Lonavala

## Problem
Visitors to Lonavala juggle scattered info: where to eat and stay on a budget, which sites are heritage-worthy, which spots are unsafe (monsoon drownings, congested highway), and live weather. Result: bad trips and risky choices.

## Goal
One smart web app that turns Lonavala data + citizen reports into clear, safe, budget-aware recommendations. Built in 2 hours; Lonavala is the prototype city (design is city-agnostic).

## Users
- Tourist (family/friends weekend trip from Mumbai/Pune)
- Budget traveller / student
- Local citizen reporting issues

## MVP features (must ship)
1. Explore map — Leaflet map, category filters (attraction, heritage, food, hotel, risk), place card with scores, price, tips.
2. Best vs Worst compare — rank places by Safety, Cleanliness, Affordability, Rating, Accessibility + overall weighted score; select 2-3 places to compare side by side.
3. Safety layer — risk zones shown in red; monsoon-restricted spots flagged; safer-route check between two places (warns if route passes near risk spots, prefers alternative with fewer).
4. Citizen reports — form (text + optional photo + map pin). AI classifies category, severity 1-5, one-line summary. Saved and shown on map.
5. Live city insights — current weather + rain probability from Open-Meteo; banner like "Heavy rain: avoid waterfalls/dams".
6. AI assistant — chat answering from the app's data ("safe cheap veg food near Karla Caves").

## Out of scope (mention as roadmap)
Voice notes, social-media scraping, user auth, native mobile app, real-time traffic feed, payments.

## Scoring
Overall = 0.35 Safety + 0.20 Cleanliness + 0.20 Affordability + 0.15 Rating + 0.10 Accessibility (each 1-5). Weights adjustable via sliders.

## Demo script (2 min)
1. Open map, filter heritage -> Bhaja Caves card.
2. Compare Bhushi Dam vs Tungarli Lake -> safety gap + monsoon warning.
3. Route Lonavala Station -> Lohagad: show risk warning.
4. Submit a citizen report ("waterlogged road near market") -> AI tags it -> pin appears.
5. Ask the assistant a budget question.

## Data note
Seed scores are illustrative, drawn from public info (e.g., 2024 Pune district prohibitory orders at Bhushi Dam, Tiger/Lion's/Rajmachi Point, Pavana Dam). Citizen reports gradually replace them. Coordinates approximate.
