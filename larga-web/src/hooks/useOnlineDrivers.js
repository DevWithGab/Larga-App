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

  // Drives the "has this jeepney gone quiet" check. Nothing else needs a
  // clock, so a slow tick is plenty.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const driversQuery = query(collection(db, 'drivers'), where('isOnline', '==', true));
    return onSnapshot(driversQuery, (snapshot) => {
      setDrivers(
        snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((driver) => driver.location)
      );
    });
  }, []);

  // isOnline alone only means the last thing that phone managed to say was
  // "I'm online" — not that it's still there to say it.
  return drivers.filter((driver) => isDriverLive(driver, now));
}
