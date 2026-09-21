import { useEffect, useState } from 'react';

// The browser's answer to expo-location's watchPositionAsync: a watch, not a
// one-shot read, because this marker is "where you are" and every distance
// and ETA on the map is measured from it. Reading once would quietly turn it
// into "where you were when you opened the page".
//
// Returns [lng, lat] (map order, matching the rest of the app) or null, plus
// why it's null when it is — the browser only asks permission over HTTPS or
// on localhost, so "denied" and "unavailable" are both worth telling the user
// apart from "still figuring it out".
export function useMyLocation() {
  const [coordinate, setCoordinate] = useState(null);
  const [status, setStatus] = useState('pending'); // pending | granted | denied | unavailable

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoordinate([position.coords.longitude, position.coords.latitude]);
        setStatus('granted');
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      // High accuracy, like the mobile screen: the default is coarse enough
      // (~100m) to put you on the wrong street.
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coordinate, status };
}
