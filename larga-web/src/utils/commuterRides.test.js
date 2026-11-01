import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCommuterRides } from './commuterRides.js';

const routes = [{ id: 'route-a', code: '01', towns: ['Bayombong', 'Solano'] }];
const ride = (id, overrides = {}) => ({ id, routeId: 'route-a', direction: 'forward', location: { latitude: 16.5, longitude: 121.15 }, ...overrides });

test('ranks rides from the commuter and does not change source snapshots', () => {
  const drivers = [ride('far', { location: { latitude: 16.6, longitude: 121.2 } }), ride('near')];
  const result = selectCommuterRides(drivers, { location: [121.15, 16.5] });
  assert.deepEqual(result.map((driver) => driver.id), ['near', 'far']);
  assert.equal(result[0].distance, 0);
  assert.equal(drivers[0].id, 'far');
  assert.equal('distance' in drivers[0], false);
});

test('combines town search, selected route, direction, and reported seats', () => {
  const drivers = [ride('match', { seatCapacity: 20, passengerCount: 10 }),
    ride('opposite', { direction: 'reverse', seatCapacity: 20, passengerCount: 10 }),
    ride('full', { seatCapacity: 20, passengerCount: 20 }), ride('unknown'),
    ride('other', { routeId: 'route-b', seatCapacity: 20, passengerCount: 10 })];
  const result = selectCommuterRides(drivers, { routes, routeId: 'route-a', direction: 'forward', seatsOnly: true, search: ' SOLANO ' });
  assert.deepEqual(result.map((driver) => driver.id), ['match']);
  assert.equal(selectCommuterRides(drivers, { routes, search: 'missing' }).length, 0);
});

test('both directions and unreported seats remain visible by default without location', () => {
  const result = selectCommuterRides([ride('a'), ride('b', { direction: 'reverse' })]);
  assert.equal(result.length, 2);
  assert.ok(result.every((driver) => driver.distance === null));
});

test('invalid driver coordinates never reach the map or distance calculation', () => {
  assert.equal(selectCommuterRides([ride('valid'), ride('missing', { location: null }),
    ride('invalid', { location: { latitude: NaN, longitude: 121 } }),
    ride('out-of-range', { location: { latitude: 91, longitude: 121 } })]).length, 1);
});
