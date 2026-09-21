import test from 'node:test';
import assert from 'node:assert/strict';
import { savedRouteFields, writeSavedRoute } from './savedRoutes.js';

const routeId = 'bayombong-solano';
const fields = savedRouteFields({ routeId, name: ' School ', notes: ' Gate 2 ', direction: 'reverse' }, [routeId]);
function run(action, existing, overrides = {}) {
  const writes = [];
  const transaction = Object.fromEntries(['set', 'update', 'delete'].map((method) => [method, (...args) => writes.push([method, ...args])]));
  writeSavedRoute(transaction, 'bookmark', { exists: () => Boolean(existing), data: () => existing }, {
    action, uid: 'alice', fields, timestamp: 'server-time', ...overrides,
  });
  return writes;
}

test('validates existing routes, lengths, direction, and trims personal details', () => {
  assert.deepEqual(fields, { routeId, name: 'School', notes: 'Gate 2', direction: 'reverse' });
  assert.throws(() => savedRouteFields({ routeId: 'custom' }, [routeId]));
  assert.throws(() => savedRouteFields({ routeId, name: 'a'.repeat(61) }, [routeId]));
  assert.throws(() => savedRouteFields({ routeId, notes: 'a'.repeat(301) }, [routeId]));
  assert.throws(() => savedRouteFields({ routeId, direction: 'sideways' }, [routeId]));
});

test('old bookmarks can be saved without optional personal details', () => {
  assert.deepEqual(savedRouteFields({ routeId }, [routeId]), { routeId, name: '', notes: '', direction: 'forward' });
});

test('creation associates bookmark with user and timestamps', () => {
  assert.deepEqual(run('create', null), [['set', 'bookmark', { ...fields, commuterId: 'alice', createdAt: 'server-time', updatedAt: 'server-time' }]]);
});

test('duplicate create is rejected instead of overwriting existing notes', () => {
  assert.throws(() => run('create', { commuterId: 'alice', routeId }), /already saved/);
});

test('updates legacy bookmarks without overwriting owner or creation time', () => {
  assert.deepEqual(run('update', { commuterId: 'alice', routeId, createdAt: 'original' }), [['update', 'bookmark', { ...fields, updatedAt: 'server-time' }]]);
});

test('only own existing bookmarks may be edited or removed', () => {
  for (const action of ['update', 'delete']) {
    assert.throws(() => run(action, null), /no longer exists/);
    assert.throws(() => run(action, { commuterId: 'bob', routeId }), /your own/);
  }
  assert.throws(() => run('update', { commuterId: 'alice', routeId: 'other' }), /different route/);
});

test('delete targets only the selected saved document', () => {
  assert.deepEqual(run('delete', { commuterId: 'alice', routeId }), [['delete', 'bookmark']]);
});
