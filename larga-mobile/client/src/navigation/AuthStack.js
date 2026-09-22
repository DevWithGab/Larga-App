import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import SplashScreen from '../screens/auth/SplashScreen';
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import DriverOtpScreen from '../screens/auth/DriverOtpScreen';
import DriverSignUpScreen from '../screens/auth/DriverSignUpScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
      <Stack.Screen name="DriverOtp" component={DriverOtpScreen} />
      <Stack.Screen name="DriverSignUp" component={DriverSignUpScreen} />
    </Stack.Navigator>
  );
}
