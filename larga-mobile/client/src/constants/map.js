// OpenFreeMap's hosted "liberty" style — free, no API key/account needed, and
// (unlike MapLibre's own demo style) has real street-level OpenStreetMap data
// worldwide, donation-funded. Swap to a paid provider (MapTiler, Stadia Maps,
// self-hosted tiles) later if this needs a custom look or an SLA.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Fallback camera center used until the device's own location is available —
// Bayombong, Nueva Vizcaya, the hub town of the actual route network (see
// src/constants/routes.js): it's an endpoint of 3 of the 5 routes.
export const DEFAULT_CENTER = [121.1481, 16.4804]; // [lng, lat]
export const DEFAULT_ZOOM = 13;
