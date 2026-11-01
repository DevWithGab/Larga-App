import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Bell, ArrowRight, X } from 'lucide-react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getRoute, routeLabel } from '../constants/routes';
import { distanceMeters, formatDistance } from '../utils/geo';
import { isDriverLive } from '../utils/driverPresence';
import { Page, PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

function AlertRow({ alert }) {
  const [driver, setDriver] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  const [signalError, setSignalError] = useState(false);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(id); }, []);
  useEffect(() => {
    setDriver(null); setSignalError(false);
    if (!alert.driverId) { setSignalError(true); return undefined; }
    return onSnapshot(doc(db, 'drivers', alert.driverId), (snapshot) => { setDriver(snapshot.exists() ? snapshot.data() : null); setSignalError(false); }, () => { setDriver(null); setSignalError(true); });
  }, [alert.driverId]);
  const route = getRoute(alert.routeId);
  const live = isDriverLive(driver, now);
  const distance = live && alert.pickupLocation ? distanceMeters(alert.pickupLocation, driver.location) : null;
  async function cancel() { setRemoving(true); setError(''); try { await deleteDoc(doc(db, 'alerts', alert.id)); } catch { setError('Could not cancel this alert. Try again.'); setRemoving(false); } }
  return <li className="border-b border-border p-4 last:border-0 sm:p-5"><div className="flex items-center gap-4"><Bell className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><h2 className="text-sm font-medium">{alert.jeepneyNumber || driver?.jeepneyNumber || 'Plate unavailable'}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{route ? routeLabel(route, alert.direction) : 'Route unavailable'}</p><Badge variant="outline" className="mt-2 gap-1.5 border-0 p-0 font-normal text-muted-foreground"><span className={`size-1.5 rounded-full ${live ? 'bg-emerald-600' : 'bg-zinc-300'}`} />{signalError ? 'Live status unavailable' : !live ? 'Offline' : distance == null ? 'Online' : formatDistance(distance)}</Badge></div><Button variant="ghost" size="icon" disabled={removing} aria-label={`Cancel alert for ${alert.jeepneyNumber || 'this jeepney'}`} onClick={cancel}><X className="size-4" /></Button></div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</li>;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ uid: null, alerts: [], loading: false, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return undefined;
    setState({ uid: user.uid, alerts: [], loading: true, error: '' });
    return onSnapshot(query(collection(db, 'alerts'), where('commuterId', '==', user.uid)), (snapshot) => setState({ uid: user.uid, alerts: snapshot.docs.map((item) => ({ ...item.data(), id: item.id })), loading: false, error: '' }), () => setState({ uid: user.uid, alerts: [], loading: false, error: 'Could not load your alerts. Check your connection or try again.' }));
  }, [user, retry]);
  const alerts = user && state.uid === user.uid ? state.alerts : [];
  const loading = user && (state.uid !== user.uid || state.loading);
  return <Page><PageHeader title="Alerts" description="Check the status of jeepneys you follow in the mobile app." />
    {loading ? <div role="status" aria-label="Loading alerts" className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      : user && state.error ? <div role="alert" className="rounded-lg border border-border p-5"><p className="text-sm text-muted-foreground">{state.error}</p><Button variant="outline" className="mt-4" onClick={() => setRetry((value) => value + 1)}>Try again</Button></div>
      : alerts.length ? <ul className="rounded-lg border border-border">{alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)}</ul>
      : <div className="rounded-lg border border-border px-5 py-12 text-center"><Bell className="mx-auto mb-3 size-6 text-muted-foreground" /><h2 className="text-sm font-medium">No active alerts</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{user ? 'Set an arrival alert while tracking a jeepney in the Larga mobile app. Your saved alerts appear here.' : 'Arrival alerts are set in the mobile app. Use the map here to check live jeepney locations.'}</p><Button asChild variant="outline" className="mt-5"><Link to="/map">View live map<ArrowRight className="size-4" /></Link></Button></div>}
  </Page>;
}
