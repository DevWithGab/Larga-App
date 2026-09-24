import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JeepneyIcon from './JeepneyIcon';
import RoleAvatar from './RoleAvatar';

export default function MapLegend() {
  const [expanded, setExpanded] = useState(false);
  const row = (icon, label) => <View key={label} className="flex-row items-center" style={{ gap: 8 }}>
    <View style={{ width: 26, alignItems: 'center' }}>{icon}</View>
    <Text className="font-regular text-xs text-gray-600">{label}</Text>
  </View>;
  return <View className="absolute top-3 right-3 rounded-2xl bg-white p-3" style={{ width: 185, elevation: 5, zIndex: 5, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8 }}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Map legend" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}
      className="flex-row items-center justify-between" style={{ minHeight: 44 }}>
      <Text className="font-accent text-sm text-black">Map legend</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#000" />
    </TouchableOpacity>
    {expanded && <View style={{ gap: 9 }}>
      {row(<View style={{ width: 24, borderTopWidth: 3, borderColor: '#f57c1f', borderStyle: 'dashed' }} />, 'Route path')}
      {row(<View style={{ width: 24, height: 4, backgroundColor: '#f57c1f' }} />, 'Jeepney trail')}
      {row(<View style={{ borderRadius: 14, borderWidth: 2, borderColor: '#f57c1f', backgroundColor: '#ffedd5' }}><JeepneyIcon size={22} /></View>, 'Online jeepney')}
      {row(<View style={{ borderRadius: 14, borderWidth: 2, borderColor: '#dc2626', backgroundColor: '#fee2e2' }}><JeepneyIcon size={22} /></View>, 'Full jeepney')}
      {row(<View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#000', borderWidth: 2, borderColor: '#fff' }} />, 'Start / End town')}
      {row(<RoleAvatar role="commuter" size={24} />, 'Your location')}
      <Text className="font-regular text-xs text-gray-500">Offline jeepneys are hidden.</Text>
    </View>}
  </View>;
}
