import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 42;

function maskPhone(rawPhoneNumber) {
  const digits = rawPhoneNumber.replace(/\D/g, '');
  if (digits.length < 7) return `+63 ${digits}`;
  const first3 = digits.slice(0, 3);
  const last4 = digits.slice(-4);
  return `+63 ${first3} •••${last4}`;
}

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const generateDevCode = () => String(Math.floor(100000 + Math.random() * 900000));

export default function DriverOtpScreen({ navigation, route }) {
  const phoneNumber = route.params?.phoneNumber ?? '';
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  // DEV ONLY: no SMS provider/backend is wired up yet (needs either Firebase
  // Phone Auth + reCAPTCHA, or a backend + SMS API — a bigger setup on its
  // own). This generates a local test code so the UI flow is fully usable
  // and testable in the meantime.
  const [devCode, setDevCode] = useState(generateDevCode());
  const inputs = useRef([]);

  useEffect(() => {
    console.log('[DEV] OTP test code:', devCode);
  }, [devCode]);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (text, index) => {
    const digits = text.replace(/\D/g, '');
    const next = [...code];

    if (!digits) {
      next[index] = '';
      setCode(next);
      return;
    }

    if (digits.length > 1) {
      // Full code pasted/autofilled into one box — spread it across the rest.
      for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = digits[i];
      }
      setCode(next);
      const lastIndex = Math.min(index + digits.length, CODE_LENGTH) - 1;
      inputs.current[Math.min(lastIndex + 1, CODE_LENGTH - 1)]?.focus();
      return;
    }

    next[index] = digits;
    setCode(next);
    if (index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setDevCode(generateDevCode());
    setSecondsLeft(RESEND_SECONDS);
    setCode(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();
  };

  const handleVerify = () => {
    const entered = code.join('');
    if (entered.length < CODE_LENGTH) return;

    if (entered === devCode) {
      Alert.alert(
        'Code verified (demo)',
        "Real SMS sign-in isn't connected to a backend yet — log in with your password for now.",
        [{ text: 'OK', onPress: () => navigation.navigate('DriverLogin') }]
      );
    } else {
      Alert.alert('Incorrect code', "That code doesn't match. Please try again.");
    }
  };

  const isComplete = code.every((digit) => digit !== '');

  return (
    <SafeAreaView className="flex-1 bg-white px-6 pt-5">
      {/* Back Button */}
      <TouchableOpacity className="flex-row items-center mb-8" onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text className="font-label text-base text-black ml-2">Back</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text className="font-heading text-3xl text-black mb-2">Enter the code.</Text>
      <Text className="font-regular text-base text-gray-600">We texted a 6-digit code to</Text>
      <Text className="font-accent text-base text-black mb-8">{maskPhone(phoneNumber)}</Text>

      {/* OTP boxes */}
      <View className="flex-row justify-between mb-3">
        {code.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const isFilled = digit !== '';
          return (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              selectTextOnFocus
              className={`font-heading text-xl text-black text-center rounded-2xl ${
                isFilled || isFocused ? 'border-2 border-primary' : 'border-0'
              } ${isFocused && !isFilled ? 'bg-orange-50' : isFilled ? 'bg-white' : 'bg-gray-100'}`}
              style={{ width: 44, height: 56 }}
            />
          );
        })}
      </View>

      <Text className="font-regular text-xs text-gray-400 mb-6">DEV: your test code is {devCode}</Text>

      {/* Resend timer */}
      <View className="flex-row items-center mb-8">
        <Text className="font-regular text-sm text-gray-500">Resend code in </Text>
        {secondsLeft > 0 ? (
          <Text className="font-accent text-sm text-black">{formatCountdown(secondsLeft)}</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text className="font-accent text-sm text-primary">Resend code</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        className={`py-5 rounded-full items-center mb-4 ${isComplete ? 'bg-primary' : 'bg-primary/40'}`}
        onPress={handleVerify}
        activeOpacity={0.9}
        disabled={!isComplete}
      >
        <Text className="font-accent text-white text-lg">Verify and continue</Text>
      </TouchableOpacity>

      {/* Use a different number */}
      <TouchableOpacity
        className="border border-gray-200 py-5 rounded-full items-center mb-8"
        onPress={() => navigation.goBack()}
        activeOpacity={0.9}
      >
        <Text className="font-accent text-black text-base">Use a different number</Text>
      </TouchableOpacity>

      {/* Info banner */}
      <View className="flex-row items-start bg-gray-50 rounded-2xl p-4">
        <MaterialCommunityIcons name="shield-outline" size={20} color="#6b7280" style={{ marginTop: 2 }} />
        <Text className="font-regular text-sm text-gray-500 ml-3 flex-1 leading-5">
          Your number is only used to verify your account and by operators who manage your route.
        </Text>
      </View>
    </SafeAreaView>
  );
}
