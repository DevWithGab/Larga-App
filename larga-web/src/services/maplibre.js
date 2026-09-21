import { setWorkerUrl } from 'maplibre-gl';


setWorkerUrl(`${import.meta.env.BASE_URL}maplibre/maplibre-gl-worker.mjs`);

export { Map as MaplibreMap, Marker, NavigationControl } from 'maplibre-gl';
