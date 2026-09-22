import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'larga:guest-alerts';
const listeners = new Set();
let queue = Promise.resolve();
export async function readGuestAlerts() { return JSON.parse(await AsyncStorage.getItem(KEY) || '[]'); }
export function subscribeGuestAlerts(listener) {
  let active = true;
  const refresh = () => readGuestAlerts().then((items) => { if (active) listener(items); }).catch(() => { if (active) listener([]); });
  listeners.add(refresh); refresh();
  return () => { active = false; listeners.delete(refresh); };
}
export function setGuestAlert(driverId, data) {
  const operation = queue.then(async () => {
    const items = (await readGuestAlerts()).filter((item) => item.driverId !== driverId);
    if (data) items.push({ ...data, id: driverId, driverId });
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
    listeners.forEach((listener) => listener());
  });
  queue = operation.catch(() => {});
  return operation;
}
