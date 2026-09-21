import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { isDriverLive } from '../utils/driverPresence';

// Live: any driver currently broadcasting shows up as soon as their phone
// writes isOnline + location to Firestore, on the phone and in the browser
// alike — same query the mobile CommuterMainScreen runs.
export function useOnlineDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  // Drives the "has this jeepney gone quiet" check. Nothing else needs a
  // clock, so a slow tick is plenty.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const driversQuery = query(collection(db, 'drivers'), where('isOnline', '==', true));
    return onSnapshot(driversQuery, (snapshot) => {
      setError('');
      setDrivers(
        snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((driver) => driver.location)
      );
    }, (cause) => {
      console.error('Live driver subscription failed:', cause);
      setDrivers([]);
      setError(cause.code === 'permission-denied'
        ? 'Live jeepney locations are unavailable because access was denied. Please contact support.'
        : 'Unable to load live jeepney locations. Check your connection and reload.');
    });
  }, []);

  // isOnline alone only means the last thing that phone managed to say was
  // "I'm online" — not that it's still there to say it.
  return { drivers: drivers.filter((driver) => isDriverLive(driver, now)), error };
}
