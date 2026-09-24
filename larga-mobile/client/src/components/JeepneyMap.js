import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Pressable, AccessibilityInfo } from 'react-native';
import { Map, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { MAP_STYLE_URL, DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants/map';
import { useAnimatedCoordinate } from '../hooks/useAnimatedCoordinate';
import { useHeading } from '../hooks/useHeading';
import JeepneyIcon from './JeepneyIcon';
import RoleAvatar from './RoleAvatar';

const GLOW_COLOR = '#f57c1f'; // brand primary orange
const TRAIL_COLOR = '#f57c1f';
const TRAIL_CASING_COLOR = '#b4510c'; // deeper orange outline under the trail
const ROUTE_LINE_COLOR = '#f57c1f';
const MAX_TRAIL_POINTS = 200; // ~15-20 min of GPS pings per jeepney

// Wraps a route's path coordinates as GeoJSON for the route-path line layer.
function routeLineToGeoJSON(routeLine) {
  if (!routeLine || routeLine.length < 2) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeLine } }],
  };
}


function useJeepneyTrails(markers) {
  const trailsRef = useRef({});
  const [geojson, setGeojson] = useState({ type: 'FeatureCollection', features: [] });

  useEffect(() => {
    const next = { ...trailsRef.current };
    const activeIds = new Set();
    let changed = false;

    markers.forEach((marker) => {
      if (marker.variant !== 'jeepney') return;
      activeIds.add(marker.id);
      const [lng, lat] = marker.coordinate;
      const trail = next[marker.id] ?? [];
      const last = trail[trail.length - 1];
      if (!last || last[0] !== lng || last[1] !== lat) {
        next[marker.id] = [...trail, [lng, lat]].slice(-MAX_TRAIL_POINTS);
        changed = true;
      }
    });

    Object.keys(next).forEach((id) => {
      if (!activeIds.has(id)) {
        delete next[id];
        changed = true;
      }
    });

    if (changed) {
      trailsRef.current = next;
      setGeojson({
        type: 'FeatureCollection',
        features: Object.entries(next)
          .filter(([, coords]) => coords.length > 1)
          .map(([id, coords]) => ({
            type: 'Feature',
            properties: { id },
            geometry: { type: 'LineString', coordinates: coords },
          })),
      });
    }
  }, [markers]);

  return geojson;
}


function PulsingGlow({ size, color = GLOW_COLOR }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduceMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; listener.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) { pulse.setValue(0.4); return; }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}


function AnimatedMarker({ marker, onMarkerPress }) {
  const displayed = useAnimatedCoordinate(marker.coordinate);

  const rotation = useHeading(marker.coordinate);
  if (!displayed) return null;

  if (marker.variant === 'endpoint') {
 
    return (
      <Marker id={marker.id} lngLat={displayed} anchor="bottom">
        <View className="items-center">
          <View className="bg-black px-2.5 py-1 rounded-full mb-1">
            <Text className="font-accent text-xs text-white">{marker.label}</Text>
          </View>
          <View className="w-3.5 h-3.5 rounded-full bg-black border-2 border-white" />
        </View>
      </Marker>
    );
  }

  if (marker.variant === 'you') {
    const avatarSize = 36;
    const glowSize = avatarSize * 1.6;
    const boxSize = glowSize + 12;
    return (
      <Marker id={marker.id} lngLat={displayed}>
        <View style={{ width: boxSize, height: boxSize, alignItems: 'center', justifyContent: 'center' }}>
          <PulsingGlow size={glowSize} />
          <View
            className="rounded-full overflow-hidden bg-white"
            style={{
              width: avatarSize,
              height: avatarSize,
              borderWidth: 2,
              borderColor: '#fff',
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 6,
            }}
          >
            <RoleAvatar role="commuter" size={avatarSize} />
          </View>
        </View>
      </Marker>
    );
  }

  const badgeSize = marker.selected ? 52 : 40;
  const color = marker.full ? '#dc2626' : GLOW_COLOR;
  const glowSize = badgeSize * 1.5;
  const boxSize = glowSize + 12;

  return (
    <Marker id={marker.id} lngLat={displayed} selected={Boolean(marker.selected)} onPress={onMarkerPress ? () => onMarkerPress(marker.id) : undefined}>
      <Pressable
        disabled={!onMarkerPress}
        onPress={() => onMarkerPress?.(marker.id)}
        accessibilityRole={onMarkerPress ? 'button' : 'image'}
        accessibilityLabel={`${marker.label || 'Jeepney'}, ${marker.full ? 'full' : 'online'}${onMarkerPress ? '. View details' : ''}`}
        accessibilityState={{ selected: Boolean(marker.selected) }}
        style={{ width: boxSize, height: boxSize, alignItems: 'center', justifyContent: 'center' }}>
        <PulsingGlow size={glowSize} color={color} />
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: badgeSize,
            height: badgeSize,
            backgroundColor: marker.full ? '#fee2e2' : '#ffedd5',
            borderWidth: 2,
            borderColor: color,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                    extrapolate: 'extend',
                  }),
                },
              ],
            }}
          >
            <JeepneyIcon size={marker.selected ? 40 : 30} />
          </Animated.View>
        </View>
      </Pressable>
    </Marker>
  );
}

