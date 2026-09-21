import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfileModal({ visible, onClose, fields, title = 'Edit profile' }) {
  const { profile, updateProfile } = useAuth();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const seeded = {};
    fields.forEach((field) => {
      const current = profile?.[field.key];
      seeded[field.key] = current == null ? '' : String(current);
    });
    setValues(seeded);
  }, [visible]);

  const handleSave = async () => {
    const patch = {};

    for (const field of fields) {
      const raw = (values[field.key] ?? '').trim();

      if (field.required && !raw) {
        Alert.alert('Missing info', `Please enter your ${field.label.toLowerCase()}.`);
        return;
      }

      if (field.numeric) {
        // Stored as a number because the rest of the app does arithmetic on it
        // (seats left = capacity - passengers); a numeric string would turn
        // that subtraction into NaN.
        const parsed = Number(raw);
        if (raw && (!Number.isFinite(parsed) || parsed < 0)) {
          Alert.alert('Check that number', `${field.label} must be a positive number.`);
          return;
        }
        patch[field.key] = raw ? parsed : null;
      } else {
        // null rather than '' so "never set" and "cleared" don't end up
        // looking like different states in Firestore.
        patch[field.key] = raw || null;
      }
    }

    setSaving(true);
    try {
      await updateProfile(patch);
      onClose();
    } catch (error) {
      Alert.alert('Could not save', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
            <TouchableOpacity onPress={onClose} hitSlop={10} disabled={saving}>
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
            <Text className="font-heading text-xl text-black">{title}</Text>
            {/* Balances the close button so the title stays centred. */}
            <View style={{ width: 26 }} />
          </View>

          <ScrollView
            className="flex-1 px-6 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {fields.map((field) => (
              <View key={field.key} className="mb-6">
                <Text className="font-label text-base text-black mb-2">
                  {field.label}
                  {!field.required && <Text className="font-regular text-gray-400"> (optional)</Text>}
                </Text>
                <View className="border border-gray-200 rounded-xl px-4 bg-gray-50">
                  <TextInput
                    className="font-regular py-4 text-lg text-black"
                    placeholder={field.placeholder}
                    placeholderTextColor="#9ca3af"
                    value={values[field.key] ?? ''}
                    onChangeText={(text) =>
                      setValues((current) => ({ ...current, [field.key]: text }))
                    }
                    keyboardType={field.keyboardType ?? 'default'}
                    autoCapitalize={field.autoCapitalize ?? 'sentences'}
                    maxLength={field.maxLength ?? 60}
                  />
                </View>
              </View>
            ))}

            <Text className="font-regular text-sm text-gray-500">
              These details are saved to your account, so they show up in the Larga web app too.
            </Text>
          </ScrollView>

          <View className="px-6 pt-4 pb-8">
            <TouchableOpacity
              className="bg-primary py-5 rounded-full items-center"
              onPress={handleSave}
              activeOpacity={0.9}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-accent text-white text-lg">Save changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
