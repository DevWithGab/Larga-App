import { Bookmark, ArrowRight } from 'lucide-react';
import { routePairLabel } from '../constants/routes';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function RouteCard({ route, runningCount = 0, nearestEtaMinutes, saved, saveDisabled = false, onToggleSave, onOpen, loading = false }) {
  return <article className="group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-5 last:border-0 lg:grid-cols-[44px_minmax(0,1fr)_80px_90px_auto] sm:gap-4 sm:px-5">
    <span className="flex size-10 items-center justify-center rounded-md border border-border bg-muted/40 text-sm font-semibold tabular-nums">{route.code}</span>
    <div className="min-w-0"><h2 className="text-sm font-semibold leading-6">{routePairLabel(route)}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Both directions <span className="lg:hidden">· ₱{route.fare} one way</span></p>
      {nearestEtaMinutes != null && <p className="mt-1 text-xs text-muted-foreground">Nearest ride: ~{nearestEtaMinutes} min travel estimate</p>}
      <p className="mt-2 text-xs text-muted-foreground lg:hidden">{loading ? 'Checking live rides…' : runningCount ? `${runningCount} online` : 'None online'}</p>
    </div>
    <div className="hidden text-sm tabular-nums lg:block"><span className="font-medium">₱{route.fare}</span><p className="mt-1 text-xs text-muted-foreground">one way</p></div>
    <div className="hidden lg:block"><Badge variant="outline" className="gap-1.5 border-0 px-0 font-normal text-muted-foreground"><span className={`size-1.5 rounded-full ${runningCount ? 'bg-emerald-600' : 'bg-zinc-300'}`} />{loading ? 'Checking…' : runningCount ? `${runningCount} online` : 'None online'}</Badge></div>
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
      {onToggleSave && <Button type="button" variant="ghost" size="icon" disabled={saveDisabled} onClick={onToggleSave} aria-pressed={Boolean(saved)} aria-label={`${saved ? 'Unsave' : 'Save'} ${routePairLabel(route)}`} className={saved ? 'text-primary-dark' : 'text-muted-foreground'}><Bookmark className="size-4" fill={saved ? 'currentColor' : 'none'} /></Button>}
      <Button type="button" variant="outline" size="sm" onClick={onOpen} disabled={!onOpen} aria-label={`View ${routePairLabel(route)} on map`}>Map <ArrowRight className="size-3.5" /></Button>
    </div>
  </article>;
}
