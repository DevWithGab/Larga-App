// Straight-line distance between two { latitude, longitude } points, in
// meters (haversine formula). Good enough for "how far is this jeepney"
// proximity alerts — no routing/road-distance needed for that.
export function distanceMeters(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Compass bearing FROM point a TO point b, in degrees (0 = due north, 90 =
// east, 180 = south, 270 = west) — the direction of travel between two real
// GPS fixes. Used to rotate the jeepney icon to face the way it's actually
// driving, instead of leaving it pointing the same way regardless of turns.
export function bearingDegrees(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// "350 m away" / "1.2 km away" — no fake precision once it's far.
// `suffix` lets callers phrase it differently (e.g. "to Solano" instead of
// "away") without duplicating the rounding rules.
export function formatDistance(meters, suffix = 'away') {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m ${suffix}`;
  return `${(meters / 1000).toFixed(1)} km ${suffix}`;
}

// Rough ETA from straight-line distance — there's no real routing/traffic
// data to work with, so this assumes a flat average speed for a jeepney
// making stops on a local road (~18 km/h). It's an estimate, not a promise;
// callers should show it as "~N min", not a bare number.
const ASSUMED_SPEED_KMH = 18;

export function estimateEtaMinutes(meters) {
  if (meters == null) return null;
  const minutes = (meters / 1000 / ASSUMED_SPEED_KMH) * 60;
  return Math.max(1, Math.round(minutes));
}
