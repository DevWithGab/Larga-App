import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { distanceMeters, formatDistance } from '../utils/geo';
import { isDriverLive } from '../utils/driverPresence';

const NEARBY_THRESHOLD_METERS = 500;

// Watches the signed-in commuter's active alerts (src/screens/commuter/
// TrackingScreen.js's "Alert me") and pops an in-app notification once an
// alerted jeepney gets close to where the alert was set.
//
// Foreground-only: this has no background/push support, so it only fires
// while the app is open. Mount it once near the top of the commuter
// navigation tree (CommuterStack) so it keeps watching no matter which tab
// is focused.
export function useProximityAlerts() {
  const { user } = useAuth();
  const driverUnsubsRef = useRef({}); // { [alertId]: unsubscribe }
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if (!user) return;

    const alertsQuery = query(collection(db, 'alerts'), where('commuterId', '==', user.uid));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const seenIds = new Set();

      snapshot.docs.forEach((alertSnap) => {
        const alertId = alertSnap.id;
        seenIds.add(alertId);
        if (driverUnsubsRef.current[alertId]) return; // already watching this one

        const alert = alertSnap.data();
        driverUnsubsRef.current[alertId] = onSnapshot(doc(db, 'drivers', alert.driverId), (driverSnap) => {
          if (!driverSnap.exists()) return;
          const driver = driverSnap.data();
          // Never announce "your jeepney is close!" off a position left
          // behind by a phone that died — isOnline outlives the app that set it.
          if (!isDriverLive(driver) || !alert.pickupLocation) return;

          const distance = distanceMeters(alert.pickupLocation, driver.location);
          if (distance !== null && distance <= NEARBY_THRESHOLD_METERS && !notifiedRef.current.has(alertId)) {
            notifiedRef.current.add(alertId);
            Alert.alert(
              '🚍 Your jeepney is close!',
              `${driver.jeepneyNumber ?? 'Your jeepney'} is ${formatDistance(distance)} from where you set the alert.`
            );
          }
        });
      });

      // Stop watching (and forget) alerts that were cancelled or resolved.
      Object.keys(driverUnsubsRef.current).forEach((alertId) => {
        if (!seenIds.has(alertId)) {
          driverUnsubsRef.current[alertId]();
          delete driverUnsubsRef.current[alertId];
          notifiedRef.current.delete(alertId);
        }
      });
    });

    return () => {
      unsubscribeAlerts();
      Object.values(driverUnsubsRef.current).forEach((unsubscribe) => unsubscribe());
      driverUnsubsRef.current = {};
      notifiedRef.current.clear();
    };
  }, [user]);
}
