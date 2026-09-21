import { useCallback, useEffect, useRef, useState } from 'react';

// Drag-to-resize for the bottom sheet on the map, with the three stops every
// map app has trained people to expect: a peek showing just the header, half
// and half, and nearly full. Free dragging in between, snapping to the
// nearest stop on release, and a tap cycles through them for anyone who
// doesn't think to drag.
//
// Heights are fractions of the map area rather than of the viewport, because
// the sheet lives inside the map pane — below the search bar and filter pills,
// above the tab bar — so viewport fractions would overshoot on a short screen.
const SNAPS = [0.16, 0.5, 0.86];
const DEFAULT_SNAP = 1;
const STORAGE_KEY = 'larga:nearby-sheet-snap';
// Below this, a pointer gesture is a tap rather than a drag — fingers wobble.
const TAP_SLOP_PX = 4;

function readStoredSnap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Checked before converting: getItem returns null when nothing is stored,
    // and Number(null) is 0 — a valid index, so a first-time visitor would
    // silently get the smallest sheet instead of the default.
    if (raw === null) return DEFAULT_SNAP;
    const stored = Number(raw);
    return Number.isInteger(stored) && stored >= 0 && stored < SNAPS.length ? stored : DEFAULT_SNAP;
  } catch {
    // Private mode, blocked site data — the sheet still works, it just won't
    // remember where you left it.
    return DEFAULT_SNAP;
  }
}

function storeSnap(index) {
  try {
    localStorage.setItem(STORAGE_KEY, String(index));
  } catch {
    /* not worth telling anyone about */
  }
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function useResizableSheet() {
  // Measured rather than assumed: the map pane's height changes with the
  // window, with the address bar on mobile, and when the filter pills wrap.
  const areaRef = useRef(null);
  const [areaHeight, setAreaHeight] = useState(0);
  const [snapIndex, setSnapIndex] = useState(readStoredSnap);
  const [dragHeight, setDragHeight] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const element = areaRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setAreaHeight(entry.contentRect.height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = dragHeight ?? Math.round(areaHeight * SNAPS[snapIndex]);

  const goToSnap = useCallback((index) => {
    const next = clamp(index, 0, SNAPS.length - 1);
    setSnapIndex(next);
    storeSnap(next);
  }, []);

  const onPointerDown = useCallback(
    (event) => {
      dragRef.current = { y: event.clientY, height, moved: false };
      // Capture keeps the gesture alive when the finger slides off the handle.
      // It throws if the pointer is already gone, which must not take the drag
      // down with it — the move/up handlers work without capture either way.
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        /* no capture; dragging still works */
      }
    },
    [height]
  );

  const onPointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || !areaHeight) return;
      // Dragging up makes the sheet taller, so the delta is inverted.
      const delta = drag.y - event.clientY;
      if (Math.abs(delta) > TAP_SLOP_PX) drag.moved = true;
      const next = clamp(
        drag.height + delta,
        areaHeight * SNAPS[0],
        areaHeight * SNAPS[SNAPS.length - 1]
      );
      // Kept on the ref as well as in state. React batches state updates, so a
      // fast flick can deliver the last pointermove and the pointerup in one
      // batch — and then the pointerup handler's `dragHeight` is still the
      // value from before the drag, and the sheet snaps back to where it
      // started. The ref is current the instant it's written.
      drag.currentHeight = next;
      setDragHeight(next);
    },
    [areaHeight]
  );

  const endDrag = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      } catch {
        /* never captured, or the pointer is already gone */
      }

      if (!drag.moved) {
        // A tap: cycle to the next stop, wrapping back to the peek.
        goToSnap((snapIndex + 1) % SNAPS.length);
      } else if (areaHeight) {
        const fraction = (drag.currentHeight ?? drag.height) / areaHeight;
        const nearest = SNAPS.reduce(
          (best, snap, index) =>
            Math.abs(snap - fraction) < Math.abs(SNAPS[best] - fraction) ? index : best,
          0
        );
        goToSnap(nearest);
      }
      setDragHeight(null);
    },
    [areaHeight, goToSnap, snapIndex]
  );

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        goToSnap(snapIndex + 1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        goToSnap(snapIndex - 1);
      } else if (event.key === 'Enter' || event.key === ' ') {
        // Space would scroll the pane out from under the sheet.
        event.preventDefault();
        goToSnap((snapIndex + 1) % SNAPS.length);
      }
    },
    [goToSnap, snapIndex]
  );

  return {
    areaRef,
    // Derived from state, not from dragRef: a ref change wouldn't re-render,
    // and this drives whether the height transition is suppressed mid-drag.
    isDragging: dragHeight !== null,
    // A custom property, not an inline `height`: inline styles outrank classes,
    // which would defeat the `md:h-auto` that hands the desktop side panel back
    // to its own top/bottom layout. As a variable, the classes stay in charge.
    // The percentage covers the first paint, before the area has been measured.
    sheetStyle: { '--sheet-h': areaHeight ? `${height}px` : '50%' },
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown,
      'aria-label': `Resize the nearby jeepneys list (currently ${
        ['small', 'medium', 'large'][snapIndex]
      }). Drag, tap, or use the arrow keys.`,
    },
    snapIndex,
    snapCount: SNAPS.length,
  };
}