// markers: [{ id, coordinate: [lng, lat], variant: 'jeepney' | 'you' | 'endpoint', label?, selected? }]
// routeLine: [[lng, lat], ...] — a route's full path, drawn as a dashed
// orange line (distinct from the solid jeepney breadcrumb trail).
// bounds: [west, south, east, north] — when given, the camera fits these
// bounds instead of using `center`/`zoom` (handy for framing a whole route).
// followCamera: when false, the camera stops re-centering on every update —
// frozen at wherever it last was — so a caller with a "Follow" toggle (e.g.
// TrackingScreen) can let someone pan around freely without the map
// snapping back underneath them. Markers/trails keep animating live either
// way; only the camera itself freezes.
export default function JeepneyMap({
  markers = [],
  center,
  zoom = DEFAULT_ZOOM,
  routeLine,
  bounds,
  style,
  followCamera = true,
  onMarkerPress,
}) {
  const cameraCenter = center ?? markers[0]?.coordinate ?? DEFAULT_CENTER;
  const trails = useJeepneyTrails(markers);
  const routeGeoJSON = routeLineToGeoJSON(routeLine);

  const initialViewState = bounds ? { bounds } : { center: cameraCenter, zoom };
  // `zoom` is deliberately NOT repeated in the live stop: initialViewState
  // above already sets the starting zoom once, and a camera stop applies every
  // field it carries. Sending zoom along with each recenter meant every GPS
  // fix silently snapped the map back to the default zoom — so pinching in to
  // watch a jeepney closely was undone the moment it moved.
  const liveCameraStop = bounds
    ? { bounds, padding: { top: 90, bottom: 240, left: 50, right: 50 }, duration: 700 }
    : { center: cameraCenter, duration: 600 };

  // While following, keep tracking the live stop so it's ready the instant
  // following turns off — freezing right where the camera already is,
  // rather than jumping to some other coordinate when it stops.
  const frozenStopRef = useRef(liveCameraStop);
  if (followCamera) frozenStopRef.current = liveCameraStop;
  const cameraStop = followCamera ? liveCameraStop : frozenStopRef.current;

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <Map mapStyle={MAP_STYLE_URL} style={{ flex: 1, overflow: 'hidden' }} compass={false} logo={false} attribution={false}>
        <Camera initialViewState={initialViewState} {...cameraStop} />

        {/* A route's full path, drawn dashed so it reads as "the planned
            route" rather than a jeepney's actual driven trail below. */}
        <GeoJSONSource id="route-path" data={routeGeoJSON}>
          <Layer
            id="route-path-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': ROUTE_LINE_COLOR,
              'line-width': 5,
              'line-opacity': 0.9,
              'line-dasharray': [2, 1.4],
            }}
          />
        </GeoJSONSource>

        {/* The jeepney's driven trail, styled like a turn-by-turn navigation
            route: one solid, fully opaque ribbon with a darker outline under
            it, thickening as you zoom in. Deliberately NOT faded or
            semi-transparent — letting the map's roads and labels show
            through is what made it read as a thin scribble rather than a
            deliberate line. */}
        <GeoJSONSource id="jeepney-trails" data={trails}>
          {/* Casing: the darker outline that keeps the ribbon legible over
              any map color underneath it. Drawn first, so the fill sits
              on top of it and only its edges show. */}
          <Layer
            id="jeepney-trails-casing"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': TRAIL_CASING_COLOR,
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 12, 18, 17],
            }}
          />
          <Layer
            id="jeepney-trails-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': TRAIL_COLOR,
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 15, 8, 18, 12.5],
            }}
          />
        </GeoJSONSource>

        {markers.map((marker) => (
          <AnimatedMarker key={marker.id} marker={marker} onMarkerPress={onMarkerPress} />
        ))}
      </Map>
    </View>
  );
}
