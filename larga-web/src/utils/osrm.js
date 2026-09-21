// Fetches a real, road-following path between two points from the public
// OSRM demo routing server — no API key required, the same "free public
// service, no account" pattern already used for the OpenFreeMap map tiles.
// Note: this demo server is meant for light/prototype use, not guaranteed
// production uptime — fine for this app's scale, but worth knowing.
export async function fetchRoutePath(coordA, coordB) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${coordA[0]},${coordA[1]};${coordB[0]},${coordB[1]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const coordinates = data?.routes?.[0]?.geometry?.coordinates;
    return Array.isArray(coordinates) && coordinates.length > 1 ? coordinates : null;
  } catch (error) {
    console.warn('Failed to fetch route path:', error.message);
    return null;
  }
}
