// Web-only map style. Replaces MAP_STYLE_URL from constants/map.js, which is
// one of the files kept byte-identical with the mobile app — so the override
// lives here rather than editing that shared file.
//
// Raster tiles straight from OpenStreetMap's own tile server, rather than
// OpenFreeMap's vector "liberty" style. Both are OpenStreetMap data; this one
// is OSM's own rendering of it, the look you get on openstreetmap.org.
//
// IMPORTANT — OSM's Tile Usage Policy (https://operations.osmfoundation.org/policies/tiles/)
// covers development and low-volume use, NOT production apps. Before Larga
// ships to real commuters this needs its own tile host: OpenFreeMap (what the
// mobile app still uses), MapTiler, Stadia Maps, or self-hosted tiles. Keeping
// the style behind this one constant is what makes that a one-line change.
//
// Attribution is not decoration: displaying "© OpenStreetMap contributors" is
// a condition of using the data, on any provider. MapLibre's attribution
// control renders the string below, so don't drop it.
export const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      // OSM serves 256px tiles, and stops at zoom 19 — without maxzoom,
      // MapLibre would request zoom 20+ tiles that come back 404 and leave
      // holes in the map when someone zooms all the way in.
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};
