import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getRoute, routeLabel } from '../../constants/routes';
import { distanceMeters, formatDistance } from '../../utils/geo';
import JeepneyIcon from '../../components/JeepneyIcon';
import { isDriverLive } from '../../utils/driverPresence';


function AlertCard({ alertId, alert, onPress }) {
  const [driver, setDriver] = useState(null);
  const [now, setNow] = useState(Date.now());


  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'drivers', alert.driverId), (snap) => {
      setDriver(snap.exists() ? snap.data() : null);
    });
    return unsubscribe;
  }, [alert.driverId]);

  const route = getRoute(alert.routeId);
  const isLive = isDriverLive(driver, now);
  const distance =
    isLive && alert.pickupLocation ? distanceMeters(alert.pickupLocation, driver.location) : null;

  return (
    <View className="flex-row items-center border border-gray-200 rounded-3xl p-4 mb-4">
      <TouchableOpacity className="flex-row items-center flex-1 pr-2" onPress={onPress} activeOpacity={0.85}>
        <View className="w-14 h-14 rounded-2xl bg-orange-50 items-center justify-center mr-3">
          <JeepneyIcon size={36} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-base text-black">
            {alert.jeepneyNumber ?? driver?.jeepneyNumber ?? 'Unknown plate'}
          </Text>
          <Text className="font-regular text-sm text-gray-500 mt-0.5">
            {route ? `${route.code} · ${routeLabel(route, alert.direction)}` : 'Route not set'}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-600' : 'bg-gray-300'}`} />
            <Text className={`font-accent text-sm ${isLive ? 'text-green-700' : 'text-gray-400'}`}>
              {!isLive ? 'Offline right now' : distance == null ? 'Locating…' : formatDistance(distance)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        onPress={() => deleteDoc(doc(db, 'alerts', alertId))}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

export default function AlertsScreen({ navigation }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user) return;
    const alertsQuery = query(collection(db, 'alerts'), where('commuterId', '==', user.uid));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
    return unsubscribe;
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pt-4">
      <Text className="font-heading text-3xl text-black mb-1">Alerts</Text>
      <Text className="font-regular text-sm text-gray-500 mb-5">
        We'll notify you when an alerted jeepney gets close — keep the app open to get it.
      </Text>

      {alerts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10" style={{ paddingBottom: 80 }}>
          <Ionicons name="notifications-outline" size={48} color="#d1d5db" />
          <Text className="font-heading text-lg text-black mt-4 text-center">No active alerts</Text>
          <Text className="font-regular text-sm text-gray-500 text-center mt-1">
            Tap "Alert me" on a jeepney's tracking screen to get notified when it's close.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alertId={alert.id}
              alert={alert}
              onPress={() => navigation.navigate('Tracking', { driverId: alert.driverId })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
