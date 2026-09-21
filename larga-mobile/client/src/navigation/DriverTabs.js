import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import RouteScreen from '../screens/driver/RouteScreen';
import ReportScreen from '../screens/driver/ReportScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

const Tab = createBottomTabNavigator();

// 'Trip' uses MaterialCommunityIcons (has a dedicated "jeepney" glyph);
// everything else uses Ionicons.
const ICONS = {
  Route: 'map',
  Reports: 'document-text',
  Profile: 'person',
};

export default function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#f57c1f',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontFamily: 'Baloo2_600SemiBold', fontSize: 11 },
        tabBarIcon: ({ color, size }) =>
          route.name === 'Trip' ? (
            <MaterialCommunityIcons name="jeepney" size={size ?? 22} color={color} />
          ) : (
            <Ionicons name={ICONS[route.name]} size={size ?? 22} color={color} />
          ),
      })}
    >
      <Tab.Screen name="Trip" component={DriverHomeScreen} />
      <Tab.Screen name="Route" component={RouteScreen} />
      <Tab.Screen name="Reports" component={ReportScreen} />
      <Tab.Screen name="Profile" component={DriverProfileScreen} />
    </Tab.Navigator>
  );
}
