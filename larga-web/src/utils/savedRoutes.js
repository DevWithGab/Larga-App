export function savedRouteFields({ routeId, name = '', notes = '', direction = 'forward' }, validRouteIds) {
  if (!validRouteIds.includes(routeId)) throw new Error('Choose an available jeepney route.');
  if (typeof name !== 'string' || name.trim().length > 60) throw new Error('Use a name of 60 characters or fewer.');
  if (typeof notes !== 'string' || notes.trim().length > 300) throw new Error('Keep your notes within 300 characters.');
  if (!['forward', 'reverse'].includes(direction)) throw new Error('Choose a valid travel direction.');
  return { routeId, name: name.trim(), notes: notes.trim(), direction };
}

export function savedRouteError(error) {
  if (error.code === 'permission-denied') return 'Saved routes access was denied. Please contact support.';
  if (error.code === 'unavailable') return 'Cannot reach saved routes. Check your connection and try again.';
  return error.message || 'Could not save your changes. Please try again.';
}

// Called inside a Firestore transaction so concurrent tabs cannot overwrite an
// existing bookmark or recreate a route that another tab has just deleted.
export function writeSavedRoute(transaction, ref, snapshot, { action, uid, fields, timestamp }) {
  if (action === 'create') {
    if (snapshot.exists()) throw new Error('This route is already saved. You can edit it instead.');
    transaction.set(ref, { ...fields, commuterId: uid, createdAt: timestamp, updatedAt: timestamp });
    return;
  }
  if (!snapshot.exists()) throw new Error('This saved route no longer exists.');
  if (snapshot.data().commuterId !== uid) throw new Error('You can only change your own saved routes.');
  if (action === 'delete') transaction.delete(ref);
  else if (action === 'update') {
    if (snapshot.data().routeId !== fields.routeId) throw new Error('Save a different route as a new bookmark.');
    transaction.update(ref, { ...fields, updatedAt: timestamp });
  } else throw new Error('Invalid saved route action.');
}
