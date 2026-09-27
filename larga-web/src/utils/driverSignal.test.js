import test from 'node:test';
import assert from 'node:assert/strict';
import { driverSignal } from './driverSignal.js';

const now = 1000000;
const driver = (age) => ({ isOnline: true, updatedAt: { toMillis: () => now - age } });

test('signal ages from high to low to lost without a new snapshot', () => {
  const jeepney = driver(0);
  assert.equal(driverSignal(jeepney, now + 45000).label, 'High signal');
  assert.equal(driverSignal(jeepney, now + 45001).label, 'Low signal');
  assert.equal(driverSignal(jeepney, now + 120001).label, 'Signal lost');
  assert.equal(driverSignal(driver(0), now).label, 'High signal');
});

test('unknown timestamps never imply a high signal', () => {
  assert.equal(driverSignal({ isOnline: true }, now).label, 'Signal unknown');
  assert.equal(driverSignal(driver(NaN), now).label, 'Signal unknown');
  assert.equal(driverSignal(driver(-60000), now).label, 'Signal unknown');
});

test('offline driver overrides a fresh timestamp', () => {
  assert.equal(driverSignal({ ...driver(0), isOnline: false }, now).label, 'Offline');
});

test('a stationary jeepney with a fresh heartbeat keeps a high signal', () => {
  assert.equal(driverSignal({ ...driver(10000), locationUpdatedAt: { toMillis: () => 0 } }, now).label, 'High signal');
});
