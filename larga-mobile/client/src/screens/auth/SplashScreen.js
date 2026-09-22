import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Logo from '../../components/Logo';

export default function SplashScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 24, paddingBottom: 24 }}>
        {/* Decorative dashed divider, pinned near the top */}
        <View className="w-full border-t border-dashed border-white/40 mb-12" />

        {/* Message group: icon + logo + copy, kept tightly together (proximity) */}
        <View className="items-center mb-12">
          <Ionicons name="bus-outline" size={110} color="#000000" />
        </View>

        <View className="items-center">
          <Logo variant="dark" width={180} style={{ marginBottom: 20 }} />

          <Text className="font-heading text-[40px] text-white text-center mb-5 leading-tight">
            Never miss{'\n'}your ride.
          </Text>

          <Text className="font-regular text-xl text-white text-center opacity-95 leading-7">
            Real-Time Jeepney Tracking{'\n'}and Route Information
          </Text>
        </View>

        {/* The one intentional flexible gap: breathing room before the CTA */}
        <View className="flex-1" />

        <View className="items-center">
          {/* CTA Button */}
          <TouchableOpacity
            className="bg-black py-4 px-12 rounded-full flex-row items-center justify-center w-full gap-2"
            onPress={() => navigation.navigate('Commuter')}
            activeOpacity={0.9}
          >
            <Text className="font-heading text-white text-lg tracking-wide">LARGA NA!</Text>
            <Ionicons name="arrow-forward" size={24} color="#f57c1f" />
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-3 py-4 px-4 rounded-full border border-black/30 flex-row items-center justify-center w-full gap-2"
            onPress={() => navigation.navigate('DriverLogin')}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Ionicons name="bus-outline" size={22} color="#000" />
            <Text className="font-accent text-black text-base">I DRIVE A JEEPNEY</Text>
          </TouchableOpacity>
          <Text className="font-regular text-black text-sm mt-4">No account needed to find your ride.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
