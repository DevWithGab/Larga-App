import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getRoute, routeLabel } from '../../constants/routes';
import {
  formatClock,
  formatDayHeading,
  formatDuration,
  groupTripsByDay,
  startOfDay,
  startOfWeek,
  summariseTrips,
  toSortedTrips,
  tripSeconds,
} from '../../utils/trips';

const TABS = ['Today', 'This week', 'All'];

function SummaryStat({ icon, value, label }) {
  return (
    <View className="flex-1 items-center">
      <Ionicons name={icon} size={18} color="#f57c1f" />
      <Text className="font-heading text-2xl text-black mt-1" numberOfLines={1}>
        {value}
      </Text>
      <Text className="font-regular text-xs text-gray-500 mt-0.5 text-center">{label}</Text>
    </View>
  );
}


function TripRow({ trip }) {
  const route = getRoute(trip.routeId);
  const seconds = tripSeconds(trip);
  const startedAt = seconds != null ? new Date(trip.endedAt.getTime() - seconds * 1000) : null;

  return (
    <View className="flex-row items-center py-3 border-b border-gray-100">
      <View className="bg-primary rounded-xl px-2.5 py-1.5 mr-3">
        <Text className="font-accent text-xs text-white">{route?.code ?? '--'}</Text>
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-accent text-sm text-black" numberOfLines={1}>
          {route ? routeLabel(route, trip.direction) : 'Route not set'}
        </Text>
        <Text className="font-regular text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {startedAt ? `${formatClock(startedAt)} - ${formatClock(trip.endedAt)}` : formatClock(trip.endedAt)}
          {/* Deliberately not called "passengers": the counter is saved at
              the moment End trip is tapped, so it's who was still aboard
              then, not everyone who rode during the trip. */}
          {trip.passengerCount != null ? ` · ${trip.passengerCount} aboard at end` : ''}
        </Text>
      </View>
      <Text className="font-heading text-sm text-black">{formatDuration(seconds)}</Text>
    </View>
  );
}

export default function ReportScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Today');
  const [trips, setTrips] = useState(null); // null while still loading
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoadError('');
    setTrips(null);
    if (!user) { setTrips([]); return; }
    // Equality on a single field, so this needs no composite Firestore
    // index. Date filtering and ordering happen below, in memory.
    const tripsQuery = query(collection(db, 'trips'), where('driverId', '==', user.uid));
    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        setLoadError('');
        setTrips(toSortedTrips(snapshot.docs));
      },
      (error) => {
        console.warn('Failed to load trip reports:', error.message);
        setLoadError(error.code === 'permission-denied'
          ? 'Trip reports are blocked by the database permissions. Please contact support.'
          : 'Could not load your trips. Check your connection and try again.');
        setTrips([]);
      }
    );
    return unsubscribe;
  }, [user?.uid, retry]);

  const visibleTrips = useMemo(() => {
    if (!trips) return [];
    if (tab === 'All') return trips;
    const cutoff = tab === 'Today' ? startOfDay(new Date()) : startOfWeek();
    return trips.filter((trip) => trip.endedAt >= cutoff);
  }, [trips, tab]);

  const summary = useMemo(() => summariseTrips(visibleTrips), [visibleTrips]);

  const dayGroups = useMemo(() => groupTripsByDay(visibleTrips), [visibleTrips]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-4 pb-3">
        <Text className="font-heading text-3xl text-black mb-1">Trip reports</Text>
        <Text className="font-regular text-base text-gray-500 mb-4">
          Every trip you have finished, newest first.
        </Text>

        {/* Segmented tabs */}
        <View className="flex-row bg-gray-100 rounded-full p-1">
          {TABS.map((label) => {
            const active = tab === label;
            return (
              <TouchableOpacity
                key={label}
                className={`flex-1 items-center py-3 rounded-full ${active ? 'bg-white' : ''}`}
                style={
                  active ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : undefined
                }
                onPress={() => setTab(label)}
                activeOpacity={0.8}
              >
                <Text className={`font-accent text-base ${active ? 'text-black' : 'text-gray-500'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loadError ? (
        <View className="px-5 py-8 items-center">
          <Text accessibilityRole="alert" className="font-regular text-sm text-red-600 text-center">{loadError}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => setRetry((value) => value + 1)} className="mt-4 px-6 py-3 bg-black rounded-full"><Text className="font-accent text-white">Try again</Text></TouchableOpacity>
        </View>
      ) : trips === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f57c1f" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary for whichever range is selected */}
          <View className="flex-row border border-gray-200 rounded-2xl py-5 mb-6">
            <SummaryStat icon="repeat-outline" value={summary.count} label="Trips" />
            <View className="w-px bg-gray-200 my-1" />
            <SummaryStat icon="time-outline" value={formatDuration(summary.totalSeconds)} label="Driving time" />
            <View className="w-px bg-gray-200 my-1" />
            <SummaryStat
              icon="speedometer-outline"
              value={summary.count > 0 ? formatDuration(summary.avgSeconds) : '--'}
              label="Avg per trip"
            />
          </View>

          {dayGroups.length === 0 ? (
            <View className="items-center px-8 mt-10">
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text className="font-heading text-lg text-black mt-4 text-center">
                {tab === 'All' ? 'No trips recorded yet' : `No trips ${tab.toLowerCase()}`}
              </Text>
              <Text className="font-regular text-sm text-gray-500 text-center mt-1">
                Finished trips show up here once you end a trip on the Trip tab.
              </Text>
            </View>
          ) : (
            dayGroups.map((group) => (
              <View key={group.key} className="mb-5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-heading text-base text-black">{formatDayHeading(group.date)}</Text>
                  <Text className="font-regular text-sm text-gray-500">
                    {group.trips.length} trip{group.trips.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {group.trips.map((trip) => (
                  <TripRow key={trip.id} trip={trip} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
