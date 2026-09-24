// Run: node --experimental-vm-modules --test src/services/driverSession.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function session({ commitError, driver = null } = {}) {
  const writes = [];
  let commits = 0;
  const context = vm.createContext({ Date, Math, Error });
  const api = {
    collection: (_, name) => name,
    doc: (parent, collection, id) => id ? `${collection}/${id}` : `${parent}/new-trip`,
    getDoc: async () => ({ exists: () => driver !== null, data: () => driver }),
    serverTimestamp: () => 'server-time',
    writeBatch: () => ({
      set: (ref, data, options) => writes.push({ ref, data: JSON.parse(JSON.stringify(data)), options }),
      commit: async () => { commits++; if (commitError) throw commitError; },
    }),
  };
  const firestore = new vm.SyntheticModule(Object.keys(api), function () {
    for (const [key, value] of Object.entries(api)) this.setExport(key, value);
  }, { context });
  const firebase = new vm.SyntheticModule(['db'], function () { this.setExport('db', {}); }, { context });
  const mod = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, 'driverSession.js'), 'utf8'), { context });
  await mod.link((name) => name === 'firebase/firestore' ? firestore : firebase);
  await mod.evaluate();
  return { ...mod.namespace, writes, commits: () => commits };
}

test('one commit saves a report and closes presence, retaining the final passenger count', async () => {
  const s = await session();
  await s.saveCompletedTrip('driver-a', { routeId: 'bayombong-solano', passengerCount: 9, durationSeconds: 42 });
  assert.equal(s.commits(), 1);
  assert.equal(s.writes.length, 2);
  assert.deepEqual(s.writes[0].data, {
    driverId: 'driver-a', routeId: 'bayombong-solano', direction: 'forward', jeepneyNumber: null,
    passengerCount: 9, durationSeconds: 42, durationMinutes: 1, endedAt: 'server-time',
  });
  assert.equal(s.writes[1].ref, 'drivers/driver-a');
  assert.deepEqual(s.writes[1].data, { isOnline: false, passengerCount: 0, updatedAt: 'server-time' });
  assert.equal(s.writes[1].options.merge, true);
});

test('a denied commit rejects so the screen can retain the trip and offer retry', async () => {
  const error = Object.assign(new Error('denied'), { code: 'permission-denied' });
  const s = await session({ commitError: error });
  await assert.rejects(s.saveCompletedTrip('driver-a', { durationSeconds: 60 }), error);
  assert.equal(s.commits(), 1);
});

test('ending immediately still records a zero-second trip', async () => {
  const s = await session();
  await s.saveCompletedTrip('driver-a', { durationSeconds: 0 });
  assert.equal(s.writes[0].data.durationSeconds, 0);
  assert.equal(s.commits(), 1);
});

test('signed-out saves and already-ended sessions do not write reports', async () => {
  const s = await session({ driver: { isOnline: false } });
  await assert.rejects(s.saveCompletedTrip(null, {}), /sign in/);
  await s.endActiveTrip('driver-a');
  assert.equal(s.commits(), 0);
});

test('logout closes an online trip using the persisted start time', async () => {
  const s = await session({ driver: { isOnline: true, passengerCount: 3, onlineSince: { toMillis: () => Date.now() - 90000 } } });
  await s.endActiveTrip('driver-a');
  assert.equal(s.commits(), 1);
  assert.equal(s.writes[0].data.durationSeconds, 90);
  assert.equal(s.writes[0].data.passengerCount, 3);
});
