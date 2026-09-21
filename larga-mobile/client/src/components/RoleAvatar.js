import React from 'react';
import { Image, View } from 'react-native';

const SOURCES = {
  commuter: require('../../assets/avatar/Commuter-avatar.png'),
  driver: require('../../assets/avatar/driver-avatar.png'),
};

export default function RoleAvatar({ role, size = 64 }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="overflow-hidden"
    >
      <Image
        source={SOURCES[role]}
        resizeMode="cover"
        style={{ width: size, height: size }}
      />
    </View>
  );
}
