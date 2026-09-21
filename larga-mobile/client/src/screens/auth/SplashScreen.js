import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Logo from '../../components/Logo';

export default function SplashScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar style="light" />
      <View className="flex-1 px-10 pt-12 pb-10">
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
            onPress={() => navigation.navigate('RoleSelection')}
            activeOpacity={0.9}
          >
            <Text className="font-heading text-white text-lg tracking-wide">LARGA NA!</Text>
            <Ionicons name="arrow-forward" size={24} color="#f57c1f" />
          </TouchableOpacity>

          {/* Pagination Dots */}
          <View className="flex-row items-center gap-2 mt-10">
            <View className="w-2 h-2 rounded-full bg-white/40" />
            <View className="w-6 h-2 rounded-full bg-black" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
