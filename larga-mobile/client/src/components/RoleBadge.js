import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CONFIG = {
  driver: { label: 'Driver', icon: 'steering' },
  commuter: { label: 'Commuter', icon: 'person' },
};

export default function RoleBadge({ role, navigation, targetScreen }) {
  const { label, icon } = CONFIG[role];

  return (
    <TouchableOpacity
      className="flex-row items-center self-start bg-orange-50 rounded-full pl-3.5 pr-4 py-2.5 mb-5"
      onPress={() => navigation.navigate(targetScreen ?? 'RoleSelection')}
      activeOpacity={0.7}
    >
      {role === 'driver' ? (
        <MaterialCommunityIcons name={icon} size={18} color="#f57c1f" />
      ) : (
        <Ionicons name={icon} size={18} color="#f57c1f" />
      )}
      <Text className="text-base text-primary ml-1.5 font-accent">{label}</Text>
      <Text className="text-base text-gray-500 font-label"> · Switch</Text>
    </TouchableOpacity>
  );
}
