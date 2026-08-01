# CommunityIQ — GPS & Live Mapping Module — Testing Report

**Date:** 1 Aug 2026
**Version:** Live at `https://communityiq-green.vercel.app/map` (backend `https://communityiq-api.onrender.com/api/v1`)

---

## 1. Automated Verification (completed — PASS)

| Test | Method | Result |
|---|---|---|
| GPS coordinates backfill | PostGIS `ST_SetSRID(ST_MakePoint(...))` at startup for issues with NULL location | ✅ 6 issues now carry lat/lng around Kolkata |
| `/gis/explore` (filters + distance + reporter + AI verification) | Live API call | ✅ 200, distances in km (0 km bug fixed & re-deployed) |
| `/gis/search` (address/landmark/ward/PIN/dept + issues) | Live API call `q=MG Road` | ✅ 6 geocoded places (OSM Nominatim) + 1 issue match |
| `/gis/reverse-geocode` | Live API call (22.5726, 88.3639) | ✅ "Chatterjee Lane, Bowbazar, Kolkata, 700073" |
| `/gis/ai-overlay` (risk zones, hotspots, duplicates, community health) | Live API call | ✅ duplicate groups detected |
| `/gis/nearby-similar` | Live API call | ✅ returns similar issues within radius |
| `/gis/geofence` | Live API call | ✅ `inAffectedArea:false` (was 500 — camelCase column quoting fixed) |
| `/gis/wards`, `/gis/clusters`, `/gis/heatmap-data`, `/gis/risk-zones` | Live API call | ✅ 200 |
| **Real-time sync** — create issue over REST → Socket.IO `issue:update` event | Node socket client + citizen login | ✅ `type:"created"` received; `type:"removed"` received on delete |
| Frontend production build | `next build` (Node 18 & 24) | ✅ clean; marker clustering v3 (React 18 compatible) |
| Vercel deploy | GitHub → Production | ✅ success (was failing on peer-dep conflict — fixed) |
| Render deploy | API-triggered | ✅ live |

## 2. Manual Test Checklist (phone + desktop)

### 2.1 GPS Permission Flow
1. Open `/map` on a **fresh browser/incognito** (no location permission yet).
2. Browser prompts for location → expect: "Acquiring GPS..." pill, then blue pulsing dot + accuracy circle appears, pill → "GPS Active", address pill shows reverse-geocoded street.
3. **Deny path:** block location → red banner appears: "Location permission denied… Retry GPS" button; map falls back to city center view. Tap browser 🔒 icon → allow → Retry GPS → dot appears.
4. **Unsupported:** disable geolocation in browser → "No GPS support" pill.

### 2.2 Live Tracking
5. Walk (or use DevTools Sensors → move location): blue dot moves, `deviceorientation` compass needle rotates (phones only), accuracy ±N m shown in dot popup.
6. **Recenter FAB** (crosshair) → flies to your position.

### 2.3 Markers & Clusters
7. Issue pins colored by status; red pulsing ring on urgent/high-risk; click pin → popup (title, address, status, priority, AI-verified badge, distance, age) → "View Details" opens right-side panel.
8. Zoom out → pins cluster into numbered green/orange/red bubbles by avg risk; zoom in → split.

### 2.4 Detail Panel
9. Panel shows: category, priority, severity (risk score), status, department, created time, **distance from you**, reporter, AI verification (confidence, duplicate probability, summary), progress, PIN, ward, community votes, similar-issues box, Directions (opens Google Maps), Share (native or clipboard), Full page.

### 2.5 Filters (instant)
10. Funnel FAB → panel: category (16), priority, status groups, department, radius slider 0.5–50 km, date since, toggles: ✅ verified, 🤖 AI verified, 🚨 emergency only. Each change updates count + markers instantly without reload.

### 2.6 Search
11. Type "MG Road" → grouped results (Places / Issues / Departments); pick a place → map flies to it; pick an issue → panel opens.

### 2.7 Real-Time
12. Open `/map` in **two devices**, log in as citizen@test.com on one; in the other, report an issue (`/report`) → marker appears live on the map without refresh (Socket.IO).
13. Change status/priority as admin → pin color/panel updates live; resolved → marker turns green.

### 2.8 AI Overlays
14. Sparkles FAB → toggle: Heatmap (red hot spots), Risk Zones (circles), AI Predicted (⚠ pulsing), Duplicates (🔁 markers), Community (✓/~).

### 2.9 Edge Cases
15. **Offline:** airplane mode → "You are offline" banner; last-synced markers remain; tile cache shows map.
16. **Slow internet:** throttling → "Polling" pill instead of "Live"; data still loads.
17. **Fullscreen FAB**, **measure tool** (click 2 points → distance line + popup), list drawer (bottom-right count button).

### 2.10 Mobile/Responsive
18. iPhone/Android: map fills screen, FABs reachable, panels scroll; GPS via cellular works; compass rotates.
19. Desktop: sidebar layout intact, all panels glassmorphism in dark & light mode (OS theme toggle).

## 3. Known Notes
- `/ai/chat` returns mock assistant until an OpenAI/Gemini key is added to Render env vars.
- Nominatim (OSM) geocoding is rate-limited (~1 req/s); responses cached 1 h server-side.
- Live sync falls back to 30 s polling when the socket disconnects.
