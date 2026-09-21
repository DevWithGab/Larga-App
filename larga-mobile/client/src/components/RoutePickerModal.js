import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES, routeDistanceKm } from '../constants/routes';


export default function RoutePickerModal({ visible, onClose, onSelect }) {
  const [pickedRoute, setPickedRoute] = useState(null);

  useEffect(() => {
    if (!visible) setPickedRoute(null);
  }, [visible]);

  const handleClose = () => {
    setPickedRoute(null);
    onClose();
  };

  const handleSelectDirection = (direction) => {
    onSelect(pickedRoute.id, direction);
    setPickedRoute(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '88%' }}>
          {/* Drag handle */}
          <View className="items-center pb-4">
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#d1d5db' }} />
          </View>

          <View className="flex-row items-start justify-between mb-5">
            <View className="flex-row items-start flex-1 pr-3">
              {pickedRoute ? (
                <TouchableOpacity
                  className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center mr-3"
                  onPress={() => setPickedRoute(null)}
                >
                  <Ionicons name="arrow-back" size={22} color="#000" />
                </TouchableOpacity>
              ) : (
                <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center mr-3">
                  <Ionicons name="navigate" size={20} color="#f57c1f" />
                </View>
              )}
              <View className="flex-1 pt-1">
                <Text className="font-heading text-xl text-black" numberOfLines={1}>
                  {pickedRoute ? 'Which way are you headed?' : 'Choose your route'}
                </Text>
                <Text className="font-regular text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                  {pickedRoute ? `Route ${pickedRoute.code} — pick your direction.` : "Select the route you'll be traveling today."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {!pickedRoute ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              {ROUTES.map((route) => {
                const [a, b] = route.towns;
                const km = routeDistanceKm(route);
                return (
                  <TouchableOpacity
                    key={route.id}
                    className="flex-row items-center border border-gray-200 rounded-2xl p-3 mb-3"
                    onPress={() => setPickedRoute(route)}
                    activeOpacity={0.8}
                  >
                    <View className="bg-primary rounded-2xl w-14 h-14 items-center justify-center mr-3">
                      <Text className="font-heading text-lg text-white">{route.code}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="font-accent text-base text-black" numberOfLines={1}>
                        {a} ⇄ {b}
                      </Text>
                      <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                        {route.fare != null && (
                          <View className="bg-orange-50 rounded-full px-2 py-0.5">
                            <Text className="font-accent text-xs text-primary">₱{route.fare}</Text>
                          </View>
                        )}
                        {km != null && (
                          <Text className="font-regular text-sm text-gray-500">~{km} km apart</Text>
                        )}
                      </View>
                    </View>
                    <View className="w-14 h-14 rounded-2xl bg-orange-50 items-center justify-center mr-2">
                      <Ionicons name={route.icon} size={24} color="#f57c1f" />
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })}

              {/* Tip */}
              <View className="flex-row items-start bg-orange-50 rounded-2xl p-4 mt-1">
                <Ionicons name="bulb-outline" size={20} color="#f57c1f" style={{ marginTop: 1 }} />
                <View className="flex-1 ml-3">
                  <Text className="font-accent text-sm text-primary">Make sure to select the correct route</Text>
                  <Text className="font-regular text-xs text-gray-500 mt-0.5">
                    You can change your route anytime before going online.
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View>
              <View className="items-center mb-6">
                <View className="bg-primary rounded-full px-4 py-1.5">
                  <Text className="font-accent text-base text-white">{pickedRoute.code}</Text>
                </View>
              </View>

              <TouchableOpacity
                className="flex-row items-center justify-center border-2 border-gray-200 rounded-2xl py-6 mb-4"
                onPress={() => handleSelectDirection('forward')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward-circle" size={28} color="#f57c1f" />
                <Text className="font-accent text-xl text-black ml-3" numberOfLines={1}>
                  {pickedRoute.towns[0]} → {pickedRoute.towns[1]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-center border-2 border-gray-200 rounded-2xl py-6"
                onPress={() => handleSelectDirection('reverse')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={28}
                  color="#f57c1f"
                  style={{ transform: [{ scaleX: -1 }] }}
                />
                <Text className="font-accent text-xl text-black ml-3" numberOfLines={1}>
                  {pickedRoute.towns[1]} → {pickedRoute.towns[0]}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
