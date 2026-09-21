import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ROUTES } from '../../constants/routes';
import RouteCard from '../../components/RouteCard';
import { isDriverLive } from '../../utils/driverPresence';

const TABS = ['Running', 'All'];

export default function RouteScreen({ navigation }) {
  const [tab, setTab] = useState('Running');
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Re-checks which jeepneys have gone quiet; nothing else here needs a clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    const driversQuery = query(collection(db, 'drivers'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      setOnlineDrivers(snapshot.docs.map((docSnap) => docSnap.data()));
    });
    return unsubscribe;
  }, []);

  const liveDrivers = onlineDrivers.filter((driver) => isDriverLive(driver, now));

  const routesWithCounts = ROUTES.map((route) => ({
    ...route,
    runningCount: liveDrivers.filter((driver) => driver.routeId === route.id).length,
  }));
  const runningTotal = routesWithCounts.filter((r) => r.runningCount > 0).length;
  const visibleRoutes = tab === 'Running' ? routesWithCounts.filter((r) => r.runningCount > 0) : routesWithCounts;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-4 pb-3">
        <Text className="font-heading text-3xl text-black mb-1">Routes</Text>
        <Text className="font-regular text-base text-gray-500 mb-4">
          Pick your route from the Trip tab before going online.
        </Text>

        {/* Segmented tabs */}
        <View className="flex-row bg-gray-100 rounded-full p-1">
          {TABS.map((label) => {
            const count = label === 'Running' ? runningTotal : ROUTES.length;
            const active = tab === label;
            return (
              <TouchableOpacity
                key={label}
                className={`flex-1 items-center py-3 rounded-full ${active ? 'bg-white' : ''}`}
                style={
                  active ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : undefined
                }
                onPress={() => setTab(label)}
                activeOpacity={0.8}
              >
                <Text className={`font-accent text-base ${active ? 'text-black' : 'text-gray-500'}`}>
                  {label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {visibleRoutes.length === 0 ? (
          <Text className="font-regular text-base text-gray-500 text-center mt-10">
            No jeepneys running right now.
          </Text>
        ) : (
          visibleRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              runningCount={route.runningCount}
              onPress={() => navigation.navigate('RouteMap', { routeId: route.id })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
