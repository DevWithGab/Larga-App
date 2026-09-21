import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import JeepneyMap from '../../components/JeepneyMap';
import MapLegend from '../../components/MapLegend';
import { isDriverLive } from '../../utils/driverPresence';
import { getRoute, getRouteEndpoints } from '../../constants/routes';
import { fetchRoutePath } from '../../utils/osrm';

// Shared between the commuter's and the driver's stacks — a route's map view
// doesn't depend on who's looking at it, just the routeId.
export default function RouteMapScreen({ navigation, route: navRoute }) {
  const { routeId, direction = 'forward' } = navRoute.params ?? {};
  const route = getRoute(routeId);
  const endpoints = useMemo(() => {
    const points = getRouteEndpoints(route);
    return points && direction === 'reverse' ? [...points].reverse() : points;
  }, [route, direction]);
  const towns = route ? (direction === 'reverse' ? [...route.towns].reverse() : route.towns) : [];

  const [routeLine, setRouteLine] = useState(endpoints ?? null);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Re-checks which jeepneys have gone quiet; nothing else here needs a clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Show the straight line immediately, then upgrade to a real
  // road-following path once the routing lookup resolves.
  useEffect(() => {
    setRouteLine(endpoints);
    if (!endpoints) return;
    let cancelled = false;
    fetchRoutePath(endpoints[0], endpoints[1]).then((path) => {
      if (!cancelled && path) setRouteLine(path);
    });
    return () => {
      cancelled = true;
    };
  }, [endpoints]);

  useEffect(() => {
    if (!routeId) return;
    const driversQuery = query(
      collection(db, 'drivers'),
      where('routeId', '==', routeId),
      where('isOnline', '==', true)
    );
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      setOnlineDrivers(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })).filter((driver) => driver.location)
      );
    });
    return unsubscribe;
  }, [routeId]);

  const bounds = useMemo(() => {
    if (!endpoints) return undefined;
    const [[lngA, latA], [lngB, latB]] = endpoints;
    return [Math.min(lngA, lngB), Math.min(latA, latB), Math.max(lngA, lngB), Math.max(latA, latB)];
  }, [endpoints]);

  // isOnline alone survives a crash or a dead battery, so expire anyone whose
  // phone has stopped checking in rather than leaving a parked ghost on the
  // route map.
  const liveDrivers = onlineDrivers.filter((driver) => isDriverLive(driver, now));

  const markers = endpoints
    ? [
        { id: 'start', coordinate: endpoints[0], variant: 'endpoint', label: `Start: ${towns[0]}` },
        { id: 'end', coordinate: endpoints[1], variant: 'endpoint', label: `End: ${towns[1]}` },
        ...liveDrivers.map((driver) => ({
          id: driver.id,
          coordinate: [driver.location.longitude, driver.location.latitude],
          variant: 'jeepney',
        })),
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <JeepneyMap markers={markers} routeLine={routeLine} bounds={bounds} />
        <MapLegend />

        {/* Back button */}
        <TouchableOpacity
          className="absolute top-4 left-5 w-11 h-11 rounded-full bg-white items-center justify-center"
          style={{ elevation: 4 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        {/* Route info card */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl px-5 pt-5 pb-8"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          }}
        >
          <View className="flex-row items-center mb-2">
            <View className="bg-primary rounded-full px-3 py-1 mr-2">
              <Text className="font-accent text-sm text-white">{route?.code ?? '--'}</Text>
            </View>
            <Text className="font-heading text-xl text-black flex-shrink" numberOfLines={1}>
              {route ? `${route.towns[0]} ⇄ ${route.towns[1]}` : 'Route not found'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${liveDrivers.length > 0 ? 'bg-green-600' : 'bg-gray-300'}`}
            />
            <Text className="font-regular text-base text-gray-500">
              {liveDrivers.length === 0
                ? 'No jeepneys running right now'
                : `${liveDrivers.length} jeepney${liveDrivers.length === 1 ? '' : 's'} running now`}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
