import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { driverSignal } from '../utils/driverSignal';

export default function JeepneySignal({ driver }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  const signal = driverSignal(driver, now);
  return (
    <View className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`Jeepney signal: ${signal.label}. ${signal.detail}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 }}>
          {[1, 2, 3, 4].map((bar) => <View key={bar} style={{ width: 4, height: 4 + bar * 3, borderRadius: 1, backgroundColor: bar <= signal.bars ? signal.color : '#cbd5e1' }} />)}
        </View>
        <Text className="font-accent text-xs" style={{ color: signal.color, flexShrink: 1 }}>Jeepney signal: {signal.label}</Text>
      </View>
      <Text className="font-regular mt-1 text-xs text-gray-600">{signal.detail}</Text>
      <Text className="font-regular mt-0.5 text-gray-400" style={{ fontSize: 10 }}>Estimated from driver check-ins.</Text>
    </View>
  );
}
