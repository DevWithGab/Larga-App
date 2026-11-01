import { distanceMeters } from './geo.js';
import { seatAvailability } from './seatAvailability.js';

export function selectCommuterRides(drivers, { routeId = 'all', direction = 'both', search = '', seatsOnly = false, location = null, routes = [] } = {}) {
  const term = search.trim().toLowerCase();
  return drivers.flatMap((driver) => {
    const point = driver.location;
    if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)
      || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) return [];
    if (routeId !== 'all' && driver.routeId !== routeId) return [];
    if (routeId !== 'all' && direction !== 'both' && (driver.direction ?? 'forward') !== direction) return [];
    if (seatsOnly && !(seatAvailability(driver).left > 0)) return [];
    const route = routes.find((item) => item.id === driver.routeId);
    if (term && ![route?.code, ...(route?.towns ?? []), driver.jeepneyNumber].filter(Boolean).join(' ').toLowerCase().includes(term)) return [];
    return [{ ...driver, distance: location ? distanceMeters({ latitude: location[1], longitude: location[0] }, point) : null }];
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
    || String(a.jeepneyNumber ?? a.id).localeCompare(String(b.jeepneyNumber ?? b.id)));
}
