import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Bell, X } from 'lucide-react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getRoute, routeLabel } from '../constants/routes';
import { distanceMeters, formatDistance } from '../utils/geo';
import { isDriverLive } from '../utils/driverPresence';

function AlertCard({ alertId, alert }) {
  const [driver, setDriver] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () =>
      onSnapshot(doc(db, 'drivers', alert.driverId), (snap) => {
        setDriver(snap.exists() ? snap.data() : null);
      }),
    [alert.driverId]
  );

  const route = getRoute(alert.routeId);
  const isLive = isDriverLive(driver, now);
  const distance =
    isLive && alert.pickupLocation ? distanceMeters(alert.pickupLocation, driver.location) : null;

  return (
    <li className="mb-4 flex items-center rounded-3xl border border-gray-200 p-4">
      <span className="mr-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
        <img src="/larga-jeep/larga-jeep.png" alt="" className="h-9 w-9 object-contain" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-heading truncate text-base text-black">
          {alert.jeepneyNumber ?? driver?.jeepneyNumber ?? 'Unknown plate'}
        </p>
        <p className="font-regular mt-0.5 truncate text-sm text-gray-500">
          {route ? `${route.code} · ${routeLabel(route, alert.direction)}` : 'Route not set'}
        </p>
        <p className="mt-2 flex items-center">
          <span className={`mr-2 h-2 w-2 rounded-full ${isLive ? 'bg-green-600' : 'bg-gray-300'}`} />
          <span className={`font-accent text-sm ${isLive ? 'text-green-700' : 'text-gray-400'}`}>
            {!isLive ? 'Offline right now' : distance == null ? 'Locating…' : formatDistance(distance)}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => deleteDoc(doc(db, 'alerts', alertId))}
        aria-label="Cancel this alert"
        className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100
                   hover:bg-gray-200"
      >
        <X size={20} />
      </button>
    </li>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    const alertsQuery = query(collection(db, 'alerts'), where('commuterId', '==', user.uid));
    return onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [user]);

  return (
    <div className="h-full overflow-y-auto bg-white px-5 pt-4 pb-6">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-heading mb-1 text-3xl text-black">Alerts</h1>
        <p className="font-regular mb-5 text-sm text-gray-500">
          We'll notify you when an alerted jeepney gets close — keep this tab open to get it.
        </p>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-10 pt-16 text-center">
            <Bell size={48} color="#d1d5db" />
            <p className="font-heading mt-4 text-lg text-black">No active alerts</p>
            <p className="font-regular mt-1 text-sm text-gray-500">
              {user ? 'Tap "Alert me" on a jeepney in the mobile app to get notified when it is close.' : 'Arrival alerts stay on the device where you set them. Open the mobile app to set an alert while tracking a jeepney.'}
            </p>
          </div>
        ) : (
          <ul>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alertId={alert.id} alert={alert} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
