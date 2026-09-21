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

export default function CommuterSignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords don’t match', 'Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password, { name, userType: 'commuter' });
      // AuthContext's onAuthStateChanged listener picks up the new user and
      // AppNavigator switches to the Commuter stack automatically.
    } catch (error) {
      Alert.alert('Sign up failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google Sign-Up
    console.log('Google Sign-Up');
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
          <RoleBadge role="commuter" navigation={navigation} targetScreen="DriverSignUp" />

          {/* Title */}
          <Text className="font-heading text-3xl text-black mb-2">Create account</Text>
          <Text className="font-regular text-lg text-gray-600 mb-10">
            Sign up to track jeepneys near you.
          </Text>

          {/* Name Input */}
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

          {/* Email Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Email</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
              <MaterialIcons name="email" size={22} color="#9ca3af" />
              <TextInput
                className="font-regular flex-1 py-5 px-3 text-lg text-black"
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
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

          {/* Sign Up Button */}
          <TouchableOpacity
            className="bg-primary py-5 rounded-full items-center mt-3 mb-6"
            onPress={handleSignUp}
            activeOpacity={0.9}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-accent text-white text-xl">Sign up</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="font-regular mx-4 text-base text-gray-600">or continue with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            className="border border-gray-200 py-5 rounded-full items-center mb-6"
            onPress={handleGoogleSignUp}
            activeOpacity={0.9}
          >
            <Text className="font-heading text-2xl">G</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center">
            <Text className="font-regular text-base text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommuterLogin')}>
              <Text className="font-accent text-base text-primary">Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
