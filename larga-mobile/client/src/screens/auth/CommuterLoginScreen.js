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

export default function CommuterLoginScreen({ navigation }) {
  const { logIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Ticked by default: staying signed in is what the app has always done,
  // so nobody gets logged out unexpectedly. Untick it on a borrowed phone.
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handlePasswordReset = async () => {
    if (submitting || resetting) return;
    const resetEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      Alert.alert('Email needed', 'Enter a valid email address above to reset your password.');
      return;
    }
    const showSuccess = () => Alert.alert('Check your email', 'If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.');
    setResetting(true);
    try {
      await resetPassword(resetEmail);
      showSuccess();
    } catch (error) {
      if (error.code === 'auth/user-not-found') showSuccess();
      else {
        const messages = {
          'auth/invalid-email': 'Enter a valid email address above.',
          'auth/too-many-requests': 'Too many requests. Please wait before trying again.',
          'auth/network-request-failed': 'Check your internet connection and try again.',
        };
        Alert.alert('Could not reset password', messages[error.code] || 'Could not send the reset email. Please try again.');
      }
    } finally { setResetting(false); }
  };

  const handleLogin = async () => {
    if (submitting || resetting) return;
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await logIn(email, password, rememberMe);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign-In
    console.log('Google Sign-In');
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
          <RoleBadge role="commuter" navigation={navigation} targetScreen="DriverLogin" />

          {/* Title */}
          <Text className="font-heading text-4xl text-black mb-2">Welcome back.</Text>
          <Text className="font-regular text-lg text-gray-600 mb-10">
            Login to see jeep near you.
          </Text>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="font-label text-base text-black mb-2">Email or phone</Text>
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
            <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />
          </View>

          {/* Remember Me & Forgot Password */}
          <View className="flex-row justify-between items-center mb-8">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setRememberMe(!rememberMe)}
            >
              {/* Same filled/unfilled treatment as the driver login's box —
                  it now starts ticked, so the two roles shouldn't look
                  different on the very first screen a user sees. */}
              <View
                className={`w-6 h-6 rounded border-2 justify-center items-center mr-2 ${
                  rememberMe ? 'bg-primary border-primary' : 'border-gray-200'
                }`}
              >
                {rememberMe && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text className="font-regular text-base text-gray-600">Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePasswordReset} disabled={submitting || resetting} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text className="font-label text-base text-primary">{resetting ? 'Sending reset link...' : 'Forgot password?'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Fixed footer — pinned to the bottom, outside the scrollable form,
            same pattern as the Continue button on RoleSelectionScreen. */}
        <View className="px-6 pt-4 pb-8">
          {/* Login Button */}
          <TouchableOpacity
            className="bg-primary py-5 rounded-full items-center mb-6"
            onPress={handleLogin}
            activeOpacity={0.9}
            disabled={submitting || resetting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-accent text-white text-xl">Log in</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="font-regular mx-4 text-base text-gray-600">or continue with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            className="border border-gray-200 py-5 rounded-full items-center mb-6"
            onPress={handleGoogleSignIn}
            activeOpacity={0.9}
          >
            <Text className="font-heading text-2xl">G</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center">
            <Text className="font-regular text-base text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommuterSignUp')}>
              <Text className="font-accent text-base text-primary">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
