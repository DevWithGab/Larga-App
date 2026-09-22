import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import RoleBadge from '../../components/RoleBadge';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import { phoneToEmail } from '../../utils/driverAuth';

export default function DriverLoginScreen({ navigation }) {
  const { logIn } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  // Ticked by default: staying signed in is what the app has always done,
  // so no driver gets logged out unexpectedly between shifts.
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Missing info', 'Please enter your mobile number and password.');
      return;
    }
    setSubmitting(true);
    try {
      const { email } = phoneToEmail(phoneNumber);
      await logIn(email, password, keepLoggedIn);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSMSCode = () => {
    if (!phoneNumber) {
      Alert.alert('Mobile number needed', 'Enter your mobile number first.');
      return;
    }
    navigation.navigate('DriverOtp', { phoneNumber });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-10"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
            <Text className="font-label text-base text-black ml-2">Back</Text>
          </TouchableOpacity>

          {/* Role Badge */}
          <RoleBadge role="driver" navigation={navigation} targetScreen="Splash" />

          {/* Title */}
          <Text className="font-heading text-4xl text-black mb-2">Balik biyahe.</Text>
          <Text className="font-regular text-lg text-gray-600 mb-10">
            Login to start sharing your location.
          </Text>

          {/* Mobile Number Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Mobile number</Text>
            <View className="flex-row gap-3">
              <View className="flex-row items-center px-4 py-5 border border-gray-200 rounded-xl bg-gray-50 gap-2">
                <Text className="font-label text-lg text-black">+63</Text>
                <Ionicons name="chevron-down" size={18} color="#9ca3af" />
              </View>
              <View className="flex-1 border border-gray-200 rounded-xl px-4 bg-gray-50">
                <TextInput
                  className="font-regular py-5 text-lg text-black"
                  placeholder="917 1234 4567"
                  placeholderTextColor="#9ca3af"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Password</Text>
            <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />
          </View>

          {/* Keep Logged In */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => setKeepLoggedIn(!keepLoggedIn)}
          >
            <View
              className={`w-6 h-6 rounded border-2 justify-center items-center mr-2 ${
                keepLoggedIn ? 'bg-primary border-primary' : 'border-gray-200'
              }`}
            >
              {keepLoggedIn && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text className="font-regular text-base text-black">Keep me logged in</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Fixed footer — pinned to the bottom, outside the scrollable form,
            same pattern as the Continue button on RoleSelectionScreen. */}
        <View className="px-6 pt-4 pb-8">
          {/* Login Button */}
          <TouchableOpacity
            className="bg-primary py-5 rounded-full items-center mb-4"
            onPress={handleLogin}
            activeOpacity={0.9}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-accent text-white text-xl">Log in</Text>
            )}
          </TouchableOpacity>

          {/* SMS Code Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center py-5 rounded-full border border-gray-200 gap-2 mb-6"
            onPress={handleSMSCode}
            activeOpacity={0.9}
          >
            <MaterialIcons name="sms" size={22} color="#000" />
            <Text className="font-label text-lg text-black">Text me a code instead</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row justify-center">
            <Text className="font-regular text-base text-gray-600">New driver? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverSignUp')}>
              <Text className="font-accent text-base text-primary">Register your jeepney</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
