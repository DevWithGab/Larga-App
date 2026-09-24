import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveCompletedTrip } from '../../services/driverSession';
import { toSortedTrips } from '../../utils/trips';
import { useAuth } from '../../contexts/AuthContext';
import JeepneyMap from '../../components/JeepneyMap';
import RoutePickerModal from '../../components/RoutePickerModal';
import { getRoute, getRouteEndpoints, routeLabel } from '../../constants/routes';
import { distanceMeters, formatDistance } from '../../utils/geo';

const DEFAULT_CAPACITY = 16; // used only if the driver's profile has no seatCapacity


const MAX_ACCURACY_METERS = 50;


const MIN_MOVE_METERS_FOR_UPDATE = 10;


const HEARTBEAT_MS = 30 * 1000;

function isTrustworthyFix(position) {
  const accuracy = position?.coords?.accuracy;
  // Some devices report null accuracy rather than a number — take those
  // rather than stall forever waiting for a figure that never arrives.
  return accuracy == null || accuracy <= MAX_ACCURACY_METERS;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function StatCard({ icon, label, value }) {
  return (
    <View className="flex-1 border border-gray-200 rounded-2xl py-5 items-center">
      <Ionicons name={icon} size={18} color="#f57c1f" style={{ marginBottom: 6 }} />
      <Text className="font-heading text-2xl text-black mb-1">{value}</Text>
      <Text className="font-regular text-sm text-gray-500">{label}</Text>
    </View>
  );
}

// Compact stat for the live sheet — same idea as StatCard but sized to sit
// three-across inside the bottom sheet without pushing the actions offscreen.
function TripStat({ icon, label, value, danger = false }) {
  return (
    <View className={`flex-1 rounded-2xl py-3 items-center ${danger ? 'bg-red-50' : 'bg-gray-50'}`}>
      <Ionicons name={icon} size={16} color={danger ? '#dc2626' : '#f57c1f'} />
      <Text className={`font-heading text-lg mt-1 ${danger ? 'text-red-600' : 'text-black'}`} numberOfLines={1}>
        {value}
      </Text>
      <Text className="font-regular text-xs text-gray-500 mt-0.5">{label}</Text>
    </View>
  );
}

export default function DriverHomeScreen() {
  const { user, profile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const savingTripRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  // Starts empty, not at some placeholder count — whatever this says is
  // broadcast to commuters as real seat availability the moment the driver
  // goes online, so it has to start from the truth and be counted up.
  const [passengerCount, setPassengerCount] = useState(0);
  // A break keeps the driver in trip view (route + timer intact) but stops
  // broadcasting, so commuters aren't shown a jeepney that isn't moving.
  const [onBreak, setOnBreak] = useState(false);
  const [routeId, setRouteId] = useState(null);
  const [direction, setDirection] = useState('forward');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [todayStats, setTodayStats] = useState({ trips: 0, hours: 0, passengers: 0 });
  const watcherRef = useRef(null);
  const timerRef = useRef(null);
  const hasFixRef = useRef(false); // has the live watch delivered a usable fix yet?
  const route = getRoute(routeId);
  const capacity = profile?.seatCapacity ?? DEFAULT_CAPACITY;
  const isFull = passengerCount >= capacity;
  const seatsLeft = Math.max(0, capacity - passengerCount);
  const occupancyRatio = capacity > 0 ? Math.min(1, passengerCount / capacity) : 0;

  // Routes here are just two endpoint towns (a jeepney drives back and
  // forth, no fixed intermediate stops) — so "progress" is distance to
  // whichever endpoint is the destination for the current direction.
  const endpoints = getRouteEndpoints(route);
  const destinationTown = endpoints && (direction === 'reverse' ? route.towns[0] : route.towns[1]);
  const destinationCoord = endpoints && (direction === 'reverse' ? endpoints[0] : endpoints[1]);
  const distanceToDestination =
    driverLocation && destinationCoord
      ? distanceMeters(
          { latitude: driverLocation[1], longitude: driverLocation[0] },
          { latitude: destinationCoord[1], longitude: destinationCoord[0] }
        )
      : null;

  // Bottom sheet for the live view: starts expanded (route bar + occupancy
  // + actions all visible) and can be dragged down by its handle to collapse
  // to just the route bar, so the map underneath isn't permanently covered.
  // Heights are measured via onLayout rather than guessed, so the collapse
  // point always matches the real rendered content regardless of font size
  // or screen width.
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetHeightRef = useRef(0);
  const peekHeightRef = useRef(0);
  const dragStartRef = useRef(0);

  const collapsedOffset = () => Math.max(0, sheetHeightRef.current - peekHeightRef.current);

  const snapSheetTo = (expanded) => {
    Animated.spring(sheetTranslateY, {
      toValue: expanded ? 0 : collapsedOffset(),
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation((value) => {
          dragStartRef.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(collapsedOffset(), Math.max(0, dragStartRef.current + gesture.dy));
        sheetTranslateY.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const current = dragStartRef.current + gesture.dy;
        const flungOpen = gesture.vy < -0.3;
        const flungShut = gesture.vy > 0.3;
        const expand = flungOpen || (!flungShut && current < collapsedOffset() / 2);
        snapSheetTo(expand);
      },
    })
  ).current;

  useEffect(() => {
    return () => {
      // Don't let a background GPS watch or timer outlive this screen.
      if (watcherRef.current) watcherRef.current.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Rehydrate from Firestore on mount: if this driver was online before
  // (e.g. they logged out mid-trip instead of tapping "End trip"), the
  // toggle should come back on and GPS broadcasting should resume — going
  // online is a driver action, logging out isn't the same as ending a trip.
  useEffect(() => {
    if (!user) {
      setCheckingStatus(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'drivers', user.uid));
        const data = snap.exists() ? snap.data() : null;
        if (cancelled || !data?.isOnline) return;

        setRouteId(data.routeId ?? null);
        setDirection(data.direction ?? 'forward');
        if (data.location) setDriverLocation([data.location.longitude, data.location.latitude]);
        if (typeof data.passengerCount === 'number') setPassengerCount(data.passengerCount);
        setElapsed(
          data.onlineSince ? Math.max(0, Math.floor((Date.now() - data.onlineSince.toMillis()) / 1000)) : 0
        );

        // Unlike goOnline, this path doesn't already have a fresh user tap
        // to hang a permission prompt off of — but it still shouldn't claim
        // "you're live" if GPS didn't actually start (e.g. permission was
        // revoked since the last time this driver went online).
        const started = await startLocationWatch();
        if (cancelled || !started) return;
        setIsOnline(true);
        startElapsedTimer();
      } catch (error) {
        console.warn('Failed to restore driver status:', error.message);
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Real dashboard stats: aggregated live from this driver's own completed
  // trips today (written by goOffline below), not fake placeholder numbers.
  useEffect(() => {
    if (!user) return;
    const tripsQuery = query(
      collection(db, 'trips'),
      where('driverId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const trips = toSortedTrips(snapshot.docs).filter((trip) => trip.endedAt >= startOfToday());
        // Prefer durationSeconds; fall back to the whole minutes stored on
        // trips recorded before that field existed.
        const totalSeconds = trips.reduce(
          (sum, trip) => sum + (trip.durationSeconds ?? (trip.durationMinutes ?? 0) * 60),
          0
        );
        const totalPassengers = trips.reduce((sum, trip) => sum + (trip.passengerCount ?? 0), 0);
        setTodayStats({ trips: trips.length, hours: totalSeconds / 3600, passengers: totalPassengers });
      },
      (error) => console.warn('Failed to load today\'s trip stats:', error.message)
    );
    return unsubscribe;
  }, [user]);

  const updateDriverStatus = async (data, requireSuccess = false) => {
    try {
      if (!user) throw new Error('Please sign in again.');
      await setDoc(doc(db, 'drivers', user.uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.warn('Failed to update driver status:', error.message);
      if (requireSuccess) throw error;
    }
  };

  // Only while genuinely broadcasting: a break already writes isOnline:false,
  // and a jeepney on a break should expire off commuter maps like any other.
  useEffect(() => {
    if (!user || !isOnline || onBreak) return undefined;
    const id = setInterval(() => updateDriverStatus({}), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [user, isOnline, onBreak]);

  // Same idempotency issue the GPS watcher had: this gets (re)started from
  // two places (goOnline, and the rehydration effect resuming an
  // already-online trip), and without clearing a prior interval first, two
  // of these stacking up would tick `elapsed` twice as fast as real time —
  // and since today's trip stats are computed straight from `elapsed`, that
  // would corrupt them too.
  const startElapsedTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
  };

  // Starts (or resumes) broadcasting this driver's GPS position. Shared by
  // goOnline (a fresh trip) and the rehydration effect above (resuming a
  // trip that was already online in Firestore).
  const startLocationWatch = async () => {
    // If a watcher is already running (e.g. this got called twice — once on
    // app start to resume an already-online trip, then again from a stray
    // re-render), stop it first. Otherwise the old one never gets cleaned up
    // and keeps firing in the background alongside the new one, so the map
    // ends up flip-flopping between two competing GPS feeds.
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    hasFixRef.current = false; // fresh watch — the seed fix is allowed again

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location needed',
        'Larga needs your location to share your jeepney\'s position with passengers.'
      );
      return false;
    }

    watcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: MIN_MOVE_METERS_FOR_UPDATE,
      },
      (position) => {
        // Drop low-confidence fixes instead of broadcasting them — a single
        // bad one puts a visible spike in the trail and yanks the marker
        // (and every commuter's view of this jeepney) off the road.
        if (!isTrustworthyFix(position)) return;
        hasFixRef.current = true;
        setDriverLocation([position.coords.longitude, position.coords.latitude]);
        updateDriverStatus({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          // Tracked separately from updatedAt, which the heartbeat also
          // touches — commuters are shown when the jeepney last MOVED, not
          // when its phone last said hello.
          locationUpdatedAt: serverTimestamp(),
        });
      }
    );

    // Seed the map with a fix immediately instead of waiting for the first
    // watchPositionAsync callback (which only fires on movement/interval).
    // Pass the same High accuracy as the watch: the default for an empty
    // options object is Balanced — only ~100m — which would put the trip's
    // very first trail point, and its heading baseline, up to a block from
    // where the jeepney really is.
    const initialFix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    // And don't clobber a fix the watch already delivered while this was
    // resolving — that one is at least as fresh and came from the same
    // stream, so overwriting it would move the jeepney backwards.
    if (!hasFixRef.current && isTrustworthyFix(initialFix)) {
      hasFixRef.current = true;
      setDriverLocation([initialFix.coords.longitude, initialFix.coords.latitude]);
      await updateDriverStatus({
        location: {
          latitude: initialFix.coords.latitude,
          longitude: initialFix.coords.longitude,
        },
        locationUpdatedAt: serverTimestamp(),
      }, true);
    }
    if (!hasFixRef.current) {
      throw new Error('Waiting for an accurate GPS location. Move to an open area and try again.');
    }
    return true;
  };

  const reportBroadcastFailure = (error) => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    Alert.alert('Unable to go online', error.code === 'permission-denied'
      ? 'Your account cannot share its location right now. Please contact support.'
      : error.message);
  };

  const goOnline = async () => {
    if (!routeId) {
      Alert.alert('Pick a route first', "Choose the route you're driving before going online.");
      setPickerVisible(true);
      return;
    }

    try {
      const started = await startLocationWatch();
      if (!started) return;

      await updateDriverStatus({
        isOnline: true,
        jeepneyNumber: profile?.jeepneyNumber ?? null,
        routeId,
        direction,
        passengerCount,
        seatCapacity: capacity,
        onlineSince: serverTimestamp(),
      }, true);
      setIsOnline(true);
      setElapsed(0);
      startElapsedTimer();
    } catch (error) {
      reportBroadcastFailure(error);
    }
  };

  const goOffline = async () => {
    if (savingTripRef.current) return;
    savingTripRef.current = true;
    setSavingTrip(true);
    try {
      await saveCompletedTrip(user?.uid, {
        routeId, direction, jeepneyNumber: profile?.jeepneyNumber,
        passengerCount, durationSeconds: elapsed,
      });
      watcherRef.current?.remove();
      watcherRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsOnline(false);
      setOnBreak(false);
      setDriverLocation(null);
      setPassengerCount(0);
    } catch (error) {
      Alert.alert('Trip could not be saved', error.code === 'permission-denied'
        ? 'Trip reports are blocked by the database permissions. Your trip has been kept open. Please contact support and try again.'
        : 'Your trip has been kept open. Check your connection, then tap End trip again.');
    } finally {
      savingTripRef.current = false;
      setSavingTrip(false);
    }
  };

  const toggleOnline = (value) => (value ? goOnline() : goOffline());

  // A break isn't the end of a trip: the route, passenger count and elapsed
  // time all stay put. GPS stops and commuters stop seeing this jeepney
  // (better than showing them one parked for 20 minutes), and the trip clock
  // pauses so break time doesn't get counted as driving time in today's
  // stats. Not persisted to Firestore — closing the app during a break ends
  // up in the normal offline state, same as any other interrupted trip.
  const takeBreak = () => {
    if (savingTripRef.current) return;
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    updateDriverStatus({ isOnline: false });
    setOnBreak(true);
  };

  const resumeTrip = async () => {
    if (savingTripRef.current) return;
    try {
      const started = await startLocationWatch();
      if (!started) return;
      // Rewind onlineSince past the time already driven so it keeps meaning
      // "when this trip's clock started", with the break excluded. Anything
      // that later rebuilds the trip length from the document — the logout
      // path, rehydrating on the next launch — then gets driving time rather
      // than wall-clock time that silently counted the break.
      await updateDriverStatus({
        isOnline: true,
        onlineSince: Timestamp.fromMillis(Date.now() - elapsed * 1000),
      }, true);
      setOnBreak(false);
      startElapsedTimer();
    } catch (error) {
      reportBroadcastFailure(error);
    }
  };

  const adjustPassengers = (delta) => {
    if (savingTripRef.current) return;
    const next = Math.min(capacity, Math.max(0, passengerCount + delta));
    // Already at 0 or at capacity — nothing changed, so don't re-broadcast the
    // same number to Firestore on every further tap.
    if (next === passengerCount) return;
    // The Firestore write stays OUT of the setState updater: React treats
    // updaters as pure and may run them more than once, which would fire the
    // write twice per tap.
    setPassengerCount(next);
    updateDriverStatus({ passengerCount: next });
  };

  const firstName = profile?.name?.split(' ')[0];
  const greetingName = firstName ? `Mang ${firstName}` : 'Driver';

  if (checkingStatus) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#f57c1f" />
      </SafeAreaView>
    );
  }

  if (isOnline) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        {/* Status header — green while broadcasting, amber on a break, so
            the driver can tell at a glance whether passengers can actually
            see them right now. */}
        <View
          className={`px-5 pt-5 pb-5 flex-row items-center justify-between ${
            onBreak ? 'bg-amber-500' : 'bg-green-600'
          }`}
        >
          <View className="flex-row items-center flex-1 pr-3">
            <Ionicons
              name={onBreak ? 'pause-circle' : 'radio-button-on'}
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text className="font-accent text-white text-lg flex-shrink" numberOfLines={1}>
              {onBreak ? 'On break · Hidden from passengers' : 'Live · Passengers can see you'}
            </Text>
          </View>
          <Text className="font-heading text-white text-2xl">{formatElapsed(elapsed)}</Text>
        </View>

        {/* Map fills all remaining space behind the sheet — it no longer
            shares a scroll with the info card, so it never gets squeezed
            or scrolled away, and the sheet can float on top of it instead. */}
        <View className="flex-1">
          <JeepneyMap
            style={{ flex: 1 }}
            markers={
              driverLocation
                ? [{ id: user?.uid ?? 'me', coordinate: driverLocation, variant: 'jeepney', selected: true, full: isFull }]
                : []
            }
            center={driverLocation ?? undefined}
            zoom={15}
          />

          <Animated.View
            onLayout={(e) => {
              sheetHeightRef.current = e.nativeEvent.layout.height;
            }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateY: sheetTranslateY }],
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: -4 },
              elevation: 16,
            }}
          >
            {/* Drag handle + route info bar — always visible, even
                collapsed, and the only part that responds to the drag. */}
            <View
              {...sheetPanResponder.panHandlers}
              onLayout={(e) => {
                peekHeightRef.current = e.nativeEvent.layout.height;
              }}
            >
              <View className="items-center pt-3 pb-2">
                <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#d1d5db' }} />
              </View>

              <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
                <View className="flex-row items-center flex-shrink" style={{ gap: 8 }}>
                  <View className="bg-primary rounded-full px-3 py-1">
                    <Text className="font-accent text-sm text-white">{route?.code ?? '--'}</Text>
                  </View>
                  <Text className="font-accent text-xl text-black flex-shrink" numberOfLines={1}>
                    {routeLabel(route, direction)}
                  </Text>
                </View>
                <Text className="font-regular text-base text-gray-500">
                  {distanceToDestination == null
                    ? 'Locating…'
                    : formatDistance(distanceToDestination, `to ${destinationTown}`)}
                </Text>
              </View>
            </View>

            <View className="px-5 pt-4 pb-8">
              {/* At-a-glance trip numbers, all real: live GPS distance to the
                  destination town, remaining seats from the counter below,
                  and this route's actual fare. */}
              <View className="flex-row mb-4" style={{ gap: 8 }}>
                <TripStat
                  icon="navigate-outline"
                  label={destinationTown ? `To ${destinationTown}` : 'To destination'}
                  value={
                    distanceToDestination == null
                      ? '—'
                      : distanceToDestination < 1000
                      ? `${Math.round(distanceToDestination / 10) * 10} m`
                      : `${(distanceToDestination / 1000).toFixed(1)} km`
                  }
                />
                <TripStat
                  icon={isFull ? 'people' : 'people-outline'}
                  label="Seats left"
                  value={isFull ? 'Full' : seatsLeft}
                  danger={isFull}
                />
                <TripStat
                  icon="cash-outline"
                  label="Fare"
                  value={route?.fare != null ? `₱${route.fare}` : '—'}
                />
              </View>

              {/* Occupancy */}
              <View
                className={`border rounded-2xl px-5 py-5 mb-4 ${
                  isFull ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <View className="flex-row items-center justify-center mb-3" style={{ gap: 8 }}>
                  <Text className="font-label text-lg text-gray-500">Onboard now</Text>
                  {isFull && (
                    <View className="bg-red-600 rounded-full px-3 py-0.5">
                      <Text className="font-accent text-xs text-white">FULL</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center justify-center gap-6">
                  <TouchableOpacity
                    className="w-16 h-16 rounded-full border-2 border-gray-300 items-center justify-center"
                    onPress={() => adjustPassengers(-1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove" size={30} color="#000" />
                  </TouchableOpacity>
                  <Text className={`font-heading text-5xl ${isFull ? 'text-red-600' : 'text-black'}`}>
                    {passengerCount}/{capacity}
                  </Text>
                  <TouchableOpacity
                    className={`w-16 h-16 rounded-full items-center justify-center ${
                      isFull ? 'bg-gray-300' : 'bg-primary'
                    }`}
                    onPress={() => adjustPassengers(1)}
                    activeOpacity={0.8}
                    disabled={isFull}
                  >
                    <Ionicons name="add" size={30} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* How full the jeepney is, at a glance — the same number as
                    above, read without counting. */}
                <View className="h-2 rounded-full bg-gray-200 mt-5 overflow-hidden">
                  <View
                    className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${Math.round(occupancyRatio * 100)}%` }}
                  />
                </View>
              </View>

              {/* Actions */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center py-5 rounded-full ${
                    onBreak ? 'bg-primary' : 'border-2 border-gray-200'
                  }`}
                  disabled={savingTrip}
                  onPress={onBreak ? resumeTrip : takeBreak}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={onBreak ? 'play' : 'pause'}
                    size={18}
                    color={onBreak ? '#fff' : '#000'}
                    style={{ marginRight: 6 }}
                  />
                  <Text className={`font-accent text-lg ${onBreak ? 'text-white' : 'text-black'}`}>
                    {onBreak ? 'Resume' : 'Take a break'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-black py-5 rounded-full items-center"
                  disabled={savingTrip}
                  accessibilityState={{ disabled: savingTrip, busy: savingTrip }}
                  onPress={goOffline}
                  activeOpacity={0.9}
                >
                  <Text className="font-accent text-white text-lg">{savingTrip ? 'Saving trip...' : 'End trip'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Greeting */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="font-regular text-base text-gray-500">{getGreeting()}</Text>
            <Text className="font-heading text-4xl text-black">{greetingName}</Text>
          </View>
          <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons name="notifications-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Online/offline toggle card */}
        <View className="bg-black rounded-3xl px-5 py-6 flex-row items-center justify-between mb-5">
          <View className="flex-1 pr-3">
            <Text className="font-heading text-3xl text-white mb-1">Offline</Text>
            <Text className="font-regular text-base text-gray-400">Passengers can't see you yet</Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#3f3f3f', true: '#f57c1f' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 1.35 }, { scaleY: 1.35 }] }}
          />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-6">
          <StatCard icon="repeat-outline" label="Trips today" value={todayStats.trips} />
          <StatCard icon="time-outline" label="Hours today" value={todayStats.hours.toFixed(1)} />
          {/* Not "Passengers": each trip stores the count as it read the moment
              End trip was tapped, so this is the sum of those end-of-trip
              snapshots — not how many people rode today. Same wording as the
              Reports tab so the two agree. */}
          <StatCard icon="people-outline" label="Aboard at end" value={todayStats.passengers} />
        </View>

        {/* Current trip */}
        <Text className="font-heading text-xl text-black mb-4">Current trip</Text>
        {route ? (
          <TouchableOpacity
            className="border-2 border-primary/40 rounded-2xl p-5 mb-4 bg-white"
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center mb-2">
              <View className="bg-primary rounded-full px-3 py-1 mr-2">
                <Text className="font-accent text-sm text-white">{route.code}</Text>
              </View>
              <Text className="font-accent text-xl text-black flex-shrink" numberOfLines={1}>
                {routeLabel(route, direction)}
              </Text>
            </View>

            {/* This route's real fare, alongside the plate — the two things a
                driver double-checks before pulling out. */}
            <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
              {route.fare != null && (
                <View className="flex-row items-center bg-orange-50 rounded-full px-3 py-1">
                  <Ionicons name="cash-outline" size={14} color="#f57c1f" />
                  <Text className="font-accent text-sm text-primary ml-1.5">₱{route.fare}</Text>
                </View>
              )}
              <Text className="font-regular text-base text-gray-500">
                {profile?.jeepneyNumber ?? '—'} · Tap to change
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 mb-4 items-center"
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="map-outline" size={28} color="#f57c1f" style={{ marginBottom: 8 }} />
            <Text className="font-accent text-lg text-primary">Select your route</Text>
            <Text className="font-regular text-sm text-gray-500 mt-1">Required before you can go online</Text>
          </TouchableOpacity>
        )}

        {/* GPS state + CTA */}
        <View className="border border-primary/30 bg-orange-50 rounded-2xl p-5 items-center">
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={18} color="#6b7280" />
            <Text className="font-label text-lg text-gray-500 ml-2">
              GPS is off · starts when you go online
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary py-5 rounded-full items-center w-full"
            activeOpacity={0.9}
            onPress={goOnline}
          >
            <Text className="font-accent text-white text-2xl">Go online</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RoutePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(id, dir) => {
          setRouteId(id);
          setDirection(dir);
          setPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
