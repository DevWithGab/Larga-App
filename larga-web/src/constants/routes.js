import { distanceMeters } from '../utils/geo';

// The actual jeepney routes running in this service area (Nueva Vizcaya, PH),
// along the Santa Fe–Aritao–Bambang–Bayombong–Solano corridor. Each one runs
// back and forth between its two towns — there is no fixed "forward" route,
// just whichever direction a given jeepney is currently headed.
//
// `icon`: an Ionicons name used as a plain, generic "journey" glyph on the
// route picker — deliberately NOT a claim about a specific landmark in
// either town (we don't have verified data for that), just visual variety
// so the five rows are easy to tell apart at a glance.
//
// `fare`: the real flat fare (in pesos) for riding this route end-to-end,
// same in either direction — not a distance-based estimate, the actual
// amount operators charge on each of these routes.
export const ROUTES = [
  { id: 'bayombong-bambang', code: '01', towns: ['Bayombong', 'Bambang'], icon: 'trail-sign-outline', fare: 30 },
  { id: 'bayombong-solano', code: '02', towns: ['Bayombong', 'Solano'], icon: 'flag-outline', fare: 15 },
  { id: 'bambang-solano', code: '03', towns: ['Bambang', 'Solano'], icon: 'leaf-outline', fare: 45 },
  { id: 'bayombong-aritao', code: '04', towns: ['Bayombong', 'Aritao'], icon: 'compass-outline', fare: 70 },
  { id: 'santafe-aritao', code: '05', towns: ['Santa Fe', 'Aritao'], icon: 'navigate-outline', fare: 30 },
];

// Real town-center coordinates ([lng, lat], to match the rest of the app's
// map code) — used to draw each route on the map and as fallback endpoint
// markers when a routed path can't be fetched.
export const TOWN_COORDS = {
  'Santa Fe': [120.9378, 16.1592],
  Aritao: [121.0338, 16.2973],
  Bambang: [121.1075, 16.3872],
  Bayombong: [121.1481, 16.4804],
  Solano: [121.1825, 16.5271],
};

export function getRoute(routeId) {
  return ROUTES.find((route) => route.id === routeId) ?? null;
}

// The two endpoint coordinates for a route, in the same order as
// `route.towns` — i.e. [coordOf(towns[0]), coordOf(towns[1])].
export function getRouteEndpoints(route) {
  if (!route) return null;
  const [a, b] = route.towns;
  if (!TOWN_COORDS[a] || !TOWN_COORDS[b]) return null;
  return [TOWN_COORDS[a], TOWN_COORDS[b]];
}

// Straight-line distance between a route's two towns, in whole km. Not a
// road distance (there's no routing data at this layer), but real geography
// rather than a guess — enough for a "how far apart are these two towns"
// cue on a route card or the route picker.
export function routeDistanceKm(route) {
  const endpoints = getRouteEndpoints(route);
  if (!endpoints) return null;
  const [[lngA, latA], [lngB, latB]] = endpoints;
  const meters = distanceMeters({ latitude: latA, longitude: lngA }, { latitude: latB, longitude: lngB });
  return meters == null ? null : Math.round(meters / 1000);
}

// The route as a commuter would name it: the two towns it runs between, with
// no direction implied. Route codes ("01", "02") are real — operators use them
// — but they mean nothing to someone deciding which jeepney to wait for, so
// anywhere a route has to be *chosen* rather than identified, use this.
// An en dash, not an arrow: these routes run back and forth, so neither town
// is the destination.
export function routePairLabel(route) {
  if (!route) return null;
  const [a, b] = route.towns;
  return `${a} – ${b}`;
}

// direction: 'forward' (towns[0] -> towns[1]) | 'reverse' (towns[1] -> towns[0])
export function routeLabel(route, direction = 'forward') {
  if (!route) return null;
  const [a, b] = route.towns;
  return direction === 'reverse' ? `${b} → ${a}` : `${a} → ${b}`;
}
