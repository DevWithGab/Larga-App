# larga-web

The browser version of the Larga mobile app. Same Firebase project, same Firestore
documents, same brand — an account made on the phone signs in here, and a route
saved here is saved there.

See the [root README](../README.md) for the shared data model and how the two
clients fit together.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview  # serve the production build locally
```

## Configuration

`.env.local` holds the Firebase config and must point at the **same project** as
`larga-mobile/client/src/services/firebase.js`. Copy `.env.example` if you don't
have one. Vite inlines these at build time — restart the dev server after editing
them, and remember everything in the bundle is public. Firestore rules, not the
config, are what protect the data.

## PWA

The web app is installable and works offline for its shell. `vite-plugin-pwa`
(Workbox) generates `dist/manifest.webmanifest` and `dist/sw.js` at build time.

The service worker is **off in development** (`devOptions.enabled: false`) — one
caching a Vite dev bundle is a reliable way to lose an afternoon to stale
modules. To exercise it:

```bash
npm run build && npm run preview
# then DevTools → Application → Service Workers / Manifest
```

What is cached, and what deliberately is not:

| | Strategy |
| --- | --- |
| App shell (JS, CSS, HTML, icons, hero artwork, MapLibre worker) | precached, 24 entries |
| `tile.openstreetmap.org` | CacheFirst, 400 entries, 14 days |
| Google Fonts | CacheFirst (files) / StaleWhileRevalidate (CSS) |
| **Firestore, Identity Toolkit, secure token** | **never cached** |

That last row is the important one. Jeepney positions are seconds old by
definition — serving them from a cache would draw a jeepney on a street it left
an hour ago — and auth tokens must never be cached at all. Firestore's SDK has
its own offline persistence; a service worker must not second-guess it. So the
app opens offline, but it will not show live jeepneys without a connection.

Caching OSM tiles is not only a speed win: their
[tile policy](https://operations.osmfoundation.org/policies/tiles/) asks heavy
users to cache, and a five-route corridor's tiles barely change.

Icons in `public/icons/` were generated from `larga-mobile/client/assets/icon.png`
(1254px) — 192, 512, a maskable 512 with the art inside an 80% safe zone, and a
180px apple-touch-icon. Regenerate them if the brand icon changes.

`registerType: 'autoUpdate'` ships a new worker as soon as one is built, rather
than waiting for every tab to close; a transit app serving a days-old build is
worse than one that refreshes under you.

**Deployment needs HTTPS** — service workers only run on HTTPS or localhost — plus
the SPA rewrite already noted in the root README.

## Map tiles

The web map draws raster tiles from OpenStreetMap's own tile server — OSM's rendering of OSM data, the look you get on openstreetmap.org. The style is `src/constants/mapStyle.js`.

The mobile app uses OpenFreeMap's vector "liberty" style instead (`MAP_STYLE_URL` in `constants/map.js`). Both are OpenStreetMap data, different renderings of it, so the two clients don't look identical right now.

**Before this ships publicly it needs its own tile host.** OSM's [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) covers development and low-volume use, not production apps — the options are OpenFreeMap (what mobile uses), MapTiler, Stadia Maps, or self-hosted tiles. Keeping the style behind one constant makes that a one-line change.

Displaying "© OpenStreetMap contributors" is a condition of using the data, on any provider. It's in the source's `attribution` field and MapLibre's attribution control renders it — don't remove it.

## Tailwind and MapLibre's stylesheet

MapLibre's CSS is **unlayered**, and in the CSS cascade unlayered rules outrank anything inside a cascade layer — which is where Tailwind v4 puts every utility (`@layer utilities`). So a `.maplibregl-*` rule beats a Tailwind class on the same element regardless of import order, and no amount of reshuffling the imports in `index.css` changes that.

This already cost one invisible map: the map container had `absolute inset-0`, MapLibre added its own `maplibregl-map` class whose rule sets `position: relative`, that silently won, `inset-0` stopped contributing height, and the container collapsed to 0px tall — a fully working map, rendering nothing. It's now sized with `h-full w-full`, which doesn't depend on `position` at all.

When styling any MapLibre-owned element, use plain CSS in `index.css` (as the attribution rule does) or Tailwind's `!` important modifier. Tailwind v3 didn't have this problem because its utilities were unlayered, so patterns copied from v3 examples can fail here in exactly this quiet way.

## The MapLibre worker

MapLibre GL JS v6 loads its worker by URL — `new URL('./maplibre-gl-worker.mjs', import.meta.url)` — and that worker imports `./maplibre-gl-shared.mjs` from the same folder. Neither file survives bundling: Vite's dep optimizer rewrites the main module into `node_modules/.vite/deps` without its siblings, and the production build inlines the library into a hashed chunk without emitting the worker at all. Either way the map requests a file that isn't there, gets a 404, and renders an empty grey pane.

So `scripts/copy-maplibre-worker.mjs` copies both files verbatim into `public/maplibre/` (gitignored, regenerated by `postinstall`, `predev` and `prebuild`), and `src/services/maplibre.js` points MapLibre at them with `setWorkerUrl()`. **Import MapLibre through `src/services/maplibre.js`, never from `maplibre-gl` directly** — that module is what configures the worker before any map can be constructed.

If the map ever goes blank again after upgrading MapLibre, check that `public/maplibre/` exists and that those two filenames haven't changed in the new version.

## How it maps to the mobile app

| This repo | Mobile counterpart |
| --- | --- |
| `src/pages/MapPage.jsx` | `screens/commuter/CommuterMainScreen.js` |
| `src/pages/RoutesPage.jsx` | `screens/commuter/RoutesScreen.js` |
| `src/pages/AlertsPage.jsx` | `screens/commuter/AlertsScreen.js` |
| `src/pages/CommuterLoginPage.jsx` | `screens/auth/CommuterLoginScreen.js` |
| `src/components/JeepneyMap.jsx` | `components/JeepneyMap.js` |
| `src/components/CommuterLayout.jsx` | `navigation/CommuterTabs.js` |
| `src/pages/DriverLoginPage.jsx` | `screens/auth/DriverLoginScreen.js` |
| `src/pages/DriverSignUpPage.jsx` | `screens/auth/DriverSignUpScreen.js` |
| `src/pages/DriverTripsPage.jsx` | `screens/driver/ReportScreen.js` |
| `src/App.jsx` | `navigation/AppNavigator.js` |
| `src/contexts/AuthContext.jsx` | `contexts/AuthContext.js` |

`src/constants/{routes,map,colors}.js` and `src/utils/{geo,driverPresence,driverAuth,trips,osrm}.js`
are byte-identical copies of the mobile files. Change one, copy it across.

## Things that differ from mobile, and why

- **Auth persistence.** Native uses AsyncStorage / in-memory; the web uses
  `browserLocalPersistence` / `browserSessionPersistence`. `setSessionPersistence(remember)`
  keeps the same call signature on both sides.
- **Tailwind version.** v4 here (theme in `src/index.css` under `@theme`, no config
  file), v3 on mobile because NativeWind requires it. The tokens are mirrored by hand.
- **Type classes.** Mobile names them by role — `font-heading`, `font-accent` — because
  each Baloo 2 weight is a separate font file there. The same names are defined as
  custom utilities in `index.css` so ported JSX keeps working; on the web they set a
  weight on one variable font.
- **Layout.** The phone's bottom tab bar becomes a side rail, and the map's bottom
  sheet becomes a side panel, once the viewport is wide enough. Same destinations,
  same order.
- **Sidebar.** The side rail collapses to icons (240px → 80px, remembered in
  `localStorage`), names who is signed in, and carries a log out button pinned to
  its foot. All of it is wide-screen only — the phone keeps its four-tab bar, where
  logging out lives on the Profile tab exactly as it does in the mobile app.
  Collapsed, the rail shows the "L♀" lockup **CSS-cropped out of the wordmark** it
  already loads (see `collapsedMark` in `CommuterLayout.jsx`): `favicon.png` is a
  leftover default that isn't Larga at all, and `icon.png` is 1254px/1.4MB of fine
  road detail that would be mush at 40px. If the wordmark file is ever replaced,
  those crop offsets need recomputing.
- **Nearby-jeepneys panel sizing.** On the phone layout it's a bottom sheet that
  drags between three stops — peek, half, nearly full — snapping to the nearest on
  release, with a tap to cycle and arrow keys for the keyboard; the choice is
  remembered in `localStorage` (`hooks/useResizableSheet.js`). On a wide screen it
  is instead a card anchored to the bottom-left whose height follows its content,
  capped at the map's height, with a chevron to collapse it to its header. It
  deliberately has no top inset: stretching it top to bottom left an empty list
  covering a quarter of the map.
- **Errors.** Inline messages instead of `Alert.alert` — a browser modal would block
  the page.
- **Route lines.** Picking a route filter draws its path as a dashed orange line
  and frames it with `fitBounds`. It appears instantly as the straight line
  between the two town centres, then upgrades to the real road-following path
  once OSRM answers (a few seconds) — the same two-step as the mobile
  RouteMapScreen. The source and layer are added once on the map's `load` event
  and only their data is swapped afterwards, so switching routes never re-adds
  them. Note `router.project-osrm.org` is a public demo server: fine at this
  scale, not something to depend on in production.
- **Route filter labels.** The map's filter pills name the towns a route runs
  between ("Bayombong – Solano") rather than its code ("02"). The codes are real
  and operators use them, but they tell a commuter nothing about where a jeepney
  goes, so anywhere a route is *chosen* rather than identified, use
  `routePairLabel()`. Pills match on route id, so the wording can change freely.
  The mobile map screen was changed the same way.
- **Map tiles.** Raster from OpenStreetMap's tile server here, OpenFreeMap vector tiles on mobile — see [Map tiles](#map-tiles) above.
- **Splash is a landing page, not an onboarding slide.** The mobile splash is a
  phone onboarding screen — one full-bleed orange column, a single stacked CTA and
  carousel pagination dots — which on a desktop reads as a phone screenshot floating
  in a browser. The web version keeps the brand and the "Never miss your ride."
  promise but lays it out as a page: header with sign-in, a two-column hero with
  both roles as separate doors, a row explaining what the app does, and a footer.
  Its numbers (route count, towns, lowest fare) are read from the route data, so the
  copy can't quietly start lying when a route or fare changes.
- **Full-bleed map.** The mobile screen stacks a white header above the map; on the
  web the map fills the pane and the search bar and route pills float over it. The
  strip holding them is `pointer-events-none` with `pointer-events-auto` on each
  control, so dragging the gaps between them pans the map instead of hitting an
  invisible full-width panel. MapLibre's zoom buttons are hidden below `md`, where
  they would sit under the search bar and pinch-to-zoom covers them anyway.
- **Drivers can read, not broadcast.** They sign in at `/driver` with their mobile
  number and password (`utils/driverAuth.js` derives the synthetic email both apps
  use — no SMS or OTP anywhere) and get their trip history at `/trips`. Starting a
  trip and sharing a live position stay on the phone: a browser tab stops reporting
  position once the phone locks, which would drop a jeepney off every commuter's
  map mid-route.
- **Editable profile.** `updateProfile` in `AuthContext` is the app's `updateDoc`
  call; it patches the context's `profile` too, so the sidebar updates without a
  reload. The mobile app has the same function and an equivalent edit sheet.
