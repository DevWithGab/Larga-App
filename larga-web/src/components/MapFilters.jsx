import { Search } from 'lucide-react';
import { ROUTES, getRoute, routePairLabel } from '../constants/routes';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const selectClass = 'h-10 min-w-0 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

export default function MapFilters({ search, setSearch, routeId, setRouteId, direction, setDirection, seatsOnly, setSeatsOnly }) {
  const route = getRoute(routeId);
  return <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 md:right-auto md:w-[400px] md:p-4">
    <div className="pointer-events-auto rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Town, route, or plate number" aria-label="Search jeepneys" className="h-10 pl-9" /></div>
      <div className="mt-2 grid grid-cols-2 gap-2"><select aria-label="Jeepney route" value={routeId} onChange={(event) => { setRouteId(event.target.value); setDirection('both'); }} className={selectClass}><option value="all">All routes</option>{ROUTES.map((item) => <option key={item.id} value={item.id}>{routePairLabel(item)}</option>)}</select>
        <select aria-label="Travel direction" value={direction} disabled={!route} onChange={(event) => setDirection(event.target.value)} className={`${selectClass} disabled:text-muted-foreground disabled:opacity-60`}><option value="both">Both directions</option>{route && <><option value="forward">To {route.towns[1]}</option><option value="reverse">To {route.towns[0]}</option></>}</select></div>
      <div className="mt-3 flex items-center justify-between gap-3"><Label htmlFor="map-seats" className="cursor-pointer text-xs font-normal text-muted-foreground">Only rides with reported seats available</Label><Switch id="map-seats" checked={seatsOnly} onCheckedChange={setSeatsOnly} /></div>
    </div>
  </div>;
}
