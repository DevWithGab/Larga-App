import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


export default function PasswordInput({ value, onChangeText, placeholder, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const [selection, setSelection] = useState(undefined);

  const handleChangeText = (text) => {
    onChangeText(text);
    setSelection({ start: text.length, end: text.length });
  };

  return (
    <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
      <MaterialIcons name="lock" size={22} color="#9ca3af" />
      <TextInput
        className="font-regular flex-1 py-5 px-3 text-lg text-black"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={handleChangeText}
        secureTextEntry={!showPassword}
        selection={selection}
        onSelectionChange={() => setSelection(undefined)}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} className="p-1">
        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
}
