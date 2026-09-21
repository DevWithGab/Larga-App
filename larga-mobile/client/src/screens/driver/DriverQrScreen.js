import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexts/AuthContext';


export default function DriverQrScreen({ navigation }) {
  const { user, profile } = useAuth();
  const qrValue = `larga://track/${user?.uid ?? ''}`;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-5 pt-2 pb-4">
        <TouchableOpacity
          className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="font-heading text-2xl text-black ml-3">My QR code</Text>
      </View>

      <View className="flex-1 items-center px-8 pt-6">
        <View
          className="bg-white rounded-3xl p-6 border border-gray-100 items-center"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <QRCode value={qrValue} size={220} color="#000" backgroundColor="#fff" />
        </View>

        <Text className="font-heading text-3xl text-black mt-8">
          {profile?.jeepneyNumber ?? 'Your jeepney'}
        </Text>
        <Text className="font-regular text-lg text-gray-500 text-center mt-2 px-4">
          Passengers scan this to find and start tracking your jeepney.
        </Text>
      </View>
    </SafeAreaView>
  );
}
