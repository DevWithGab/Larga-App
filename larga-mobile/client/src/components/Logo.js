import React from 'react';
import { Image } from 'react-native';

const SOURCES = {
  short: require('../../assets/logo/logo-larga-short.png'),
  // White wordmark — for dark/colored backgrounds (e.g. the orange splash).
  dark: require('../../assets/logo/logo-larga-for_DARK.png'),
  // Black wordmark — for light backgrounds (e.g. white auth screens).
  light: require('../../assets/logo/logo-larga-for_LIGHT.png'),
};


const ASPECT_RATIO = 3;

export default function Logo({ variant = 'light', width = 160, style }) {
  const aspectRatio = variant === 'short' ? 1 : ASPECT_RATIO;
  return (
    <Image
      source={SOURCES[variant]}
      resizeMode="contain"
      style={[{ width, height: width / aspectRatio }, style]}
    />
  );
}
