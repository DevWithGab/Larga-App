import React from 'react';
import { Image } from 'react-native';

const SOURCE = require('../../assets/larga-jeep/larga-jeep.png');


export default function JeepneyIcon({ size = 32, style }) {
  return (
    <Image source={SOURCE} resizeMode="contain" style={[{ width: size, height: size }, style]} />
  );
}
