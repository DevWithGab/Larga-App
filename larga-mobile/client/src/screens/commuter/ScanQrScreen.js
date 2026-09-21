import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const QR_PATTERN = /^larga:\/\/track\/(.+)$/;

export default function ScanQrScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScanned = ({ data }) => {
    if (scanned) return;
    const match = QR_PATTERN.exec(data);

    if (!match) {
      setScanned(true);
      Alert.alert("That's not a Larga QR code", "This doesn't look like a jeepney tracking code.", [
        { text: 'Try again', onPress: () => setScanned(false) },
      ]);
      return;
    }

    setScanned(true);
    navigation.replace('Tracking', { driverId: match[1] });
  };

  if (!permission) {
    // Still loading the permission state — avoid a flash of the "denied" UI.
    return <SafeAreaView className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <Ionicons name="camera-outline" size={48} color="#fff" />
        <Text className="font-heading text-xl text-white text-center mt-4">Camera access needed</Text>
        <Text className="font-regular text-base text-gray-300 text-center mt-2 mb-6">
          Larga needs your camera to scan a jeepney's QR code.
        </Text>
        <TouchableOpacity
          className="bg-primary py-4 px-8 rounded-full"
          onPress={requestPermission}
          activeOpacity={0.9}
        >
          <Text className="font-accent text-white text-lg">Grant access</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-5" onPress={() => navigation.goBack()}>
          <Text className="font-accent text-gray-400 text-base">Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScanned}
      />

      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <TouchableOpacity
          className="w-12 h-12 rounded-full items-center justify-center ml-5 mt-2"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center">
          <View
            style={{
              width: 240,
              height: 240,
              borderWidth: 3,
              borderColor: '#f57c1f',
              borderRadius: 24,
            }}
          />
          <Text className="font-accent text-white text-lg mt-6 text-center px-10">
            Point your camera at a jeepney's QR code
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
