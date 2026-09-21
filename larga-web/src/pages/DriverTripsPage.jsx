import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Clock, Gauge, LogOut, Route as RouteIcon, Smartphone } from 'lucide-react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { getRoute, routeLabel } from '../constants/routes';
import {
  formatClock,
  formatDayHeading,
  formatDuration,
  groupTripsByDay,
  startOfDay,
  startOfWeek,
  summariseTrips,
  toSortedTrips,
  tripSeconds,
} from '../utils/trips';

const TABS = ['Today', 'This week', 'All'];

function SummaryStat({ Icon, value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <Icon size={18} color="#f57c1f" />
      <p className="font-heading mt-1 truncate text-2xl text-black">{value}</p>
      <p className="font-regular mt-0.5 text-center text-xs text-gray-500">{label}</p>
    </div>
  );
}


function TripRow({ trip }) {
  const route = getRoute(trip.routeId);
  const seconds = tripSeconds(trip);
  const startedAt = seconds != null ? new Date(trip.endedAt.getTime() - seconds * 1000) : null;

  return (
    <li className="flex items-center border-b border-gray-100 py-3">
      <span className="font-accent mr-3 shrink-0 rounded-xl bg-primary px-2.5 py-1.5 text-xs text-white">
        {route?.code ?? '--'}
      </span>
      <div className="min-w-0 flex-1 pr-2">
        <p className="font-accent truncate text-sm text-black">
          {route ? routeLabel(route, trip.direction) : 'Route not set'}
        </p>
        <p className="font-regular mt-0.5 truncate text-xs text-gray-500">
          {startedAt
            ? `${formatClock(startedAt)} - ${formatClock(trip.endedAt)}`
            : formatClock(trip.endedAt)}

          {trip.passengerCount != null ? ` · ${trip.passengerCount} aboard at end` : ''}
        </p>
      </div>
      <span className="font-heading shrink-0 text-sm text-black">{formatDuration(seconds)}</span>
    </li>
  );
}

export default function DriverTripsPage() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Today');
  const [trips, setTrips] = useState(null); // null while still loading

  useEffect(() => {
    if (!user) return undefined;
    const tripsQuery = query(collection(db, 'trips'), where('driverId', '==', user.uid));
    return onSnapshot(
      tripsQuery,
      (snapshot) => setTrips(toSortedTrips(snapshot.docs)),
      (error) => {
        console.warn('Failed to load trip reports:', error.message);
        setTrips([]);
      }
    );
  }, [user]);

  const visibleTrips = useMemo(() => {
    if (!trips) return [];
    if (tab === 'All') return trips;
    const cutoff = tab === 'Today' ? startOfDay(new Date()) : startOfWeek();
    return trips.filter((trip) => trip.endedAt >= cutoff);
  }, [trips, tab]);

  const summary = useMemo(() => summariseTrips(visibleTrips), [visibleTrips]);
  const dayGroups = useMemo(() => groupTripsByDay(visibleTrips), [visibleTrips]);

  const handleLogOut = async () => {
    await logOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-2xl px-5 pt-4 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <Logo variant="light" width={120} />
          <button
            type="button"
            onClick={handleLogOut}
            className="font-accent flex items-center gap-2 rounded-full border border-gray-200 px-4
                       py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>

        <h1 className="font-heading mb-1 text-3xl text-black">Trip reports</h1>
        <p className="font-regular mb-4 text-base text-gray-500">
          {profile?.name ? `${profile.name} — every` : 'Every'} trip you have finished, newest first.
        </p>

        <div className="mb-5 flex gap-2">
          {TABS.map((label) => {
            const isActive = label === tab;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={`font-accent rounded-full border px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex rounded-3xl border border-gray-200 px-4 py-5">
          <SummaryStat Icon={RouteIcon} value={summary.count} label="Trips" />
          <SummaryStat
            Icon={Clock}
            value={formatDuration(summary.totalSeconds)}
            label="Time driving"
          />
          <SummaryStat
            Icon={Gauge}
            value={summary.count ? formatDuration(summary.avgSeconds) : '--'}
            label="Average trip"
          />
        </div>

        {trips === null ? (
          <p className="font-regular py-10 text-center text-sm text-gray-500">Loading trips…</p>
        ) : dayGroups.length === 0 ? (
          <div className="rounded-3xl bg-gray-50 px-5 py-10 text-center">
            <p className="font-heading text-lg text-black">No trips yet</p>
            <p className="font-regular mt-1 text-sm text-gray-500">
              {tab === 'All'
                ? 'Trips appear here once you end one in the mobile app.'
                : `No trips finished ${tab === 'Today' ? 'today' : 'this week'}.`}
            </p>
          </div>
        ) : (
          dayGroups.map((group) => (
            <section key={group.key} className="mb-5">
              <h2 className="font-accent mb-1 text-sm text-gray-500">
                {formatDayHeading(group.date)}
              </h2>
              <ul>
                {group.trips.map((trip) => (
                  <TripRow key={trip.id} trip={trip} />
                ))}
              </ul>
            </section>
          ))
        )}

        <div className="mt-8 flex items-start gap-3 rounded-3xl bg-orange-50 p-5">
          <Smartphone size={20} color="#f57c1f" className="mt-0.5 shrink-0" />
          <p className="font-regular text-sm leading-6 text-gray-700">
            This is the web version of Larga — it shows trips you've already finished. Starting a
            trip and sharing your location still happen in the mobile app, because a browser tab
            stops reporting position once your phone locks.
          </p>
        </div>
      </div>
    </div>
  );
}
