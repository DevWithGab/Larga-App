import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';
import RoleAvatar from '../../components/RoleAvatar';

export default function RoleSelectionScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (selectedRole === 'commuter') {
      navigation.navigate('CommuterLogin');
    } else if (selectedRole === 'driver') {
      navigation.navigate('DriverLogin');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10 pb-8">
        {/* Logo */}
        <View className="items-center mb-10">
          <Logo variant="light" width={200} />
        </View>

        {/* Title */}
        <View className="items-center">
          <Text className="font-heading text-4xl text-black mb-2">Lets' get started!</Text>
          <Text className="font-regular text-base text-gray-600 mb-10">
            Tell us how you'll be using Larga
          </Text>
        </View>

        {/* Role Cards */}
        <View className="gap-4">
          {/* Commuter Card */}
          <TouchableOpacity
            className={`border-2 rounded-2xl p-6 ${
              selectedRole === 'commuter' ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
            onPress={() => setSelectedRole('commuter')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <RoleAvatar role="commuter" size={84} />
              <View className="flex-1 ml-5">
                <Text className="font-heading text-xl text-black mb-1.5">Commuter</Text>
                <Text className="font-regular text-base text-gray-600 leading-6">
                  Track Jeepney and{'\n'}view routes.
                </Text>
              </View>
              <View className="ml-3">
                {selectedRole === 'commuter' ? (
                  <Ionicons name="checkmark-circle" size={30} color="#f57c1f" />
                ) : (
                  <View className="w-7 h-7 rounded-full border-2 border-gray-200" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Driver Card */}
          <TouchableOpacity
            className={`border-2 rounded-2xl p-6 ${
              selectedRole === 'driver' ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
            onPress={() => setSelectedRole('driver')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <RoleAvatar role="driver" size={84} />
              <View className="flex-1 ml-5">
                <Text className="font-heading text-xl text-black mb-1.5">Jeepney Driver</Text>
                <Text className="font-regular text-base text-gray-600 leading-6">
                  Manage your jeepney{'\n'}and location
                </Text>
              </View>
              <View className="ml-3">
                {selectedRole === 'driver' ? (
                  <Ionicons name="checkmark-circle" size={30} color="#f57c1f" />
                ) : (
                  <View className="w-7 h-7 rounded-full border-2 border-gray-200" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Flexible spacer pushes the Continue button + Sign up link to the bottom edge */}
        <View className="flex-1" />

        {/* Continue Button */}
        <TouchableOpacity
          className={`bg-primary py-5 rounded-full items-center mb-5 ${
            !selectedRole && 'opacity-50'
          }`}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.9}
        >
          <Text className="font-accent text-white text-lg">Continue</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center">
          <Text className="font-regular text-sm text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('CommuterSignUp')}>
            <Text className="font-accent text-sm text-primary">Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
