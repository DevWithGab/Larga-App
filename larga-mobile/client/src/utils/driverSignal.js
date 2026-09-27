// Estimate the jeepney's connection from its 30-second server heartbeat.
// locationUpdatedAt only changes when the jeepney moves, so it must not be
// used here: a parked jeepney can still have a healthy connection.
export function driverSignal(driver, now = Date.now()) {
  const updatedAt = driver?.updatedAt?.toMillis?.();
  if (!driver?.isOnline) {
    return { label: 'Offline', bars: 0, color: '#b91c1c', detail: 'This jeepney is not broadcasting.' };
  }
  if (!Number.isFinite(updatedAt) || updatedAt > now + 30000) {
    return { label: 'Signal unknown', bars: 0, color: '#64748b', detail: 'Waiting for a confirmed driver update.' };
  }
  const age = Math.max(0, now - updatedAt);
  if (age > 120000) {
    return { label: 'Signal lost', bars: 0, color: '#b91c1c', detail: 'Driver updates stopped. Location may be outdated.' };
  }
  if (age > 45000) {
    return { label: 'Low signal', bars: 1, color: '#c2410c', detail: 'Driver updates are delayed. Location may be outdated.' };
  }
  return { label: 'High signal', bars: 4, color: '#15803d', detail: 'Driver updates are arriving regularly.' };
}
