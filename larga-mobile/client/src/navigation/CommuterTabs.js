import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CommuterMainScreen from '../screens/commuter/CommuterMainScreen';
import RoutesScreen from '../screens/commuter/RoutesScreen';
import AlertsScreen from '../screens/commuter/AlertsScreen';
import CommuterProfileScreen from '../screens/commuter/CommuterProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Map: 'map',
  Routes: 'trail-sign',
  Alerts: 'notifications',
  Profile: 'person',
};

export default function CommuterTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#f57c1f',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontFamily: 'Baloo2_600SemiBold', fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Map" component={CommuterMainScreen} />
      <Tab.Screen name="Routes" component={RoutesScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={CommuterProfileScreen} />
    </Tab.Navigator>
  );
}
