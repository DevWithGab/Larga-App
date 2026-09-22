import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Import stacks
import AuthStack from './AuthStack';
import DriverStack from './DriverStack';
import CommuterStack from './CommuterStack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, userType, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#f57c1f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth screens - Splash, Login, Register
          <Stack.Group navigationKey="guest">
            <Stack.Screen name="Auth" component={AuthStack} />
            <Stack.Screen name="Commuter" component={CommuterStack} />
          </Stack.Group>
        ) : userType === 'driver' ? (
          // Driver screens - GPS tracking, route info, etc.
          <Stack.Screen name="Driver" component={DriverStack} />
        ) : (
          // Commuter screens - Map view, jeepney tracking, etc.
          <Stack.Screen name="Commuter" component={CommuterStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
