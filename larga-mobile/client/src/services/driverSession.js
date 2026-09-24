import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Save the report and close presence together: neither can succeed on its own.
export async function saveCompletedTrip(uid, trip) {
  if (!uid) throw new Error('Please sign in again.');
  const batch = writeBatch(db);
  batch.set(doc(collection(db, 'trips')), {
    driverId: uid,
    routeId: trip.routeId ?? null,
    direction: trip.direction ?? 'forward',
    jeepneyNumber: trip.jeepneyNumber ?? null,
    passengerCount: trip.passengerCount ?? 0,
    durationSeconds: Math.max(0, Math.round(trip.durationSeconds ?? 0)),
    durationMinutes: Math.round((trip.durationSeconds ?? 0) / 60),
    endedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'drivers', uid), {
    isOnline: false, passengerCount: 0, updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

// Closes out whatever trip a driver still has open, working from the driver
// document itself rather than from screen state — so it can be called from
// anywhere, including the logout path, where DriverHomeScreen isn't
// necessarily mounted and its `elapsed`/`passengerCount` are out of reach.
//
// Call this BEFORE signOut(): once the user is signed out, a write like this
// would be rejected by any auth-based Firestore rule.
export async function endActiveTrip(uid) {
  if (!uid) return;

  const driverRef = doc(db, 'drivers', uid);
  const snap = await getDoc(driverRef);
  if (!snap.exists()) return;

  const data = snap.data();
  // Already ended, or paused on a break — either way commuters can't see this
  // jeepney, so there's no ghost to clean up and no trip to close.
  if (!data.isOnline) return;

  // `onlineSince` is kept honest across breaks: resumeTrip rewinds it past the
  // time already driven, so this is driving time, not wall-clock since the
  // driver first went online.
  const startedAtMs = data.onlineSince?.toMillis?.() ?? null;
  const durationSeconds = startedAtMs
    ? Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))
    : 0;

  await saveCompletedTrip(uid, { ...data, durationSeconds });
}
