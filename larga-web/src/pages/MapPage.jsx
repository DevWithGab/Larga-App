import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Crosshair, Search, SlidersHorizontal, BusFront, ArrowUpRight } from 'lucide-react';
import JeepneyMap from '../components/JeepneyMap';
import JeepneyDetails from '../components/JeepneyDetails';
import { seatAvailability } from '../utils/seatAvailability';
import LocationPrompt from '../components/LocationPrompt';
import MapLegend from '../components/MapLegend';
import { useOnlineDrivers } from '../hooks/useOnlineDrivers';
import { useMyLocation } from '../hooks/useMyLocation';
import { useResizableSheet } from '../hooks/useResizableSheet';
import { DEFAULT_CENTER } from '../constants/map';
import {
  ROUTES,
  getRoute,
  getRouteEndpoints,
  routeLabel,
  routePairLabel,
} from '../constants/routes';
import { fetchRoutePath } from '../utils/osrm';
import { formatDistance, estimateEtaMinutes } from '../utils/geo';
import { selectCommuterRides } from '../utils/commuterRides';

const FILTERS = [
  { id: 'all', label: 'All routes' },
  ...ROUTES.map((route) => ({ id: route.id, label: routePairLabel(route) })),
];

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [direction, setDirection] = useState('both');
  const [seatsOnly, setSeatsOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [collapsed, setCollapsed] = useState(false);

  const { drivers: liveDrivers, error: driverError, loading } = useOnlineDrivers();
  const { coordinate: myLocation, status: locationStatus, requestLocation } = useMyLocation();
  const { areaRef, sheetStyle, handleProps, isDragging } = useResizableSheet();

  const [routeLine, setRouteLine] = useState(null);

  useEffect(() => {
    if (activeFilter === 'all') {
      setRouteLine(null);
      return undefined;
    }
    const routeEndpoints = getRouteEndpoints(getRoute(activeFilter));
    if (!routeEndpoints) {
      setRouteLine(null);
      return undefined;
    }

    const endpoints = direction === 'reverse' ? [...routeEndpoints].reverse() : routeEndpoints;
    setRouteLine(endpoints);


    let cancelled = false;
    fetchRoutePath(endpoints[0], endpoints[1]).then((path) => {
      if (!cancelled && path) setRouteLine(path);
    });
    return () => {
      cancelled = true;
    };
  }, [activeFilter, direction]);


  const { state } = useLocation();
  useEffect(() => {
    if (state?.filter) {
      setActiveFilter(state.filter);
      setDirection(state.direction === 'reverse' ? 'reverse' : 'forward');
    }
  }, [state?.filter, state?.direction]);

  const visibleDrivers = useMemo(() => {
    return selectCommuterRides(liveDrivers, { routeId: activeFilter, direction, search, seatsOnly, location: myLocation, routes: ROUTES });
  }, [liveDrivers, activeFilter, direction, search, seatsOnly, myLocation]);
  const selectedRoute = getRoute(activeFilter);
  const hasFilters = activeFilter !== 'all' || search.trim() || seatsOnly;
  const resetFilters = () => { setActiveFilter('all'); setDirection('both'); setSearch(''); setSeatsOnly(false); };

  const selectedDriver = visibleDrivers.find((driver) => driver.id === selectedId);
  useEffect(() => {
    if (selectedId && !selectedDriver) setSelectedId(null);
  }, [selectedId, selectedDriver]);

  const markers = useMemo(
    () => [
      ...(myLocation ? [{ id: 'me', coordinate: myLocation, variant: 'you' }] : []),
      ...(routeLine?.length >= 2 ? [
        { id: 'route-start', coordinate: routeLine[0], variant: 'start' },
        { id: 'route-end', coordinate: routeLine[routeLine.length - 1], variant: 'end' },
      ] : []),
      ...visibleDrivers.map((driver) => ({
        id: driver.id,
        coordinate: [driver.location.longitude, driver.location.latitude],
        variant: 'jeepney',
        driver,
        heading: driver.heading,
        full: seatAvailability(driver).full,
        selected: driver.id === selectedId,
        label: driver.jeepneyNumber,
      })),
    ],
    [myLocation, visibleDrivers, routeLine, selectedId]
  );

  const focusOn = (coordinate) => setFocus({ coordinate, key: Date.now() });
  const selectDriver = (driver) => {
    setSelectedId(driver.id);
    setCollapsed(false);
    focusOn([driver.location.longitude, driver.location.latitude]);
  };

  return (
    // The map is the page: it fills the pane and the controls float over it,
    // rather than sitting in a white strip that eats the top of the screen.
    <div className="h-full w-full">
      <LocationPrompt status={locationStatus} onEnable={requestLocation} />
      <div ref={areaRef} className="relative h-full w-full">
        <JeepneyMap
          markers={markers}
          center={myLocation ?? DEFAULT_CENTER}
          focus={focus}
          routeLine={routeLine}
          onMarkerClick={(id) => {
            const driver = visibleDrivers.find((d) => d.id === id);
            if (driver) selectDriver(driver);
          }}
        />


        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-3">
          <div className="pointer-events-auto flex items-center rounded-full bg-white/95 px-4 py-3
                          shadow-lg shadow-black/10 backdrop-blur-sm md:max-w-md">
            <Search size={18} color="#9ca3af" />
            <input
              type="search"
              className="font-regular ml-2 w-full bg-transparent text-sm text-black outline-none
                         placeholder:text-gray-400"
              placeholder="Where are you headed?"
              aria-label="Search by town, route code, or plate number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* Enable gestures on the scroll container, including gaps between pills.
              The negative margin keeps horizontal scrolling edge to edge. */}
          <div className="pointer-events-auto -mx-5 mt-3 flex touch-pan-x gap-2 overflow-x-auto
                          overscroll-x-contain px-5 pb-2">
            {FILTERS.map(({ id, label }) => {
              const isActive = id === activeFilter;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setActiveFilter(id); setDirection('both'); }}
                  aria-pressed={isActive}
                  className={`font-accent pointer-events-auto shrink-0 rounded-full border px-4 py-2
                              text-sm shadow-md shadow-black/5 backdrop-blur-sm transition-colors ${
                                isActive
                                  ? 'border-black bg-black text-white'
                                  : 'border-white/60 bg-white/95 text-black hover:bg-white'
                              }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-auto mt-1 flex w-fit max-w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-lg shadow-black/5 backdrop-blur-sm">
            {selectedRoute && <label className="font-accent flex min-w-0 items-center gap-1 text-xs text-gray-600">
              <SlidersHorizontal size={15} className="ml-1 shrink-0" />
              <select aria-label="Travel direction" value={direction} onChange={(event) => setDirection(event.target.value)} className="min-h-10 min-w-0 max-w-44 rounded-xl bg-gray-50 px-2 text-black focus-visible:outline-primary">
                <option value="both">Both directions</option>
                <option value="forward">To {selectedRoute.towns[1]}</option>
                <option value="reverse">To {selectedRoute.towns[0]}</option>
              </select>
            </label>}
            <label className="font-accent flex min-h-10 cursor-pointer items-center gap-2 px-2 text-xs text-gray-700">
              <input type="checkbox" checked={seatsOnly} onChange={(event) => setSeatsOnly(event.target.checked)} className="h-4 w-4 accent-primary" />
              Seats available
            </label>
          </div>
        </div>

        <MapLegend />

        {(
          <button
            type="button"
            onClick={() => myLocation ? focusOn(myLocation) : requestLocation()}
            aria-label={myLocation ? 'Recenter on my location' : 'Turn on location'}
            className="absolute right-4 top-52 flex h-11 w-11 items-center justify-center rounded-full
                       bg-white shadow-lg shadow-black/10 hover:bg-gray-50"
          >
            <Crosshair size={20} />
          </button>
        )}

        <div
          style={selectedDriver ? { ...sheetStyle, '--sheet-h': 'min(440px, 60%)' } : sheetStyle}
          className={`absolute inset-x-0 bottom-0 z-20 flex h-[var(--sheet-h)] flex-col overflow-hidden
                      rounded-t-3xl bg-white px-5 pb-6 pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
                      md:inset-auto md:bottom-4 md:left-4 md:h-auto md:w-80 md:rounded-3xl
                      md:pt-5 md:shadow-xl
                      ${/* Never tall enough to reach the floating search bar and filter
                            pills — the map fills the pane now, so without this the sheet
                            would cover the controls at its largest stop. */ ''}
                      max-h-[calc(100%-12rem)] md:max-h-[calc(100%-12rem)]
                      ${/* Anchored to the bottom with no top inset, so on a wide screen the
                            panel is only as tall as what's in it — stretching it top to bottom
                            meant an empty list still covered most of the map. */ ''}
                      ${collapsed ? 'md:pb-5' : ''}
                      ${isDragging ? '' : 'transition-[height] duration-200 ease-out'}`}
        >
          {/* Drag handle. Phone layout only — on a wide screen the panel sits
              beside the map instead of on top of it, so there's nothing to get
              out of the way of. `touch-none` stops a drag from scrolling the
              page underneath instead of resizing. */}
          {!selectedDriver && <button
            type="button"
            {...handleProps}
            className="group mx-auto mb-1 flex h-7 w-24 shrink-0 cursor-grab touch-none
                       items-center justify-center active:cursor-grabbing md:hidden"
          >
            <span className="h-1.5 w-10 rounded-full bg-gray-300 transition-colors group-hover:bg-gray-400" />
          </button>}

          {selectedDriver ? <JeepneyDetails driver={selectedDriver} onClose={() => setSelectedId(null)} /> : <>
          <div className={`mb-4 flex shrink-0 items-center justify-between ${collapsed ? 'md:mb-0' : ''}`}>
            <div><p className="font-accent mb-0.5 text-[10px] uppercase tracking-widest text-primary">Find your ride</p><h1 className="font-heading text-lg text-black">Nearby jeepneys</h1></div>
            <div className="flex items-center gap-2">
              <span className="font-accent rounded-full bg-orange-50 px-3 py-1 text-xs text-primary">
                {visibleDrivers.length} {hasFilters ? 'matches' : 'running'}
              </span>
              {/* The wide-screen counterpart of the phone's drag handle: there
                  the sheet sits over the map, here it sits beside it, so what's
                  wanted is getting it out of the way entirely rather than
                  resizing it. */}
              <button
                type="button"
                onClick={() => setCollapsed((isCollapsed) => !isCollapsed)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? 'Expand map panel' : 'Collapse map panel'}
                className="hidden h-7 w-7 items-center justify-center rounded-full text-gray-400
                           hover:bg-gray-100 hover:text-black md:flex"
              >
                {collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {/* Collapsed hides the body on wide screens only — the phone layout
              has the drag handle for this, and its stops already go down to a
              header-only peek. */}
          <div className={`flex min-h-0 flex-1 flex-col ${collapsed ? 'md:hidden' : ''}`}>
          <p className="font-regular mb-3 text-xs text-gray-500">{myLocation ? 'Closest first · distances measured from you' : 'Choose a route, then pick a jeepney to see details.'}</p>
          {locationStatus === 'denied' && (
            <p className="font-regular mb-3 shrink-0 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Location is blocked, so distances and ETAs are hidden. Allow location in your browser to
              see how far away each jeepney is.
            </p>
          )}

          {driverError ? (
            <p role="alert" className="font-regular text-sm text-red-600">{driverError}</p>
          ) : loading ? (
            <p role="status" className="font-regular py-6 text-sm text-gray-500">Finding live jeepneys…</p>
          ) : visibleDrivers.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-5 text-center" role="status">
              <BusFront size={28} className="mx-auto mb-2 text-gray-400" />
              <p className="font-heading text-base">{hasFilters ? 'No rides match yet' : 'No jeepneys online yet'}</p>
              <p className="font-regular mt-1 text-xs text-gray-500">{hasFilters ? 'Try another direction or include rides without reported seats.' : 'Live rides will appear here when drivers start broadcasting.'}</p>
              {hasFilters && <button type="button" onClick={resetFilters} className="font-accent mt-3 min-h-11 rounded-xl bg-black px-4 text-sm text-white hover:bg-gray-800">Clear filters</button>}
            </div>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {visibleDrivers.map((driver) => {
                const route = getRoute(driver.routeId);
                const seatsLeft = seatAvailability(driver).left;
                const etaMinutes = estimateEtaMinutes(driver.distance);

                return (
                  <li key={driver.id}>
                    <button
                      type="button"
                      onClick={() => selectDriver(driver)}
                      className="mb-2 flex w-full items-center rounded-2xl border border-gray-100 p-3 text-left
                                 transition-colors hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-primary"
                    >
                      <span className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                        <img src="/larga-jeep/larga-jeep.png" alt="" className="h-11 w-11 object-contain" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-accent block truncate text-sm text-black">
                          {route ? `${route.code} · ${routeLabel(route, driver.direction)}` : 'Route not set'}
                        </span>
                        <span className="font-regular mt-0.5 block truncate text-xs text-gray-500">
                          {driver.jeepneyNumber ?? 'Unknown plate'}
                          {seatsLeft !== null && (
                            <span className={seatsLeft === 0 ? 'font-accent text-red-600' : 'text-gray-500'}>
                              {' · '}
                              {seatsLeft === 0 ? 'Full' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
                            </span>
                          )}
                        </span>
                        {driver.distance != null && <span className="font-regular mt-1 block text-xs text-gray-500">{formatDistance(driver.distance)}</span>}
                      </span>
                      <span className="font-heading ml-2 shrink-0 text-right text-sm text-black">
                        {etaMinutes === null ? <ArrowUpRight size={18} /> : <>{`~${etaMinutes} min`}<span className="font-regular block text-[10px] text-gray-500">est. travel</span></>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {myLocation && visibleDrivers.length > 0 && <p className="font-regular mt-2 text-[10px] text-gray-400">Travel estimates use straight-line distance, not traffic or approach direction.</p>}
          </div>
          </>}
        </div>
      </div>
    </div>
  );
}
