import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bookmark, BusFront, MapPin, Route, Search } from 'lucide-react';
import { useSavedRoutes } from '../hooks/useSavedRoutes';
import { savedRouteError } from '../utils/savedRoutes';
import { useOnlineDrivers } from '../hooks/useOnlineDrivers';
import { useMyLocation } from '../hooks/useMyLocation';
import RouteCard from '../components/RouteCard';
import { ROUTES } from '../constants/routes';
import { distanceMeters, estimateEtaMinutes } from '../utils/geo';

// Web port of the mobile commuter RoutesScreen. Saved routes are Firestore
// documents keyed `${uid}_${routeId}`, exactly as the phone writes them, so
// bookmarking here shows up there.
export default function RoutesPage() {
  const saved = useSavedRoutes();
  const [saveError, setSaveError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { drivers: liveDrivers, error: driverError } = useOnlineDrivers();
  const { coordinate: myLocation } = useMyLocation();
  const savedRouteIds = saved.routes.map((item) => item.routeId);

  const toggleSaved = async (routeId) => {
    setSaveError('');
    try {
      const existing = saved.routes.find((item) => item.routeId === routeId);
      if (existing) await saved.remove(existing);
      else await saved.create({ routeId });
    } catch (error) { setSaveError(savedRouteError(error)); }
  };


  const stats = useMemo(() => {
    const byRoute = {};
    ROUTES.forEach((route) => {
      const drivers = liveDrivers.filter((driver) => driver.routeId === route.id);
      let nearestEta = null;
      if (myLocation && drivers.length > 0) {
        const distances = drivers
          .map((driver) =>
            distanceMeters({ latitude: myLocation[1], longitude: myLocation[0] }, driver.location)
          )
          .filter((meters) => meters != null);
        if (distances.length > 0) nearestEta = estimateEtaMinutes(Math.min(...distances));
      }
      byRoute[route.id] = { runningCount: drivers.length, nearestEta };
    });
    return byRoute;
  }, [liveDrivers, myLocation]);

  const runningCount = ROUTES.reduce((total, route) => total + stats[route.id].runningCount, 0);
  const townCount = new Set(ROUTES.flatMap((route) => route.towns)).size;
  const visibleRoutes = ROUTES.filter((route) => {
    const matchesSearch = [route.code, ...route.towns].join(' ').toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (filter !== 'running' || stats[route.id].runningCount > 0)
      && (filter !== 'saved' || savedRouteIds.includes(route.id));
  });

  return (
    <div className="h-full overflow-y-auto bg-[#f8f9fb] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div><p className="font-accent mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary-dark"><Route size={14} />Explore Nueva Vizcaya</p><h1 className="font-display text-4xl tracking-tight text-gray-950 sm:text-5xl">Find your next ride.</h1><p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-500">Explore jeepney routes, compare fares, and see what’s running before you head out.</p></div>
          <button type="button" onClick={() => navigate('/saved-routes')} className="font-accent flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:border-orange-200 hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Bookmark size={17} />Saved routes <ArrowUpRight size={16} /></button>
        </header>
        {driverError && <p role="alert" className="mb-4 text-sm text-red-600">{driverError}</p>}
        <dl className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
          {[
            { label: 'Jeepney routes', value: ROUTES.length, Icon: Route },
            { label: 'Towns connected', value: townCount, Icon: MapPin },
            { label: 'Jeepneys online', value: driverError ? 'Unavailable' : runningCount, Icon: BusFront },
          ].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-primary"><Icon size={21} strokeWidth={1.7} /></span><div><dt className="text-xs text-gray-500">{label}</dt><dd className="font-heading mt-0.5 text-2xl leading-none text-gray-950">{value}</dd></div></div>)}
        </dl>
        <section aria-labelledby="route-directory-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><h2 id="route-directory-title" className="font-heading text-xl text-gray-950">Route directory</h2><span role="status" className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-500">{visibleRoutes.length} routes</span></div>
            <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-orange-100 sm:w-72"><Search size={17} className="shrink-0 text-gray-400" /><span className="sr-only">Search routes by town or route number</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search town or route number" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-gray-400" /></label>
          </div>
          <div aria-label="Filter routes" className="mb-6 flex flex-wrap gap-2">
            {[['all', 'All routes'], ['running', 'Running now'], ['saved', 'Saved']].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} disabled={id === 'saved' && (saved.loading || Boolean(saved.error))} onClick={() => setFilter(id)} className={`font-accent min-h-10 rounded-full border px-4 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${filter === id ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>{label}</button>)}
            {(search || filter !== 'all') && <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="min-h-10 px-2 text-xs text-gray-500 hover:text-gray-950">Clear filters</button>}
          </div>

        {(saveError || saved.error) && <p role="alert" className="mb-4 text-sm text-red-600">{saveError || savedRouteError(saved.error)}{saved.error && <button type="button" onClick={saved.retry} className="ml-2 underline">Try again</button>}</p>}
        {saved.loading && <p role="status" className="mb-3 text-xs text-gray-500">Loading saved routes…</p>}
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {visibleRoutes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            runningCount={stats[route.id].runningCount}
            nearestEtaMinutes={stats[route.id].nearestEta}
            saved={savedRouteIds.includes(route.id)}
            saveDisabled={saved.loading || saved.busy || Boolean(saved.error)}
            onToggleSave={() => toggleSaved(route.id)}
            onOpen={() => navigate('/map', { state: { filter: route.id } })}
          />
        ))}
        </div>
        {!visibleRoutes.length && <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center"><Search size={28} className="mx-auto mb-4 text-primary" /><h3 className="font-heading text-xl">{filter === 'running' && !search ? 'No jeepneys are online right now' : filter === 'saved' && !search ? 'No saved routes yet' : 'No matching routes'}</h3><p className="mt-2 text-sm text-gray-500">{filter === 'saved' ? 'Save a route using its bookmark button to find it here.' : 'Try another town or browse all available routes.'}</p><button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="font-accent mt-5 min-h-11 rounded-xl bg-gray-950 px-5 py-2 text-sm text-white hover:bg-gray-800">View all routes</button></div>}
        </section>
      </div>
    </div>
  );
}
