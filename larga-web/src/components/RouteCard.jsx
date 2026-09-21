import { Bookmark, ArrowLeftRight, ArrowUpRight, Clock3, MapPin } from 'lucide-react';
import { routeDistanceKm, routePairLabel } from '../constants/routes';

export default function RouteCard({ route, runningCount = 0, nearestEtaMinutes, saved, saveDisabled = false, onToggleSave, onOpen }) {
  const [a, b] = route.towns;
  const km = routeDistanceKm(route);
  const isRunning = runningCount > 0;
  const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-400">
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="font-accent flex items-center gap-2.5 text-xs text-gray-500">
            <span className="font-heading flex h-9 min-w-9 items-center justify-center rounded-md bg-orange-50 px-2 text-base tabular-nums text-primary-dark">{route.code}</span>
            Jeepney route
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs ${isRunning ? 'text-green-700' : 'text-gray-500'}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-green-600' : 'bg-gray-300'}`} />
            {isRunning ? `${runningCount} online` : 'None online'}
          </span>
        </div>

        <h2 className="font-heading relative my-6 space-y-3 pl-7 text-[1.75rem] leading-tight tracking-tight text-gray-950">
          <span aria-hidden="true" className="absolute bottom-3.5 left-[9px] top-3.5 w-px bg-primary" />
          <span className="relative block break-words">
            <MapPin aria-hidden="true" size={19} strokeWidth={2} className="absolute -left-7 top-2 bg-white text-primary" />
            {a}
          </span>
          <span className="sr-only">to and from</span>
          <span className="relative block break-words">
            <MapPin aria-hidden="true" size={19} strokeWidth={2} className="absolute -left-7 top-2 bg-white text-primary" />
            {b}
          </span>
        </h2>
        <p className="mb-5 flex items-center gap-2 text-xs text-gray-500">
          <ArrowLeftRight aria-hidden="true" size={14} /> Runs in both directions
        </p>

        <dl className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <dt className="text-xs text-gray-500">End-to-end fare</dt>
            <dd className="font-heading mt-1 text-3xl leading-tight tabular-nums text-gray-950">
              {route.fare != null ? <><span className="mr-0.5 text-xl">{'₱'}</span>{route.fare}</> : '—'}
            </dd>
            <dd className="mt-1 text-xs text-gray-500">One way</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Town distance</dt>
            <dd className="font-heading mt-1 text-3xl leading-tight tabular-nums text-gray-950">
              {km != null ? <>{km}<span className="font-regular ml-1 text-sm text-gray-500">km</span></> : '—'}
            </dd>
            <dd className="mt-1 text-xs text-gray-500">Approx. straight line</dd>
          </div>
        </dl>
      </div>

      <div className="mx-5 flex min-h-12 items-start gap-2 border-t border-gray-100 py-3 text-xs leading-relaxed text-gray-500 sm:mx-6">
        <Clock3 aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
        <p>{isRunning ? nearestEtaMinutes != null ? <>Nearest jeepney <strong className="font-accent text-gray-900">~{nearestEtaMinutes} min</strong> away (estimate)</> : 'Location needed for a nearest jeepney estimate.' : 'No live arrivals. Route map is available.'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
        <button type="button" onClick={onOpen} disabled={!onOpen} aria-label={`View ${routePairLabel(route)} on map`} className={`font-accent flex min-h-11 flex-1 items-center justify-between gap-3 rounded-lg bg-gray-950 px-4 py-2.5 text-sm text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}>
          View on map <ArrowUpRight aria-hidden="true" size={17} />
        </button>
        {onToggleSave && (
          <button type="button" onClick={onToggleSave} disabled={saveDisabled} aria-pressed={Boolean(saved)} aria-label={`${saved ? 'Unsave' : 'Save'} ${routePairLabel(route)}`} title={saved ? 'Remove from saved routes' : 'Save route'} className={`font-accent flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${saved ? 'border-orange-200 bg-orange-50 text-primary-dark' : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'} ${focusClass}`}>
            <Bookmark aria-hidden="true" size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </article>
  );
}
