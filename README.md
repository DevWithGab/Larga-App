# Larga - Real-Time Jeepney Tracking

Larga tracks jeepneys in real time along the Santa Fe–Aritao–Bambang–Bayombong–Solano corridor in Nueva Vizcaya, PH. Drivers broadcast their GPS position; commuters watch the jeepneys move on a map and get alerted when one is close.

The repo holds **two clients that share one Firebase backend**:

| Folder | What it is | Stack | Status |
| --- | --- | --- | --- |
| `larga-mobile/client` | Commuter + driver mobile app | React Native (Expo) | Built |
| `larga-web` | Browser version of the same app | Vite + React + Tailwind | Commuter side running; driver side is mobile-only |

Both talk to the **same Firebase project** (`larga-614bd`) — same Auth users, same Firestore collections, same Storage bucket. There is no separate server: the Firestore document contract below *is* the API.

## 🚀 Features

- **Two user types**
  - **Commuters/Students:** track jeepneys in real time, view routes, save favourites, get proximity alerts
  - **Jeepney Drivers:** share GPS location while driving, log trips, report issues
- **Real-time GPS tracking** — drivers write their location to Firestore, commuters subscribe with `onSnapshot`
- **Fixed routes** — five real routes with real flat fares, defined in code (see [Routes](#-routes))
- **Firebase Authentication** — email/password for commuters, phone/OTP for drivers
- **MapLibre + OpenStreetMap** — free, open-source mapping on both platforms

## 📦 Tech Stack

### Shared backend

- **Firebase Auth** — one user pool for both clients
- **Cloud Firestore** — live driver positions, trips, alerts, saved routes
- **Firebase Storage** — user-uploaded assets

### `larga-mobile/client`

- React Native 0.86 on Expo SDK 57
- NativeWind (Tailwind CSS for React Native)
- `@maplibre/maplibre-react-native` + OpenStreetMap tiles
- React Navigation (stack + bottom tabs)
- `expo-location` / `expo-task-manager` for background GPS
- Icons: Expo Vector Icons, Heroicons, Lucide

### `larga-web`

- Vite 8 + React 19
- Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`; the theme lives in `src/index.css` under `@theme`
- Firebase Web SDK — the same modular SDK the mobile app uses, so query code ports over nearly unchanged
- MapLibre GL JS + OpenStreetMap raster tiles from `tile.openstreetmap.org` (mobile uses OpenFreeMap's vector style — same data, different rendering; see `larga-web/README.md`)
- React Router 7 for the screen graph, `lucide-react` for icons, Baloo 2 from Google Fonts
- `vite-plugin-pwa` (Workbox) — installable, offline app shell; live data is never cached (see `larga-web/README.md`)

The mobile app is stuck on Tailwind v3 (NativeWind 4 requires it), so the two can't literally share a config file. The brand tokens are mirrored by hand in `larga-web/src/index.css`.

## 🛠️ Setup

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Expo CLI + an Android emulator / iOS simulator (mobile only)

### Mobile app

```bash
cd larga-mobile/client
npm install

# Android
npm run android

# iOS (Mac only)
npm run ios

# Expo dev client
npm start
```

Firebase config lives in `larga-mobile/client/src/services/firebase.js`. Note that it imports auth from `@firebase/auth` directly so Metro resolves the React Native build — read the comment in that file before changing the import.

### Web app

```bash
cd larga-web
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle into dist/
```

Firebase config comes from `larga-web/.env.local`, which already points at the shared project. On a fresh clone, copy `.env.example` to `.env.local` and fill it from `larga-mobile/client/src/services/firebase.js` — it must be the **same project**, or the two clients won't see each other's data. Vite only exposes vars prefixed with `VITE_`, and restarting the dev server is required after editing them.

Before the web client ships publicly:

- add its domain under **Firebase Console → Authentication → Settings → Authorized domains**
- replace the Firestore test-mode rules with real per-role rules — the browser bundle is readable by anyone, so rules are the only thing protecting the data
- serve it with an SPA rewrite (all paths → `index.html`), since the app uses real URLs rather than hash routing
- serve it over **HTTPS** — the service worker (and so installability) only works on HTTPS or localhost

## 📁 Repo Structure

```
Larga-App/
├── larga-mobile/
│   └── client/
│       ├── src/
│       │   ├── components/     # JeepneyMap, RouteCard, Logo, ...
│       │   ├── screens/
│       │   │   ├── auth/       # splash, role selection, login/signup, driver OTP
│       │   │   ├── commuter/   # map, alerts, profile
│       │   │   ├── driver/     # home (broadcast), route, QR, report, profile
│       │   │   └── shared/     # RouteMapScreen
│       │   ├── navigation/     # AppNavigator + auth/commuter/driver stacks & tabs
│       │   ├── services/       # firebase.js, driverSession.js
│       │   ├── contexts/       # AuthContext
│       │   ├── hooks/          # useProximityAlerts, useHeading, useAnimatedCoordinate
│       │   ├── constants/      # colors.js, map.js, routes.js
│       │   └── utils/
│       ├── android/
│       ├── assets/
│       ├── App.js
│       └── package.json
└── larga-web/
    ├── public/                 # brand assets copied from the mobile app
    ├── src/
    │   ├── components/         # JeepneyMap, RouteCard, CommuterLayout, Logo
    │   ├── pages/              # Splash, RoleSelection, Login, SignUp, Map, Routes, Alerts, Profile
    │   ├── services/           # firebase.js (env-driven)
    │   ├── contexts/           # AuthContext
    │   ├── hooks/              # useOnlineDrivers, useMyLocation
    │   ├── constants/          # routes.js, map.js, colors.js — byte-identical copies of mobile's
    │   ├── utils/              # geo.js, driverPresence.js — likewise
    │   ├── App.jsx             # route graph + the signed-out / driver / commuter split
    │   └── index.css           # Tailwind v4 theme: brand colors and the font-* utilities
    ├── .env.example
    └── vite.config.js
```

Eight files are byte-identical copies of their mobile counterparts — `constants/routes.js`, `constants/map.js`, `constants/colors.js`, `utils/geo.js`, `utils/driverPresence.js`, `utils/driverAuth.js`, `utils/trips.js`, `utils/osrm.js`. Keep them that way, so a diff is the whole sync check:

```bash
for f in constants/routes.js constants/map.js constants/colors.js utils/geo.js utils/driverPresence.js utils/driverAuth.js utils/trips.js utils/osrm.js; do
  diff "larga-mobile/client/src/$f" "larga-web/src/$f" && echo "in sync: $f"
done
```

## 🎨 Brand Colors

From `larga-mobile/client/src/constants/colors.js` — mirror these in the web app's Tailwind config so both clients look like one product.

- Primary Orange: `#f57c1f` (light `#ff9f4a`, dark `#d66a15`)
- Black: `#000000`
- White: `#ffffff`
- Gray: `#9ca3af` (light gray `#f3f4f6`, border `#e5e7eb`)
- Secondary text: `#6b7280`

## 🔐 Authentication Flow

1. **Splash screen** → "LARGA NA!" welcome
2. **Role selection** → commuter or driver
3. **Login/Sign up** → email + password for commuters, phone + OTP for drivers
4. **Main app** → role-specific navigation

Both clients authenticate against the same Auth instance, so a `users/{uid}` document created on mobile is the same profile the web client reads.

## 📄 Firestore Collections

This is the contract shared by both clients — change it in one place and update the other.

```
users/{uid}
  - userType: 'commuter' | 'driver'
  - name: string
  - email: string
  - phoneNumber: string | null (drivers; optional for commuters, editable on web)
  - jeepneyNumber: string      (drivers)
  - verified: boolean          (drivers)
  - createdAt: timestamp
  - updatedAt: timestamp       # written by the web profile editor

drivers/{uid}                  # live broadcast state, one doc per driver
  - location: { latitude, longitude }
  - heading: number
  - routeId: string            # matches an id in constants/routes.js
  - direction: 'forward' | 'reverse'
  - isOnline: boolean
  - onBreak: boolean
  - passengerCount: number
  - updatedAt: timestamp       # heartbeat; stale docs are treated as offline

trips/{autoId}                 # written when a driver ends a session
  - driverId: string
  - routeId: string
  - direction: string
  - jeepneyNumber: string | null
  - passengerCount: number
  - durationSeconds: number
  - durationMinutes: number    # kept for trips recorded before durationSeconds existed
  - endedAt: timestamp

alerts/{autoId}                # commuter proximity alerts
  - commuterId: string         # queried with where('commuterId', '==', uid)
  - driverId: string           # watched live against drivers/{driverId}

savedRoutes/{...}              # commuter favourites
```

## 🗺️ Routes

The five routes are **defined in code, not Firestore** — `larga-mobile/client/src/constants/routes.js` holds their ids, codes, town pairs, real flat fares, and town-center coordinates (`[lng, lat]`). `drivers.routeId` and `trips.routeId` reference those ids.

When the web client needs them, extract this file into a small shared module rather than duplicating the list — the ids have to stay identical across clients.

## 🖥️ What the web app covers

Everything a commuter does, minus the two things that only make sense on a phone.

| Mobile screen | Web |
| --- | --- |
| Splash, Role selection | ✅ `/`, `/role` |
| Commuter login / sign up | ✅ `/login`, `/signup` |
| Commuter map (live jeepneys, route filters, ETAs) | ✅ `/map` |
| Routes tab (saved routes, running counts) | ✅ `/routes` |
| Alerts tab (view / cancel) | ✅ `/alerts` — setting a new alert is still mobile-only |
| Profile | ✅ `/profile` — **editable** (name, phone) |
| Tracking screen, QR scan | ❌ not ported |
| Driver login | ✅ `/driver` — mobile number + password |
| Driver sign up | ✅ `/driver/signup` |
| Driver trip reports | ✅ `/trips` |
| Driver dashboard (broadcasting), route screen, QR | ❌ mobile-only, on purpose |

Drivers sign in on the web and read their trip history; they cannot broadcast. A driver shares GPS for hours with the phone locked in a pocket, and a browser tab stops reporting position the moment it is backgrounded — the mobile app's background task and heartbeat are what make live tracking work. Reading finished trips has no such constraint.

Driver sign-in is ordinary email/password: `utils/driverAuth.js` turns the mobile number into a synthetic address (`{digits}@driver.larga.app`) that both apps derive the same way. There is no SMS or OTP involved.

## ✅ Next Steps

- [ ] Extract the eight shared constants/utils files into one module both clients import, instead of keeping copies in sync by hand
- [ ] Account deletion — the one CRUD gap left: it has to remove the Auth account, the profile, saved routes and alerts together
- [ ] Web: port the tracking screen (one jeepney, its trail, "Alert me")
- [ ] Web: smooth marker movement between GPS pings (mobile animates; the web markers currently jump)
- [ ] Move the web map off `tile.openstreetmap.org` before launch — OSM's tile policy doesn't cover production apps
- [ ] Replace `larga-mobile/client/assets/favicon.png` — it's still a leftover default, not the Larga mark
- [ ] Export a ~96px version of `icon.png` (the full file is 1254px/1.4MB) so small UI spots have a real raster mark
- [ ] Replace Firestore test-mode rules with real per-role security rules
- [ ] Driver verification workflow

## 📝 License

MIT

## 👨‍💻 Author

Built with ❤️ for Filipino commuters
