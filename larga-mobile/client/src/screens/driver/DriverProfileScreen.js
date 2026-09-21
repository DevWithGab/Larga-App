import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RoleAvatar from '../../components/RoleAvatar';
import EditProfileModal from '../../components/EditProfileModal';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

function InfoRow({ label, value, valueColor = 'text-black', last = false }) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${last ? '' : 'border-b border-gray-100'}`}>
      <Text className="font-regular text-base text-gray-500">{label}</Text>
      <Text className={`font-accent text-base ${valueColor}`}>{value}</Text>
    </View>
  );
}

function AccountRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-2xl bg-orange-50 items-center justify-center mr-3">
        <Ionicons name={icon} size={24} color="#f57c1f" />
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-accent text-lg text-black">{title}</Text>
        <Text className="font-regular text-sm text-gray-500 mt-0.5">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );
}

export default function DriverProfileScreen({ navigation }) {
  const { profile, logOut } = useAuth();
  const [editing, setEditing] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="items-center mb-8">
          <RoleAvatar role="driver" size={100} />
          <Text className="font-heading text-3xl text-black mt-4">{profile?.name ?? 'Driver'}</Text>
          <Text className="font-regular text-base text-gray-500 mt-1">{profile?.phone ?? ''}</Text>
        </View>

        {/* Jeepney info */}
        <Text className="font-heading text-xl text-black mb-3">Jeepney</Text>
        <View className="border border-gray-200 rounded-2xl px-4 mb-8">
          <InfoRow label="Plate number" value={profile?.jeepneyNumber ?? '—'} />
          <InfoRow label="Body number" value={profile?.bodyNumber ?? '—'} />
          <InfoRow label="Seats" value={profile?.seatCapacity ?? 16} last />
        </View>

        {/* Account */}
        <Text className="font-heading text-xl text-black mb-3">Account</Text>
        <View className="mb-8">
          <AccountRow
            icon="person-outline"
            title="Edit profile"
            subtitle="Change your name, plate number or seats"
            onPress={() => setEditing(true)}
          />
          <AccountRow
            icon="qr-code-outline"
            title="My QR code"
            subtitle="Passengers scan this to track you"
            onPress={() => navigation.navigate('DriverQr')}
          />
          <AccountRow
            icon="map-outline"
            title="Routes"
            subtitle={`See all ${ROUTES.length} routes`}
            onPress={() => navigation.navigate('Route')}
          />
          <AccountRow
            icon="document-text-outline"
            title="Trip reports"
            subtitle="View your trip history"
            onPress={() => navigation.navigate('Reports')}
          />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center border-2 border-red-200 py-5 rounded-full"
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <Ionicons name="log-out-outline" size={24} color="#dc2626" />
          <Text className="font-accent text-red-600 text-lg ml-2">Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={editing}
        onClose={() => setEditing(false)}
        fields={[
          { key: 'name', label: 'Full name', placeholder: 'Juan Dela Cruz', required: true },
          {
            key: 'jeepneyNumber',
            label: 'Plate number',
            placeholder: 'ABC 1234',
            autoCapitalize: 'characters',
            maxLength: 20,
          },
          { key: 'bodyNumber', label: 'Body number', placeholder: '12', maxLength: 20 },
          {
            key: 'seatCapacity',
            label: 'Seats',
            placeholder: '16',
            keyboardType: 'number-pad',
            numeric: true,
            maxLength: 3,
          },
        ]}
      />
    </SafeAreaView>
  );
}
