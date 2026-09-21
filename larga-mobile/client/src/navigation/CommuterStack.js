import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CommuterTabs from './CommuterTabs';
import TrackingScreen from '../screens/commuter/TrackingScreen';
import ScanQrScreen from '../screens/commuter/ScanQrScreen';
import RouteMapScreen from '../screens/shared/RouteMapScreen';
import SavedRoutesScreen from '../screens/commuter/SavedRoutesScreen';
import { useProximityAlerts } from '../hooks/useProximityAlerts';

const Stack = createStackNavigator();

export default function CommuterStack() {
  // Mounted once for the whole commuter session so alert popups fire no
  // matter which tab (or the Tracking/ScanQr screens) is currently focused.
  useProximityAlerts();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommuterTabs" component={CommuterTabs} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
      <Stack.Screen name="ScanQr" component={ScanQrScreen} />
      <Stack.Screen name="RouteMap" component={RouteMapScreen} />
      <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} />
    </Stack.Navigator>
  );
}
