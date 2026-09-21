import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSavedRoutes } from '../../hooks/useSavedRoutes';
import { savedRouteError } from '../../utils/savedRoutes';
import { ROUTES, getRoute, routeLabel, routePairLabel, routeDistanceKm } from '../../constants/routes';

function Button({ children, onPress, disabled, secondary = false }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
    className={`rounded-xl px-4 py-3 ${secondary ? 'bg-gray-100' : 'bg-primary'}`}
    style={{ minHeight: 44, opacity: disabled ? 0.45 : 1 }}>
    <Text className={`font-accent text-center ${secondary ? 'text-black' : 'text-white'}`}>{children}</Text>
  </TouchableOpacity>;
}

export default function SavedRoutesScreen({ navigation }) {
  const saved = useSavedRoutes();
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const available = ROUTES.filter((route) => !saved.routes.some((item) => item.routeId === route.id));
  const beginEdit = (item) => {
    setError('');
    setMessage('');
    setEditor(item ? { id: item.id, routeId: item.routeId, name: item.name || '', notes: item.notes || '', direction: item.direction || 'forward' }
      : { routeId: available[0]?.id || '', name: '', notes: '', direction: 'forward' });
  };
  const submit = async () => {
    setError('');
    try {
      if (editor.id) await saved.update(editor);
      else await saved.create(editor);
      setMessage(editor.id ? 'Saved route updated.' : 'Route saved.');
      setEditor(null);
    } catch (cause) { setError(savedRouteError(cause)); }
  };
  const remove = (item) => Alert.alert('Remove saved route?', 'This removes the route from your saved collection on mobile and web.', [
    { text: 'Keep route', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      setError('');
      setMessage('');
      try { await saved.remove(item); setMessage('Saved route removed.'); }
      catch (cause) { setError(savedRouteError(cause)); }
    } },
  ]);

  return <SafeAreaView className="flex-1 bg-white">
    <View className="flex-row items-center px-5 py-3">
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back" style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text className="font-heading text-3xl text-black">Saved routes</Text>
    </View>
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
        <Text className="font-regular text-gray-500">Your everyday trips, all in one place.</Text>
        {!!error && <Text accessibilityRole="alert" className="font-regular text-red-700">{error}</Text>}
        {!!message && <Text accessibilityLiveRegion="polite" className="font-regular text-green-700">{message}</Text>}
        {saved.loading ? <ActivityIndicator accessibilityLabel="Loading saved routes" color="#f57c1f" /> : saved.error ? <View style={{ gap: 12 }}>
          <Text className="font-regular text-red-700">{savedRouteError(saved.error)}</Text>
          <Button onPress={saved.retry}>Try again</Button>
        </View> : editor ? <View style={{ gap: 16 }}>
          <Text className="font-heading text-2xl">{editor.id ? 'Edit saved route' : 'Save a route'}</Text>
          <Text className="font-accent">Jeepney route</Text>
          {(editor.id ? ROUTES.filter((route) => route.id === editor.routeId) : available).map((route) => <TouchableOpacity
            key={route.id} accessibilityRole="radio" accessibilityState={{ checked: editor.routeId === route.id }} disabled={saved.busy || Boolean(editor.id)}
            onPress={() => setEditor({ ...editor, routeId: route.id })}
            className={`rounded-xl border px-4 py-3 ${editor.routeId === route.id ? 'border-primary bg-orange-50' : 'border-gray-200'}`}>
            <Text className="font-accent">{routePairLabel(route)}</Text>
          </TouchableOpacity>)}
          <Text className="font-accent">Name (optional)</Text>
          <TextInput accessibilityLabel="Saved route name" className="border border-gray-200 rounded-xl px-4 py-3 font-regular text-black" placeholder="e.g. Trip to school" maxLength={60} value={editor.name} editable={!saved.busy} onChangeText={(name) => setEditor({ ...editor, name })} />
          <Text className="font-accent">Travel direction</Text>
          {['forward', 'reverse'].map((direction) => <TouchableOpacity key={direction} accessibilityRole="radio" accessibilityState={{ checked: editor.direction === direction }} disabled={saved.busy}
            onPress={() => setEditor({ ...editor, direction })} className={`rounded-xl border px-4 py-3 ${editor.direction === direction ? 'border-primary bg-orange-50' : 'border-gray-200'}`}>
            <Text className="font-accent">{routeLabel(getRoute(editor.routeId), direction)}</Text>
          </TouchableOpacity>)}
          <Text className="font-accent">Notes (optional)</Text>
          <TextInput accessibilityLabel="Saved route notes" className="border border-gray-200 rounded-xl px-4 py-3 font-regular text-black" placeholder="Boarding point, reminders..." multiline textAlignVertical="top" style={{ minHeight: 96 }} maxLength={300} value={editor.notes} editable={!saved.busy} onChangeText={(notes) => setEditor({ ...editor, notes })} />
          <Button disabled={saved.busy || !editor.routeId} onPress={submit}>{saved.busy ? 'Saving...' : 'Save changes'}</Button>
          <Button secondary disabled={saved.busy} onPress={() => { setEditor(null); setError(''); }}>Cancel</Button>
        </View> : <>
          <Text className="font-accent">My routes · {saved.routes.length} saved</Text>
          <Button disabled={saved.busy || !available.length} onPress={() => beginEdit(null)}>{available.length ? 'Save a route' : 'All routes saved'}</Button>
          {!saved.routes.length && <View className="rounded-2xl bg-orange-50 p-6">
            <Ionicons name="bookmark-outline" size={32} color="#f57c1f" />
            <Text className="font-heading text-2xl mt-3">Your everyday trips start here</Text>
            <Text className="font-regular text-gray-600 mt-2">Save the ride to school, your daily commute, or a weekend visit.</Text>
          </View>}
          {saved.routes.map((item) => {
            const route = getRoute(item.routeId);
            const towns = route ? (item.direction === 'reverse' ? [...route.towns].reverse() : route.towns) : [];
            return <View key={item.id} className="rounded-2xl border border-gray-200 p-5" style={{ gap: 12 }}>
              <Text className="font-accent text-primary">{route ? `Route ${route.code}` : 'Unavailable route'} · Saved</Text>
              {!!item.name && <Text className="font-accent text-gray-600">{item.name}</Text>}
              {route ? <>
                <Text className="font-regular text-gray-500">From</Text><Text className="font-heading text-3xl">{towns[0]}</Text>
                <Text className="font-regular text-gray-500">To</Text><Text className="font-heading text-3xl">{towns[1]}</Text>
                <Text className="font-accent">₱{route.fare} one way · {routeDistanceKm(route)} km</Text>
                <Text className="font-regular text-xs text-gray-500">End-to-end fare · Approx. straight-line town distance</Text>
              </> : <Text className="font-regular text-gray-500">This route is no longer available.</Text>}
              {!!item.notes && <Text className="font-regular text-gray-600">{item.notes}</Text>}
              <Button disabled={!route || saved.busy} onPress={() => navigation.navigate('RouteMap', { routeId: item.routeId, direction: item.direction || 'forward' })}>View on map</Button>
              <View className="flex-row" style={{ gap: 12 }}>
                <Button secondary disabled={!route || saved.busy} onPress={() => beginEdit(item)}>Edit</Button>
                <Button secondary disabled={saved.busy} onPress={() => remove(item)}>Remove</Button>
              </View>
            </View>;
          })}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
