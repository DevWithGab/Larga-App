import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, AppState, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
const KEY = 'larga:hide-location-reminder';

export default function LocationPrompt({ onReady, visibleRequest = 0 }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    const check = async (initial = false) => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        const enabled = await Location.hasServicesEnabledAsync();
        if (!active) return;
        if (permission.granted && enabled) { onReady(); setVisible(false); }
        else if (initial) {
          const hidden = await AsyncStorage.getItem(KEY);
          if (active) setVisible(hidden !== '1');
        }
      } catch { if (active && initial) setVisible(true); }
    };
    check(true);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') check(); });
    return () => { active = false; listener.remove(); };
  }, [onReady]);
  useEffect(() => { if (visibleRequest) setVisible(true); }, [visibleRequest]);
  const enable = async () => {
    setBusy(true); setMessage('');
    try {
      if (settings) { await Linking.openSettings(); return; }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setSettings(!permission.canAskAgain);
        setMessage('Allow location for Larga in your phone settings to show your position.'); return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setMessage('Turn on Location Services in your phone settings, then try again.'); return;
      }
      onReady(); setVisible(false);
    } catch { setMessage('Location is unavailable. Check your phone settings and try again.'); }
    finally { setBusy(false); }
  };
  const forget = async () => {
    try { await AsyncStorage.setItem(KEY, '1'); setVisible(false); }
    catch { setMessage('Could not save this preference. You can still choose Not now.'); }
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 }}>
      <View accessibilityViewIsModal style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '90%' }}>
        <ScrollView>
          <View className="flex-row items-center justify-between mb-4">
            <Ionicons name="location-outline" size={28} color="#f57c1f" />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close location reminder" onPress={() => setVisible(false)} style={{ padding: 12 }}><Ionicons name="close" size={22} color="#111" /></TouchableOpacity>
          </View>
          <Text className="font-accent text-xs uppercase tracking-widest text-gray-500">Before you ride</Text>
          <Text accessibilityRole="header" className="font-heading text-3xl text-black mt-1">Find your nearest ride.</Text>
          <Text className="font-regular text-base text-gray-600 mt-2 leading-6">Turn on location to see yourself on the map and estimate how far away a jeepney is. You can still browse without it.</Text>
          {!!message && <Text accessibilityLiveRegion="polite" className="font-regular text-sm text-gray-700 mt-3">{message}</Text>}
          <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={enable} className="bg-primary rounded-full py-3 px-4 mt-6 items-center">
            <Text className="font-accent text-base text-white">{busy ? 'Checking location?' : settings ? 'Open settings' : 'Turn on location'}</Text>
          </TouchableOpacity>
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity accessibilityRole="button" onPress={() => setVisible(false)} className="py-3 px-1"><Text className="font-accent text-sm text-gray-600">Not now</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={forget} className="py-3 px-1"><Text className="font-accent text-sm text-gray-600">Don't show again</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
