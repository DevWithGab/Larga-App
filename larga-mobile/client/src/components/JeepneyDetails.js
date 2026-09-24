import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRoute, routeLabel } from '../constants/routes';
import { seatAvailability } from '../utils/seatAvailability';

export default function JeepneyDetails({ driver, onClose, onTrack }) {
  const route = getRoute(driver.routeId);
  const seats = seatAvailability(driver);
  return <ScrollView showsVerticalScrollIndicator={false}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to nearby jeepneys" onPress={onClose} className="flex-row items-center mb-3" style={{ minHeight: 44, gap: 8 }}>
      <Ionicons name="arrow-back" size={18} color="#4b5563" /><Text className="font-accent text-sm text-gray-600">Nearby jeepneys</Text>
    </TouchableOpacity>
    <Text accessibilityLiveRegion="polite" className={`font-accent text-xs ${seats.full ? 'text-red-600' : 'text-primary'}`}>{seats.full ? 'Full · No seats available' : 'On the road'}</Text>
    <Text accessibilityRole="header" className="font-heading text-2xl text-black mt-1">{driver.jeepneyNumber || 'Plate unavailable'}</Text>
    <Text className="font-regular text-sm text-gray-600 mt-1">{route ? `${route.code} · ${routeLabel(route, driver.direction)}` : 'Route not set'}</Text>
    <View className="flex-row border-y border-gray-200 py-4 my-4">
      <View className="flex-1 pr-3"><Text className="font-regular text-xs text-gray-500">Seats left</Text><Text className={`font-heading text-3xl ${seats.full ? 'text-red-600' : 'text-black'}`}>{seats.left ?? '—'}</Text><Text className="font-regular text-xs text-gray-500">{seats.capacity ? `of ${seats.capacity} seats` : 'Capacity unavailable'}</Text></View>
      <View className="flex-1 pl-4 border-l border-gray-200"><Text className="font-regular text-xs text-gray-500">Route fare</Text><Text className="font-heading text-3xl text-black">{route?.fare != null ? `₱${route.fare}` : '—'}</Text><Text className="font-regular text-xs text-gray-500">End-to-end · per person</Text></View>
    </View>
    <View className="flex-row justify-between"><Text className="font-regular text-sm text-gray-500">Passengers aboard</Text><Text className="font-accent text-sm text-black">{seats.passengers ?? 'Not reported'}</Text></View>
    <Text className="font-regular text-xs text-gray-500 mt-3">{seats.left === null ? 'Seat availability has not been reported.' : 'Seat counts update live as the driver reports them.'}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={onTrack} className="bg-black rounded-xl items-center py-3 mt-4" style={{ minHeight: 48 }}><Text className="font-accent text-sm text-white">Track jeepney</Text></TouchableOpacity>
  </ScrollView>;
}
