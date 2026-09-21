// Pure helpers for reading the `trips` collection — no UI, no platform APIs,
// so the mobile Trip reports screen and the web trip history share them
// verbatim. Keep this file byte-identical between the two apps.

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Monday-start week — how a working week is usually counted here, rather
// than JS's default Sunday-start.
export function startOfWeek() {
  const d = startOfDay(new Date());
  const mondayOffset = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

// Takes seconds, not minutes: a short trip should read "40s" rather than "0m"
// next to a start and end time that look identical.
export function formatDuration(totalSeconds) {
  if (totalSeconds == null) return '--';
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// How long a trip really took. Trips recorded before durationSeconds existed
// only stored whole minutes, so fall back to those.
export function tripSeconds(trip) {
  if (trip.durationSeconds != null) return trip.durationSeconds;
  return trip.durationMinutes != null ? trip.durationMinutes * 60 : null;
}

export function formatClock(date) {
  if (!date) return '--';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDayHeading(date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const today = startOfDay(new Date()).getTime();
  const day = startOfDay(date).getTime();
  if (day === today) return 'Today';
  if (day === today - oneDay) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// Firestore docs -> trips ready to render: newest first, with endedAt as a
// real Date. serverTimestamp() reads back null for a moment on the device
// that wrote it, before the server value arrives, so those are dropped.
export function toSortedTrips(docs) {
  return docs
    .map((docSnap) => {
      const data = docSnap.data();
      return { id: docSnap.id, ...data, endedAt: data.endedAt ? data.endedAt.toDate() : null };
    })
    .filter((trip) => trip.endedAt)
    .sort((a, b) => b.endedAt - a.endedAt);
}

// Trips are already newest-first, so walking them in order groups each day's
// runs together without a second sort.
export function groupTripsByDay(trips) {
  const groups = [];
  trips.forEach((trip) => {
    const key = startOfDay(trip.endedAt).getTime();
    const current = groups[groups.length - 1];
    if (current && current.key === key) current.trips.push(trip);
    else groups.push({ key, date: trip.endedAt, trips: [trip] });
  });
  return groups;
}

export function summariseTrips(trips) {
  const totalSeconds = trips.reduce((sum, trip) => sum + (tripSeconds(trip) ?? 0), 0);
  return {
    count: trips.length,
    totalSeconds,
    avgSeconds: trips.length > 0 ? totalSeconds / trips.length : 0,
  };
}
