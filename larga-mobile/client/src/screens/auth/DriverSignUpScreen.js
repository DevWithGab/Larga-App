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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import RoleBadge from '../../components/RoleBadge';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import { phoneToEmail } from '../../utils/driverAuth';

export default function DriverSignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jeepneyNumber, setJeepneyNumber] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!name || !phoneNumber || !jeepneyNumber || !seatCapacity || !password || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    const seats = parseInt(seatCapacity, 10);
    if (!Number.isFinite(seats) || seats <= 0) {
      Alert.alert('Invalid seat count', 'Please enter how many seats your jeepney has.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords don’t match', 'Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const { email, phone } = phoneToEmail(phoneNumber);
      await signUp(email, password, {
        name,
        phone,
        jeepneyNumber,
        seatCapacity: seats,
        userType: 'driver',
      });
      // AuthContext's onAuthStateChanged listener picks up the new user and
      // AppNavigator switches to the Driver stack automatically.
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-5 pb-10">
          {/* Back Button */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
            <Text className="font-label text-base text-black ml-2">Back</Text>
          </TouchableOpacity>

          {/* Role Badge */}
          <RoleBadge role="driver" navigation={navigation} targetScreen="CommuterSignUp" />

          {/* Title */}
          <Text className="font-heading text-3xl text-black mb-2">Register your jeepney</Text>
          <Text className="font-regular text-lg text-gray-600 mb-6">
            Create an account to start sharing your location.
          </Text>

          {/* Info Banner */}
          <View className="flex-row items-center bg-orange-50 p-4 rounded-xl mb-8 gap-2">
            <Ionicons name="information-circle" size={22} color="#f57c1f" />
            <Text className="font-regular flex-1 text-base text-black">
              Your registration will be verified by our team
            </Text>
          </View>

          {/* Full Name Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Full name</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
              <Ionicons name="person-outline" size={22} color="#9ca3af" />
              <TextInput
                className="font-regular flex-1 py-5 px-3 text-lg text-black"
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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

          {/* Jeepney Number Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Jeepney plate number</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
              <MaterialCommunityIcons name="jeepney" size={22} color="#9ca3af" />
              <TextInput
                className="font-regular flex-1 py-5 px-3 text-lg text-black"
                placeholder="ABC 1234"
                placeholderTextColor="#9ca3af"
                value={jeepneyNumber}
                onChangeText={setJeepneyNumber}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Seat Capacity Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Number of seats</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
              <Ionicons name="people-outline" size={22} color="#9ca3af" />
              <TextInput
                className="font-regular flex-1 py-5 px-3 text-lg text-black"
                placeholder="16"
                placeholderTextColor="#9ca3af"
                value={seatCapacity}
                onChangeText={(text) => setSeatCapacity(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Password</Text>
            <PasswordInput value={password} onChangeText={setPassword} placeholder="Create password" />
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Confirm password</Text>
            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            className="bg-primary py-5 rounded-full items-center mt-3 mb-6"
            onPress={handleSignUp}
            activeOpacity={0.9}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-accent text-white text-xl">Register</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center">
            <Text className="font-regular text-base text-gray-600">Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverLogin')}>
              <Text className="font-accent text-base text-primary">Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
