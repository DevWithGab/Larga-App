import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DriverTabs from './DriverTabs';
import DriverQrScreen from '../screens/driver/DriverQrScreen';
import RouteMapScreen from '../screens/shared/RouteMapScreen';

const Stack = createStackNavigator();

export default function DriverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="DriverQr" component={DriverQrScreen} />
      <Stack.Screen name="RouteMap" component={RouteMapScreen} />
    </Stack.Navigator>
  );
}
