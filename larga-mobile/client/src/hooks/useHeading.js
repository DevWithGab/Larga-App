import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { bearingDegrees, distanceMeters } from '../utils/geo';

// Below this, don't trust the bearing between two fixes — GPS noise while
// nearly stationary (e.g. stuck in traffic, or parked) would compute a
// "direction" from essentially random jitter and make the icon spin in
// place for no real movement.
const MIN_MOVEMENT_METERS = 3;

// Tracks the compass bearing of travel between consecutive [lng, lat] fixes
// and returns an Animated.Value (in degrees, unbounded — not clamped to
// 0-360) suitable for a `rotate` transform, so a jeepney icon can visibly
// turn to face the way it's actually driving.
//
// Unbounded on purpose: if we snapped each new heading straight to its
// 0-360 value, turning from e.g. 350° to 10° would animate as a near-full
// spin backwards through 180° instead of a quick 20° turn. Accumulating an
// unbounded total and always stepping by the *shortest* delta keeps every
// turn visually correct no matter how many times it wraps around north.
export function useHeading(target) {
  const rotation = useRef(new Animated.Value(0)).current;
  const lastPointRef = useRef(null); // last { latitude, longitude } used for a heading fix
  const lastHeadingRef = useRef(0); // last committed 0-360 heading
  const totalRef = useRef(0); // unbounded degrees actually fed to `rotation`
  const hasHeadingRef = useRef(false); // has a real direction been established yet?

  const targetLng = target ? target[0] : null;
  const targetLat = target ? target[1] : null;

  useEffect(() => {
    if (targetLng == null || targetLat == null) return;
    const point = { latitude: targetLat, longitude: targetLng };
    const last = lastPointRef.current;

    if (last) {
      const moved = distanceMeters(last, point);
      if (moved != null && moved >= MIN_MOVEMENT_METERS) {
        const heading = bearingDegrees(last, point);
        lastPointRef.current = point;

        if (!hasHeadingRef.current) {
          // First real direction we've ever established for this jeepney.
          // The icon's 0° default is just "artwork points up", not a claim
          // that it was heading north — animating a turn away from north
          // would show a spin that never happened. Snap instead.
          hasHeadingRef.current = true;
          totalRef.current = heading;
          lastHeadingRef.current = heading;
          rotation.setValue(heading);
          return;
        }

        let delta = heading - lastHeadingRef.current;
        delta = ((delta + 180) % 360 + 360) % 360 - 180; // shortest turn, -180..180
        totalRef.current += delta;
        lastHeadingRef.current = heading;

        Animated.timing(rotation, {
          toValue: totalRef.current,
          duration: 600, // matches the marker's own glide/camera timing
          useNativeDriver: true,
        }).start();
      }
      // Movement too small to trust — keep the last point AND last heading
      // as-is, so tiny jitter doesn't reset the baseline either.
    } else {
      lastPointRef.current = point;
    }
  }, [targetLng, targetLat]);

  return rotation;
}
