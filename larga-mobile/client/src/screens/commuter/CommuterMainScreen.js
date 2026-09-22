import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '../../services/firebase';
import JeepneyMap from '../../components/JeepneyMap';
import LocationPrompt from '../../components/LocationPrompt';
import MapLegend from '../../components/MapLegend';
import JeepneyIcon from '../../components/JeepneyIcon';
import { DEFAULT_CENTER } from '../../constants/map';
import { ROUTES, getRoute, routeLabel, routePairLabel } from '../../constants/routes';
import { distanceMeters, estimateEtaMinutes } from '../../utils/geo';
import { isDriverLive } from '../../utils/driverPresence';


const FILTERS = [
  { id: 'all', label: 'All routes' },
  ...ROUTES.map((route) => ({ id: route.id, label: routePairLabel(route) })),
];

export default function CommuterMainScreen({ navigation, route }) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(0);
  const onLocationReady = useCallback(() => setLocationEnabled(true), []);
  const [activeFilter, setActiveFilter] = useState('all');
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [driverError, setDriverError] = useState('');
  const [myLocation, setMyLocation] = useState(null);
  const [now, setNow] = useState(Date.now());


  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    if (route?.params?.filter) setActiveFilter(route.params.filter);
  }, [route?.params?.filter]);


  useEffect(() => {
    const driversQuery = query(collection(db, 'drivers'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      const drivers = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((driver) => driver.location);
      setDriverError('');
      setOnlineDrivers(drivers);
    }, () => { setOnlineDrivers([]); setDriverError('Could not load live jeepneys. Check your connection and try reopening the map.'); });
    return unsubscribe;
  }, []);

  // A watch, not a one-shot read: this marker is "where you are", and every
  // ETA and distance below is measured from it. Reading once meant it quietly
  // became "where you were when you opened the app" — walk a kilometre and
  // your own dot never budged, and every ETA stayed measured from the start.
  useEffect(() => {
    if (!locationEnabled) return;
    let subscription = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
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
    })().catch(() => setLocationEnabled(false));

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, [locationEnabled]);

  const visibleDrivers = onlineDrivers.filter(
    (driver) =>
      // isOnline alone only means the last thing that phone managed to say was
      // "I'm online" — not that it's still there to say it.
      isDriverLive(driver, now) &&
      (activeFilter === 'all' || driver.routeId === activeFilter)
  );

  const markers = [
    ...(myLocation ? [{ id: 'me', coordinate: myLocation, variant: 'you' }] : []),
    ...visibleDrivers.map((driver) => ({
      id: driver.id,
      coordinate: [driver.location.longitude, driver.location.latitude],
      variant: 'jeepney',
    })),
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LocationPrompt onReady={onLocationReady} visibleRequest={locationPrompt} />
      {/* Search bar */}
      <View className="flex-row items-center px-5 pt-3 pb-3" style={{ gap: 12 }}>
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="font-regular flex-1 ml-2 text-sm text-black"
            placeholder="Where are you headed?"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity
          className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => navigation.navigate('ScanQr')}
        >
          <Ionicons name="qr-code-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <Ionicons name="notifications-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Route filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mb-3"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {FILTERS.map(({ id, label }) => {
          const isActive = id === activeFilter;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => setActiveFilter(id)}
              className={`px-4 py-2 rounded-full border ${
                isActive ? 'bg-black border-black' : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.85}
            >
              <Text className={`font-accent text-sm ${isActive ? 'text-white' : 'text-black'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Map + nearby jeepneys sheet */}
      <View className="flex-1">
        <JeepneyMap markers={markers} center={myLocation ?? DEFAULT_CENTER} />
        <MapLegend />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Turn on location" onPress={() => setLocationPrompt((value) => value + 1)} className="absolute right-4 top-4 bg-white rounded-full p-3">
          <Ionicons name="locate-outline" size={24} color="#111" />
        </TouchableOpacity>

        <View
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl px-5 pt-5 pb-6"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
            maxHeight: '55%',
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-heading text-lg text-black">Nearby jeepneys</Text>
            <View className="bg-orange-50 rounded-full px-3 py-1">
              <Text className="font-accent text-xs text-primary">{visibleDrivers.length} running</Text>
            </View>
          </View>

          {visibleDrivers.length === 0 ? (
            <Text className="font-regular text-sm text-gray-500 mb-2">
              {driverError || 'No jeepneys are online for this route right now.'}
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {visibleDrivers.map((driver) => {
                const route = getRoute(driver.routeId);
                const seatsLeft =
                  typeof driver.seatCapacity === 'number'
                    ? Math.max(0, driver.seatCapacity - (driver.passengerCount ?? 0))
                    : null;
                const etaMinutes = myLocation
                  ? estimateEtaMinutes(
                      distanceMeters({ latitude: myLocation[1], longitude: myLocation[0] }, driver.location)
                    )
                  : null;
                return (
                  <TouchableOpacity
                    key={driver.id}
                    className="flex-row items-center py-3 border-b border-gray-100"
                    onPress={() => navigation.navigate('Tracking', { driverId: driver.id })}
                    activeOpacity={0.8}
                  >
                    <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center mr-3">
                      <JeepneyIcon size={30} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-accent text-sm text-black">
                        {route ? `${route.code} · ${routeLabel(route, driver.direction)}` : 'Route not set'}
                      </Text>
                      <Text className="font-regular text-xs text-gray-500 mt-0.5">
                        {driver.jeepneyNumber ?? 'Unknown plate'}
                        {seatsLeft !== null && (
                          <Text className={seatsLeft === 0 ? 'font-accent text-red-600' : 'text-gray-500'}>
                            {' · '}
                            {seatsLeft === 0 ? 'Full' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
                          </Text>
                        )}
                      </Text>
                    </View>
                    <Text className="font-heading text-sm text-black">
                      {etaMinutes === null ? '—' : `~${etaMinutes} min`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
