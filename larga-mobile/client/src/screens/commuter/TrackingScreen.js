import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import JeepneyMap from '../../components/JeepneyMap';
import JeepneyIcon from '../../components/JeepneyIcon';
import { getRoute, routeLabel } from '../../constants/routes';
import { distanceMeters, estimateEtaMinutes } from '../../utils/geo';
import { isDriverLive } from '../../utils/driverPresence';


function formatAgo(seconds) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

function StatBox({ label, value, danger = false }) {
  return (
    <View className={`flex-1 border rounded-2xl py-3 items-center ${danger ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <Text className={`font-heading text-base mb-1 ${danger ? 'text-red-600' : 'text-black'}`}>{value}</Text>
      <Text className={`font-regular text-xs ${danger ? 'text-red-500' : 'text-gray-500'}`}>{label}</Text>
    </View>
  );
}

export default function TrackingScreen({ navigation, route }) {
  const { driverId } = route.params ?? {};
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [driverName, setDriverName] = useState(null);

  const [following, setFollowing] = useState(true);
  const [alerting, setAlerting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [myLocation, setMyLocation] = useState(null);

  // Real, live: this jeepney's marker moves as the driver's GPS updates.
  useEffect(() => {
    if (!driverId) return;
    const unsubscribe = onSnapshot(doc(db, 'drivers', driverId), (snap) => {
      setDriver(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsubscribe;
  }, [driverId]);

  useEffect(() => {
    if (!driverId) return;
    getDoc(doc(db, 'users', driverId)).then((snap) => {
      if (snap.exists()) setDriverName(snap.data().name?.split(' ')[0] ?? null);
    });
  }, [driverId]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    let subscription = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      // High, not the default: an empty options object means Balanced, which
      // is only ~100m accurate.
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (position) => setMyLocation([position.coords.longitude, position.coords.latitude])
      );
      if (cancelled) {
        subscription.remove();
        subscription = null;
      }
    })();

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, []);

  // Reflect whether an alert already exists for this jeepney (e.g. the
  // commuter set one, left this screen, and came back).
  useEffect(() => {
    if (!user || !driverId) return;
    let cancelled = false;
    getDoc(doc(db, 'alerts', `${user.uid}_${driverId}`)).then((snap) => {
      if (!cancelled) setAlerting(snap.exists());
    });
    return () => {
      cancelled = true;
    };
  }, [user, driverId]);

  // Not driver.isOnline: that only means the last thing this driver's phone

  const isLive = isDriverLive(driver, now);
  // locationUpdatedAt is written only when the jeepney actually moves, unlike

  const lastMovedAt = driver?.locationUpdatedAt ?? driver?.updatedAt;
  const elapsedSinceUpdate = lastMovedAt
    ? Math.max(0, Math.floor((now - lastMovedAt.toMillis()) / 1000))
    : null;
  // Going offline leaves the last `location` behind in the driver document, so

  const lastKnownCoordinate = driver?.location
    ? [driver.location.longitude, driver.location.latitude]
    : null;
  const coordinate = isLive ? lastKnownCoordinate : null;
  const driverRoute = getRoute(driver?.routeId);
  const seatsLeft =
    isLive && typeof driver?.seatCapacity === 'number'
      ? Math.max(0, driver.seatCapacity - (driver.passengerCount ?? 0))
      : null;
  const etaMinutes =
    isLive && myLocation && driver?.location
      ? estimateEtaMinutes(distanceMeters({ latitude: myLocation[1], longitude: myLocation[0] }, driver.location))
      : null;

  const handleAlert = async () => {
    if (!user || !driverId) return;
    const alertRef = doc(db, 'alerts', `${user.uid}_${driverId}`);
    const next = !alerting;
    setAlerting(next);

    try {
      if (next) {
        await setDoc(alertRef, {
          commuterId: user.uid,
          driverId,
          routeId: driver?.routeId ?? null,
          direction: driver?.direction ?? 'forward',
          jeepneyNumber: driver?.jeepneyNumber ?? null,
          pickupLocation: myLocation ? { latitude: myLocation[1], longitude: myLocation[0] } : null,
          createdAt: serverTimestamp(),
        });
        Alert.alert(
          "You'll be notified",
          "We'll let you know when this jeepney is getting close to you. Keep the app open to get the alert."
        );
      } else {
        await deleteDoc(alertRef);
        Alert.alert('Alert turned off');
      }
    } catch (error) {
      setAlerting(!next);
      Alert.alert('Something went wrong', error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <JeepneyMap
          markers={[
            ...(coordinate ? [{ id: driverId, coordinate, variant: 'jeepney', selected: true }] : []),
            ...(myLocation ? [{ id: 'me', coordinate: myLocation, variant: 'you' }] : []),
          ]}
          center={coordinate ?? lastKnownCoordinate ?? myLocation ?? undefined}
          zoom={15}
          followCamera={following}
        />

        {/* Back button */}
        <TouchableOpacity
          className="absolute top-4 left-5 w-10 h-10 rounded-full bg-white items-center justify-center"
          style={{ elevation: 4 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#000" />
        </TouchableOpacity>

        {/* Live badge */}
        <View
          className="absolute top-4 right-5 flex-row items-center bg-white rounded-full px-3 py-2"
          style={{ elevation: 4 }}
        >
          <View className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-600' : 'bg-gray-400'}`} />
          <Text className="font-accent text-xs text-black">{isLive ? 'Live' : 'Offline'}</Text>
        </View>

        {/* Detail card */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl px-5 pt-5 pb-6"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          }}
        >
          <View className="flex-row items-center mb-4">
            <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center mr-3">
              <JeepneyIcon size={30} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-lg text-black">
                {driver?.jeepneyNumber ?? 'Unknown plate'}
              </Text>
              <Text className="font-regular text-xs text-gray-500 mt-0.5">
                {driverRoute
                  ? `${driverRoute.code} · ${routeLabel(driverRoute, driver?.direction)}`
                  : 'Route not set'}
                {driverName ? ` · ${driverName}` : ''}
              </Text>
            </View>
          </View>

          <View className="flex-row mb-5" style={{ gap: 12 }}>
            <StatBox label="Arrives in" value={etaMinutes === null ? '—' : `~${etaMinutes} min`} />
            <StatBox
              label="Seats left"
              value={seatsLeft === null ? '—' : seatsLeft === 0 ? 'Full' : seatsLeft}
              danger={seatsLeft === 0}
            />
            <StatBox label="Fare" value={driverRoute?.fare != null ? `₱${driverRoute.fare}` : '—'} />
          </View>

          <View className="flex-row mb-3" style={{ gap: 12 }}>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center border border-gray-200 py-4 rounded-full"
              onPress={handleAlert}
              activeOpacity={0.9}
            >
              <Ionicons name={alerting ? 'notifications' : 'notifications-outline'} size={18} color="#000" />
              <Text className="font-accent text-black text-base ml-2">
                {alerting ? 'Alerting' : 'Alert me'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-4 rounded-full items-center ${following ? 'bg-black' : 'bg-primary'}`}
              onPress={() => setFollowing((prev) => !prev)}
              activeOpacity={0.9}
            >
              <Text className="font-accent text-white text-base">{following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>

          <Text className="font-regular text-xs text-gray-400 text-center">
            {elapsedSinceUpdate === null
              ? 'Waiting for location…'
              : isLive
                ? `Updated ${formatAgo(elapsedSinceUpdate)}`
                : `Offline · last seen ${formatAgo(elapsedSinceUpdate)}`}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
