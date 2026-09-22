import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import RoleAvatar from '../../components/RoleAvatar';
import EditProfileModal from '../../components/EditProfileModal';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

function AccountRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-2xl bg-orange-50 items-center justify-center mr-3">
        <Ionicons name={icon} size={22} color="#f57c1f" />
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-accent text-base text-black">{title}</Text>
        <Text className="font-regular text-sm text-gray-500 mt-0.5">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}

export default function CommuterProfileScreen({ navigation }) {
  const { user, profile, logOut } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const savedQuery = query(collection(db, 'savedRoutes'), where('commuterId', '==', user.uid));
    const unsubscribe = onSnapshot(savedQuery, (snapshot) => setSavedCount(snapshot.size));
    return unsubscribe;
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  if (!user) return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6 pt-8">
        <Text className="font-heading text-3xl text-black">You're ready to ride.</Text>
        <Text className="font-regular text-base text-gray-600 mt-3">Use the map without an account. Your saved routes stay on this device.</Text>
        <AccountRow icon="bookmark-outline" title="Saved routes" subtitle="Your regular rides, in one place" onPress={() => navigation.navigate('SavedRoutes')} />
        <AccountRow icon="bus-outline" title="I drive a jeepney" subtitle="Driver login and sign-up" onPress={() => navigation.navigate('Auth', { screen: 'DriverLogin' })} />
        <AccountRow icon="arrow-back" title="Back to start" subtitle="Return to the welcome screen" onPress={() => navigation.navigate('Auth', { screen: 'Splash' })} />
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="items-center mb-8">
          <RoleAvatar role="commuter" size={100} />
          <Text className="font-heading text-3xl text-black mt-4">{profile?.name ?? 'Commuter'}</Text>
          <Text className="font-regular text-base text-gray-500 mt-1">{profile?.email ?? ''}</Text>
          {profile?.phoneNumber ? (
            <Text className="font-regular text-base text-gray-500 mt-0.5">{profile.phoneNumber}</Text>
          ) : null}
        </View>

        {/* Account */}
        <Text className="font-heading text-xl text-black mb-3">Account</Text>
        <View className="mb-8">
          <AccountRow
            icon="person-outline"
            title="Edit profile"
            subtitle="Change your name or contact number"
            onPress={() => setEditing(true)}
          />
          <AccountRow
            icon="qr-code-outline"
            title="Scan QR code"
            subtitle="Scan a jeepney to start tracking it"
            onPress={() => navigation.navigate('ScanQr')}
          />
          <AccountRow
            icon="map-outline"
            title="Routes"
            subtitle={`See all ${ROUTES.length} routes`}
            onPress={() => navigation.navigate('Routes')}
          />
          <AccountRow
            icon="bookmark-outline"
            title="Saved routes"
            subtitle={savedCount === 0 ? 'No routes saved yet' : `${savedCount} route${savedCount === 1 ? '' : 's'} saved`}
            onPress={() => navigation.navigate('SavedRoutes')}
          />
          <AccountRow
            icon="notifications-outline"
            title="Alerts"
            subtitle="Your saved arrival alerts"
            onPress={() => navigation.navigate('Alerts')}
          />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center border-2 border-red-200 py-5 rounded-full"
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          <Text className="font-accent text-red-600 text-lg ml-2">Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={editing}
        onClose={() => setEditing(false)}
        fields={[
          { key: 'name', label: 'Full name', placeholder: 'Juan Dela Cruz', required: true },
          {
            key: 'phoneNumber',
            label: 'Phone number',
            placeholder: '09XX XXX XXXX',
            keyboardType: 'phone-pad',
            maxLength: 20,
          },
        ]}
      />
    </SafeAreaView>
  );
}
