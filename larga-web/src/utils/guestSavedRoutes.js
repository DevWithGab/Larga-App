
const KEY = 'larga:guest-saved-routes';
const listeners = new Set();
let queue = Promise.resolve();
export async function readGuestRoutes() {
  const raw = localStorage.getItem(KEY);
  const routes = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(routes)) throw new Error('Could not read saved routes on this device.');
  return routes;
}
export function subscribeGuestRoutes(listener) {
  listeners.add(listener);
  const changed = (event) => { if (event.key === KEY || event.key === null) listener(); };
  window.addEventListener('storage', changed);
  return () => { listeners.delete(listener); window.removeEventListener('storage', changed); };
}
export function mutateGuestRoutes(action, value) {
  const operation = queue.then(async () => {
    const routes = await readGuestRoutes();
    const id = action === 'create' ? 'guest_' + value.routeId : value.id;
    const existing = routes.find((route) => route.id === id);
    if (action === 'create' && existing) throw new Error('This route is already saved.');
    if (action !== 'create' && !existing) throw new Error('This saved route no longer exists.');
    const next = action === 'delete' ? routes.filter((route) => route.id !== id)
      : action === 'create' ? [...routes, { ...value, id }]
      : routes.map((route) => route.id === id ? { ...route, ...value, id } : route);
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((listener) => listener());
  });
  queue = operation.catch(() => {});
  return operation;
}
