// How long a driver document can go untouched before we stop believing it.
//
// A driver's phone checks in every 30s while it's actually broadcasting (the
// heartbeat in DriverHomeScreen), so four missed check-ins means nobody is
// driving that jeepney any more: the app crashed, the battery died, the phone
// lost signal, or it was swiped away from recents. None of those run any
// cleanup code, so `isOnline` stays true in Firestore forever and the jeepney
// sits on every commuter's map, online and permanently parked.
export const DRIVER_STALE_AFTER_MS = 2 * 60 * 1000;

// The single test for "is this jeepney actually out there right now" — used by
// every commuter-facing screen so they can't drift apart on the answer.
// `isOnline` alone is not enough: it only means the last thing the driver's
// phone managed to say was "I'm online", not that it's still there to say it.
export function isDriverLive(driver, now = Date.now()) {
  if (!driver?.isOnline || !driver.location) return false;
  const updatedAt = driver.updatedAt?.toMillis?.();
  // serverTimestamp() reads back null for a moment on the device that wrote
  // it, before the server's value arrives. That's the freshest state there
  // is, not a stale one.
  if (updatedAt == null) return true;
  return now - updatedAt <= DRIVER_STALE_AFTER_MS;
}
