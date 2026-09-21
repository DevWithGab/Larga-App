import { useEffect, useRef, useState } from 'react';

// Smoothly interpolates toward a new [lng, lat] fix instead of snapping to it,
// so a moving jeepney visibly glides between GPS updates rather than
// teleporting every time Firestore pushes a new location.
// `durationMs` is matched to the map camera's own recenter animation
// (JeepneyMap's Camera uses `duration: 600`) — the camera often recenters on
// this exact same coordinate (e.g. the driver's own live view following
// themselves), and if the marker glides slower than that, the camera jumps
// to the new spot while the icon is still crawling there, so the icon
// visibly lags behind / appears to drift away from your real position on
// every update. Keeping both on the same timescale means they arrive
// together instead of racing each other.
export function useAnimatedCoordinate(target, durationMs = 600) {
  const [displayed, setDisplayed] = useState(target ?? null);
  // Where the marker is actually being drawn right now, updated every frame.
  // A new fix arriving mid-glide has to resume from *this*, not from the
  // interrupted animation's start point — otherwise the marker snaps
  // backwards to where the last glide began before setting off again.
  const currentRef = useRef(target ?? null);
  // The last coordinate we were animating toward, kept separately so a
  // repeated fix (e.g. Firestore re-pushing the same location because the
  // driver changed their passenger count) is recognised as "no movement"
  // even if the previous glide never finished.
  const targetRef = useRef(target ?? null);
  const rafRef = useRef(null);

  const targetLng = target ? target[0] : null;
  const targetLat = target ? target[1] : null;

  useEffect(() => {
    if (targetLng == null || targetLat == null) return undefined;
    const nextTarget = [targetLng, targetLat];
    const from = currentRef.current;

    if (!from) {
      // First fix ever — nothing to glide from, just place it.
      currentRef.current = nextTarget;
      targetRef.current = nextTarget;
      setDisplayed(nextTarget);
      return undefined;
    }

    const previousTarget = targetRef.current;
    if (previousTarget && previousTarget[0] === nextTarget[0] && previousTarget[1] === nextTarget[1]) {
      return undefined;
    }
    targetRef.current = nextTarget;

    const startFrom = from;
    const startTime = Date.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = () => {
      const t = Math.min(1, (Date.now() - startTime) / durationMs);
      const next = [
        startFrom[0] + (nextTarget[0] - startFrom[0]) * t,
        startFrom[1] + (nextTarget[1] - startFrom[1]) * t,
      ];
      currentRef.current = next;
      setDisplayed(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetLng, targetLat, durationMs]);

  return displayed;
}
