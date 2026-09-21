import { useEffect, useRef } from 'react';
import { MaplibreMap, Marker, NavigationControl } from '../services/maplibre';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants/map';
import { OSM_RASTER_STYLE } from '../constants/mapStyle';



function buildMarkerElement(marker) {
  const el = document.createElement('div');

  if (marker.variant === 'start' || marker.variant === 'end') {
    const isStart = marker.variant === 'start';
    el.title = isStart ? 'Origin / Start' : 'Destination / End';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', el.title);
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${isStart ? '#f57c1f' : '#ef4444'}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    return el;
  }

  if (marker.variant === 'you') {
    el.className =
      'w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md shadow-black/30';
    el.title = 'You are here';
    return el;
  }

  el.className =
    'w-10 h-10 rounded-full bg-white border-2 border-primary shadow-lg shadow-black/25 flex items-center justify-center cursor-pointer';

  const img = document.createElement('img');
  img.src = '/larga-jeep/larga-jeep.png';
  img.alt = 'Jeepney';
  img.className = 'w-7 h-7 object-contain';
  el.appendChild(img);

  return el;
}

// The jeep illustration is drawn nose-up, so rotating it by the driver's
// compass heading points it the way the jeepney is actually travelling.
// Rotate the image, never the marker container — MapLibre owns the
// container's transform and would overwrite it on the next frame.
function applyHeading(el, heading) {
  const img = el.querySelector('img');
  if (!img) return;
  img.style.transform = typeof heading === 'number' ? `rotate(${heading}deg)` : '';
}

// Wraps a route's path coordinates as GeoJSON for the route-path line layer.
function routeLineToGeoJSON(routeLine) {
  if (!routeLine || routeLine.length < 2) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeLine } },
    ],
  };
}

export default function JeepneyMap({ markers = [], center, focus, routeLine, onMarkerClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  // The style has to finish loading before a source or layer can be added, and
  // routeLine usually arrives first (it's fetched while the tiles load).
  const styleLoadedRef = useRef(false);
  // `center` arrives as null and then updates once the browser resolves the
  // user's position. Recenter on that first fix only — after it, the map
  // belongs to whoever is panning it.
  const hasCenteredRef = useRef(false);
  // A marker's click listener is attached once, when the marker is created,
  // but the callback is a fresh closure on every render (it reads the current
  // driver list). Going through a ref means an old listener still calls the
  // current callback instead of one holding last render's positions.
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  // Read inside the map's own 'load' handler, which was created before this
  // render's props existed.
  const routeLineRef = useRef(routeLine);
  routeLineRef.current = routeLine;

  useEffect(() => {
    const map = new MaplibreMap({
      container: containerRef.current,
      style: OSM_RASTER_STYLE,
      center: center ?? DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    // The route path, as a dashed orange line. Added once the style is ready,
    // empty until a route is chosen; after that only its data is swapped, so
    // switching routes never re-adds the layer.
    map.on('load', () => {
      styleLoadedRef.current = true;
      if (map.getSource('route-path')) return;
      map.addSource('route-path', { type: 'geojson', data: routeLineToGeoJSON(null) });
      map.addLayer({
        id: 'route-path-line',
        type: 'line',
        source: 'route-path',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#f57c1f',
          'line-width': 5,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1.4],
        },
      });
      // The line is fetched before the style finishes loading often enough
      // that it has to be applied here too, not only in the effect below.
      if (routeLineRef.current) {
        map.getSource('route-path').setData(routeLineToGeoJSON(routeLineRef.current));
      }
    });

    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
    // Mount once: re-creating the map on every prop change would reload tiles
    // and throw away the user's current view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    map.easeTo({ center, zoom: DEFAULT_ZOOM });
  }, [center]);

  // Swap the drawn path whenever the chosen route changes, and frame it so the
  // whole run is on screen — a line you have to pan around to find is no more
  // use than no line at all.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;
    const source = map.getSource('route-path');
    if (!source) return;

    source.setData(routeLineToGeoJSON(routeLine));
    if (!routeLine || routeLine.length < 2) return;

    const bounds = routeLine.reduce(
      (acc, [lng, lat]) => [
        [Math.min(acc[0][0], lng), Math.min(acc[0][1], lat)],
        [Math.max(acc[1][0], lng), Math.max(acc[1][1], lat)],
      ],
      [
        [routeLine[0][0], routeLine[0][1]],
        [routeLine[0][0], routeLine[0][1]],
      ]
    );
    // Padded generously on the left and bottom, where the nearby-jeepneys
    // panel sits over the map.
    map.fitBounds(bounds, { padding: { top: 130, right: 60, bottom: 80, left: 80 }, duration: 800 });
  }, [routeLine]);

  // An explicit "take me there" — tapping a jeepney in the list, or the
  // recenter button. Keyed rather than watched on the coordinate, so a
  // jeepney's own movement doesn't drag the camera along with it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus?.coordinate) return;
    map.flyTo({ center: focus.coordinate, zoom: Math.max(map.getZoom(), 15), speed: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key]);

  // Reconcile the marker set against the current props: move the ones that
  // are still there, add the new ones, drop the jeepneys that went offline.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set();

    markers.forEach((marker) => {
      seen.add(marker.id);
      const existing = markersRef.current[marker.id];

      if (existing) {
        existing.setLngLat(marker.coordinate);
        applyHeading(existing.getElement(), marker.heading);
        return;
      }

      const el = buildMarkerElement(marker);
      applyHeading(el, marker.heading);
      if (marker.variant === 'jeepney') {
        el.addEventListener('click', () => onMarkerClickRef.current?.(marker.id));
      }
      markersRef.current[marker.id] = new Marker({
        element: el,
        anchor: marker.variant === 'start' || marker.variant === 'end' ? 'bottom' : 'center',
      })
        .setLngLat(marker.coordinate)
        .addTo(map);
    });

    Object.keys(markersRef.current).forEach((id) => {
      if (seen.has(id)) return;
      markersRef.current[id].remove();
      delete markersRef.current[id];
    });
  }, [markers]);

  // Sized with h-full/w-full rather than `absolute inset-0`, and that is not a
  // style preference. MapLibre adds its own `maplibregl-map` class to this
  // element, and its stylesheet — which is unlayered, so it outranks anything
  // Tailwind puts in @layer utilities no matter the import order — sets
  // `position: relative`. That quietly beats `absolute`, `inset-0` then
  // contributes no height, and the container collapses to 0px tall: a map that
  // is fully working and completely invisible. Explicit height doesn't care
  // what `position` ends up being.
  return <div ref={containerRef} className="h-full w-full" />;
}
