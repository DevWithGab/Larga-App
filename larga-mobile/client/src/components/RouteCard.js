import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routeDistanceKm } from '../constants/routes';


function RouteLine({ active }) {
  const color = active ? '#f57c1f' : '#d1d5db';
  return (
    <View className="flex-row items-center my-3">
      <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: '#000' }} />
      <View style={{ flex: 1, height: 3, backgroundColor: color, marginHorizontal: 4, borderRadius: 2 }} />
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
      <View style={{ flex: 1, height: 3, backgroundColor: color, marginHorizontal: 4, borderRadius: 2 }} />
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
      <View style={{ flex: 1, height: 3, backgroundColor: color, marginHorizontal: 4, borderRadius: 2 }} />
      <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: '#000' }} />
    </View>
  );
}


function Chip({ icon, label }) {
  return (
    <View className="flex-row items-center bg-gray-100 rounded-full px-2.5 py-1">
      <Ionicons name={icon} size={13} color="#6b7280" />
      <Text className="font-accent text-xs text-gray-600 ml-1">{label}</Text>
    </View>
  );
}

export default function RouteCard({
  route,
  runningCount,
  highlighted = runningCount > 0,
  nearestEtaMinutes,
  saved,
  onToggleSave,
  onPress,
}) {
  const [a, b] = route.towns;
  const km = routeDistanceKm(route);
  const isRunning = runningCount > 0;
  const showEta = nearestEtaMinutes !== undefined && isRunning;

  const content = (
    <>
      {/* Route identity on the left, live status on the right. */}
      <View className={`flex-row items-center justify-between ${onToggleSave ? 'pr-8' : ''}`}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className="bg-primary rounded-xl px-3 py-1.5">
            <Text className="font-accent text-sm text-white">{route.code}</Text>
          </View>
          {route.icon && (
            <View className="w-8 h-8 rounded-xl bg-orange-50 items-center justify-center">
              <Ionicons name={route.icon} size={16} color="#f57c1f" />
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-1.5 ${isRunning ? 'bg-green-600' : 'bg-gray-300'}`} />
          <Text className={`font-accent text-sm ${isRunning ? 'text-black' : 'text-gray-400'}`}>
            {isRunning ? `${runningCount} running` : 'None running'}
          </Text>
        </View>
      </View>

      <RouteLine active={highlighted} />

      <View className="flex-row justify-between mb-3">
        <Text className="font-heading text-base text-black flex-shrink" numberOfLines={1}>
          {a}
        </Text>
        <Text className="font-heading text-base text-black flex-shrink text-right" numberOfLines={1}>
          {b}
        </Text>
      </View>

      {/* Real facts about the route (its actual fare, and how far apart the
          two towns really are), plus the commuter's next-jeepney ETA. */}
      <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
        <View className="flex-row items-center flex-shrink" style={{ gap: 6 }}>
          {route.fare != null && <Chip icon="cash-outline" label={`₱${route.fare}`} />}
          {km != null && <Chip icon="swap-horizontal-outline" label={`~${km} km`} />}
        </View>
        {showEta && (
          <Text className="font-accent text-sm text-primary" numberOfLines={1}>
            {nearestEtaMinutes === null ? 'Locating…' : `Next: ~${nearestEtaMinutes} min`}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <View
      className={`rounded-3xl p-4 mb-4 border ${
        highlighted ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
      }`}
    >
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}

      {onToggleSave && (
        <TouchableOpacity className="absolute top-4 right-4" onPress={onToggleSave} hitSlop={10}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? '#f57c1f' : '#9ca3af'} />
        </TouchableOpacity>
      )}
    </View>
  );
}
