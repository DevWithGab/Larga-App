import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Search } from 'lucide-react';
import { useSavedRoutes } from '../hooks/useSavedRoutes';
import { savedRouteError } from '../utils/savedRoutes';
import { useOnlineDrivers } from '../hooks/useOnlineDrivers';
import { useMyLocation } from '../hooks/useMyLocation';
import RouteCard from '../components/RouteCard';
import { Page, PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ROUTES } from '../constants/routes';
import { distanceMeters, estimateEtaMinutes } from '../utils/geo';

export default function RoutesPage() {
  const saved = useSavedRoutes();
  const [saveError, setSaveError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { drivers, error: driverError, loading } = useOnlineDrivers();
  const { coordinate } = useMyLocation();
  const savedIds = saved.routes.map((item) => item.routeId);
  const stats = useMemo(() => Object.fromEntries(ROUTES.map((route) => {
    const rides = drivers.filter((driver) => driver.routeId === route.id);
    const distances = coordinate ? rides.map((driver) => distanceMeters({ latitude: coordinate[1], longitude: coordinate[0] }, driver.location)).filter(Number.isFinite) : [];
    return [route.id, { count: rides.length, eta: distances.length ? estimateEtaMinutes(Math.min(...distances)) : null }];
  })), [drivers, coordinate]);
  const visible = ROUTES.filter((route) => [route.code, ...route.towns].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    && (filter !== 'running' || stats[route.id].count > 0) && (filter !== 'saved' || savedIds.includes(route.id)));

  async function toggleSaved(routeId) {
    setSaveError('');
    try { const item = saved.routes.find((value) => value.routeId === routeId); if (item) await saved.remove(item); else await saved.create({ routeId }); }
    catch (cause) { setSaveError(savedRouteError(cause)); }
  }

  return <Page>
    <PageHeader title="Routes" description="Find a route, check the fare, and see which jeepneys are online." action={<Button asChild variant="outline"><Link to="/saved-routes"><Bookmark className="size-4" />Saved routes</Link></Button>} />
    <Tabs value={filter} onValueChange={setFilter}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TabsList aria-label="Route filters"><TabsTrigger value="all">All routes</TabsTrigger><TabsTrigger value="running">Running now</TabsTrigger><TabsTrigger value="saved" disabled={saved.loading || Boolean(saved.error)}>Saved</TabsTrigger></TabsList>
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input type="search" aria-label="Search routes" placeholder="Town or route number" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 pl-9" /></div>
      </div>
      {(saveError || saved.error || driverError) && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError || (saved.error && savedRouteError(saved.error)) || driverError}{saved.error && <Button variant="link" onClick={saved.retry}>Retry</Button>}</div>}
      {['all', 'running', 'saved'].map((tab) => <TabsContent key={tab} value={tab}>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex justify-between border-b border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>Route directory</span><span role="status">{visible.length} of {ROUTES.length} routes</span></div>
          {loading && filter === 'running' ? <p role="status" className="p-8 text-sm text-muted-foreground">Checking live rides…</p> : visible.map((route) => <RouteCard key={route.id} route={route} loading={loading} runningCount={stats[route.id].count} nearestEtaMinutes={stats[route.id].eta} saved={savedIds.includes(route.id)} saveDisabled={saved.loading || saved.busy || Boolean(saved.error)} onToggleSave={() => toggleSaved(route.id)} onOpen={() => navigate('/map', { state: { filter: route.id } })} />)}
          {!visible.length && !(loading && filter === 'running') && <div className="px-5 py-12 text-center"><p className="text-sm font-medium">{filter === 'saved' ? 'No saved routes match' : filter === 'running' ? 'No rides online for these routes' : 'No routes match your search'}</p><p className="mt-2 text-sm text-muted-foreground">{filter === 'saved' ? 'Bookmark a route to keep it here.' : 'Try another town or check all routes.'}</p><Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setFilter('all'); }}>Show all routes</Button></div>}
        </div>
      </TabsContent>)}
    </Tabs>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">Fares shown are per person, end to end. Online counts update as drivers check in.</p>
  </Page>;
}
