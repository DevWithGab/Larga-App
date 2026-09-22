import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mutateGuestRoutes, readGuestRoutes, subscribeGuestRoutes } from './guestSavedRoutes.js';

test('guest bookmarks persist, reject duplicates, notify other views, and preserve edits', async () => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  let changes = 0;
  const stop = subscribeGuestRoutes(() => changes++);
  await Promise.all([
    mutateGuestRoutes('create', { routeId: 'bayombong-solano', name: 'Work' }),
    mutateGuestRoutes('create', { routeId: 'santafe-aritao', name: 'Home' }),
  ]);
  assert.equal((await readGuestRoutes()).length, 2);
  await assert.rejects(mutateGuestRoutes('create', { routeId: 'bayombong-solano' }), /already saved/);
  await mutateGuestRoutes('update', { id: 'guest_bayombong-solano', notes: 'Morning ride' });
  assert.equal((await readGuestRoutes())[0].name, 'Work');
  assert.equal((await readGuestRoutes())[0].notes, 'Morning ride');
  await mutateGuestRoutes('delete', { id: 'guest_santafe-aritao' });
  assert.equal((await readGuestRoutes()).length, 1);
  assert.equal(changes, 4);
  stop();
  globalThis.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  await assert.rejects(mutateGuestRoutes('delete', { id: 'guest_bayombong-solano' }), /Storage blocked/);
  assert.equal((await readGuestRoutes()).length, 1);
  delete globalThis.localStorage;
  delete globalThis.window;
});
