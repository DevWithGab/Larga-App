import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '../../services/firebase';
import { useSavedRoutes } from '../../hooks/useSavedRoutes';
import { ROUTES } from '../../constants/routes';
import { distanceMeters, estimateEtaMinutes } from '../../utils/geo';
import RouteCard from '../../components/RouteCard';
import { isDriverLive } from '../../utils/driverPresence';

const TABS = ['Running', 'All', 'Saved'];

export default function RoutesScreen({ navigation, route }) {
  const saved = useSavedRoutes();
  const savedRouteIds = saved.routes.map((item) => item.routeId);
  const [tab, setTab] = useState('Running');
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Re-checks which jeepneys have gone quiet; nothing else here needs a clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    if (route?.params?.tab) setTab(route.params.tab);
  }, [route?.params?.tab]);

  useEffect(() => {
    const driversQuery = query(collection(db, 'drivers'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      setOnlineDrivers(snapshot.docs.map((docSnap) => docSnap.data()).filter((driver) => driver.location));
    }, () => setOnlineDrivers([]));
    return unsubscribe;
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;
      // High, not the default: an empty options object means Balanced, which
      // is only ~100m accurate — and each route card's "Next: ~N min away" is
      // measured from this point.
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setMyLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    })().catch(() => {});
  }, []);

  const toggleSaved = async (routeId) => {
    try {
      const existing = saved.routes.find((item) => item.routeId === routeId);
      if (existing) await saved.remove(existing);
      else await saved.create({ routeId });
    } catch (error) { Alert.alert('Could not save route', error.message); }
  };

  // A jeepney whose phone stopped checking in shouldn't keep padding the
  // "N running" count on a route card, or supply a "Next: ~N min" from a
  // position it left behind.
  const liveDrivers = onlineDrivers.filter((driver) => isDriverLive(driver, now));

  const routesWithData = ROUTES.map((route) => {
    const routeDrivers = liveDrivers.filter((driver) => driver.routeId === route.id);
    const nearestEtaMinutes =
      myLocation && routeDrivers.length > 0
        ? routeDrivers.reduce((best, driver) => {
            const eta = estimateEtaMinutes(distanceMeters(myLocation, driver.location));
            return eta !== null && (best === null || eta < best) ? eta : best;
          }, null)
        : null;
    return {
      ...route,
      runningCount: routeDrivers.length,
      nearestEtaMinutes,
      saved: savedRouteIds.includes(route.id),
    };
  });

  const runningTotal = routesWithData.filter((r) => r.runningCount > 0).length;
  const savedTotal = routesWithData.filter((r) => r.saved).length;
  const filteredRoutes =
    tab === 'Running'
      ? routesWithData.filter((r) => r.runningCount > 0)
      : tab === 'Saved'
      ? routesWithData.filter((r) => r.saved)
      : routesWithData;
  const visibleRoutes = filteredRoutes.slice().sort((a, b) => Number(b.saved) - Number(a.saved));

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pt-4">
      <Text className="font-heading text-3xl text-black mb-4">All routes</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('SavedRoutes')} className="bg-orange-50 rounded-xl px-4 py-3 mb-4">
        <Text className="font-accent text-primary">Manage saved routes</Text>
      </TouchableOpacity>

      {/* Segmented tabs */}
      <View className="flex-row bg-gray-100 rounded-full p-1 mb-5">
        {TABS.map((label) => {
          const count = label === 'Running' ? runningTotal : label === 'Saved' ? savedTotal : ROUTES.length;
          const active = tab === label;
          return (
            <TouchableOpacity
              key={label}
              className={`flex-1 items-center py-2.5 rounded-full ${active ? 'bg-white' : ''}`}
              style={active ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : undefined}
              onPress={() => setTab(label)}
              activeOpacity={0.8}
            >
              <Text className={`font-accent text-sm ${active ? 'text-black' : 'text-gray-500'}`}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {visibleRoutes.length === 0 ? (
          <Text className="font-regular text-sm text-gray-500 text-center mt-10">
            {tab === 'Saved'
              ? "You haven't saved any routes yet — tap the bookmark on a route to save it."
              : 'No jeepneys running right now.'}
          </Text>
        ) : (
          visibleRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              runningCount={route.runningCount}
              highlighted={route.saved}
              nearestEtaMinutes={route.nearestEtaMinutes}
              saved={route.saved}
              onToggleSave={() => toggleSaved(route.id)}
              onPress={() => navigation.navigate('RouteMap', { routeId: route.id })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
