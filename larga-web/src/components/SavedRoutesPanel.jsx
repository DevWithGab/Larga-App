import { useState } from 'react';
import { Bookmark, Plus, Pencil, Trash2, ArrowUpRight, MapPin, StickyNote, Check, AlertCircle } from 'lucide-react';
import { ROUTES, getRoute, routeLabel, routePairLabel, routeDistanceKm } from '../constants/routes';
import { savedRouteError } from '../utils/savedRoutes';

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-accent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50';

export default function SavedRoutesPanel({ saved, activeRouteId, onOpen }) {
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const available = ROUTES.filter((route) => !saved.routes.some((item) => item.routeId === route.id));

  function beginEdit(item) {
    setError('');
    setMessage('');
    setDeleting(null);
    setEditor(item ? { id: item.id, routeId: item.routeId, name: item.name || '', notes: item.notes || '', direction: item.direction || 'forward' }
      : { routeId: available.find((route) => route.id === activeRouteId)?.id || available[0]?.id || '', name: '', notes: '', direction: 'forward' });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editor.id) await saved.update(editor);
      else await saved.create(editor);
      setMessage(editor.id ? 'Saved route updated.' : 'Route saved.');
      setEditor(null);
    } catch (cause) { setError(savedRouteError(cause)); }
  }

  async function remove(item) {
    setError('');
    setMessage('');
    try {
      await saved.remove(item);
      setDeleting(null);
      setMessage('Route removed from your saved routes.');
    } catch (cause) { setError(savedRouteError(cause)); }
  }

  if (saved.loading) return <div role="status"><p className="mb-5 text-sm text-gray-500">Loading your collectionâ€¦</p><div aria-hidden="true" className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((id) => <div key={id} className="h-72 motion-safe:animate-pulse rounded-3xl border border-gray-100 bg-white p-6"><div className="mb-6 h-7 w-20 rounded-lg bg-orange-50" /><div className="mb-4 h-5 w-2/3 rounded bg-gray-100" /><div className="h-20 rounded-xl bg-gray-50" /></div>)}</div></div>;
  if (saved.error) return <div role="alert" className="rounded-3xl border border-red-100 bg-white p-8"><AlertCircle size={26} className="mb-4 text-red-500" /><h2 className="font-heading text-lg">We couldnâ€™t load your routes</h2><p className="mt-2 text-sm text-gray-500">{savedRouteError(saved.error)}</p><button type="button" onClick={saved.retry} className={`${buttonClass} mt-5 bg-gray-950 text-white hover:bg-gray-800`}>Try again</button></div>;

  return (
    <div className="pb-4">
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <div role="status">{message && <p className="mb-5 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-800"><Check size={17} />{message}</p>}</div>
      {editor ? (
        <form onSubmit={submit} className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-primary"><Bookmark size={23} /></span><div><h2 className="font-heading text-2xl">{editor.id ? 'Make it your own' : 'Your next regular trip'}</h2><p className="mt-1 text-sm text-gray-500">{editor.id ? 'Update the details of your saved route.' : 'Choose a route and add the details that matter to you.'}</p></div></div>
          <fieldset disabled={saved.busy} className="grid gap-5 sm:grid-cols-2 disabled:opacity-60">
            <label className="block text-xs font-accent">Jeepney route
              <select required value={editor.routeId} disabled={Boolean(editor.id)} onChange={(event) => setEditor({ ...editor, routeId: event.target.value })} className={inputClass}>
                {(editor.id ? ROUTES.filter((route) => route.id === editor.routeId) : available).map((route) => <option key={route.id} value={route.id}>{routePairLabel(route)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-accent">Name <span className="font-regular text-gray-400">(optional)</span>
              <input autoFocus maxLength={60} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="e.g. Trip to school" className={inputClass} />
            </label>
            <label className="block text-xs font-accent sm:col-span-2">Travel direction
              <select value={editor.direction} onChange={(event) => setEditor({ ...editor, direction: event.target.value })} className={inputClass}>
                <option value="forward">{routeLabel(getRoute(editor.routeId), 'forward')}</option>
                <option value="reverse">{routeLabel(getRoute(editor.routeId), 'reverse')}</option>
              </select>
            </label>
            <label className="block text-xs font-accent sm:col-span-2">Notes <span className="font-regular text-gray-400">(optional)</span>
              <textarea rows={2} maxLength={300} value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} placeholder="Where you usually board, remindersâ€¦" className={`${inputClass} resize-y`} />
            </label>
            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5 sm:col-span-2">
              <button type="submit" className={`${buttonClass} bg-primary text-white hover:bg-primary-dark`}><Check size={17} />{saved.busy ? 'Savingâ€¦' : editor.id ? 'Save changes' : 'Save route'}</button>
              <button type="button" onClick={() => { setEditor(null); setError(''); }} className={`${buttonClass} bg-gray-50 text-gray-600 hover:bg-gray-100`}>Cancel</button>
            </div>
          </fieldset>
        </form>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5"><div className="flex items-center gap-3"><h2 className="font-heading text-lg text-gray-900">My routes</h2><span className="font-accent rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-500">{saved.routes.length} saved</span></div><button type="button" disabled={saved.busy || !available.length} onClick={() => beginEdit(null)} className={`${buttonClass} bg-primary text-white shadow-sm hover:bg-primary-dark`}><Plus size={18} />{available.length ? 'Save a route' : 'All routes saved'}</button></div>
          {!saved.routes.length && <div className="rounded-3xl border border-dashed border-orange-200 bg-white px-6 py-16 text-center"><span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-primary"><Bookmark size={34} strokeWidth={1.5} /></span><h2 className="font-heading text-2xl">Your everyday trips start here</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500">The ride to school, your daily commute, a weekend visit. Save a route and make it easier to find next time.</p><button type="button" disabled={saved.busy} onClick={() => beginEdit(null)} className={`${buttonClass} mt-7 bg-gray-950 text-white hover:bg-gray-800`}><Plus size={17} />Save your first route</button></div>}
          <ul className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {saved.routes.map((item) => {
              const route = getRoute(item.routeId);
              const title = item.name || routePairLabel(route) || 'Unavailable route';
              const towns = route ? (item.direction === 'reverse' ? [...route.towns].reverse() : route.towns) : [];
              const km = route ? routeDistanceKm(route) : null;
              return <li key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-400">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-accent flex items-center gap-2.5 text-xs text-gray-500">
                      {route && <span className="font-heading flex h-9 min-w-9 items-center justify-center rounded-md bg-orange-50 px-2 text-base tabular-nums text-primary-dark">{route.code}</span>}
                      {route ? 'Jeepney route' : 'Unavailable route'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><Bookmark aria-hidden="true" size={14} className="fill-orange-100 text-primary" />Saved</span>
                  </div>
                  <h3 className={item.name ? 'font-accent mt-5 break-words text-sm text-gray-700' : 'sr-only'}>{title}</h3>
                  {route ? <>
                    <dl className="relative my-5 space-y-4 pl-7 before:absolute before:bottom-4 before:left-[9px] before:top-7 before:w-px before:bg-primary before:content-['']">

                      {towns.map((town, index) => <div key={index} className="relative">
                        <MapPin aria-hidden="true" size={19} strokeWidth={2} className="absolute -left-7 top-6 bg-white text-primary" />
                        <dt className="text-xs text-gray-500">{index === 0 ? 'From' : 'To'}</dt>
                        <dd className="font-heading break-words text-[1.75rem] leading-tight tracking-tight text-gray-950">{town}</dd>
                      </div>)}
                    </dl>
                    <dl className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                      <div>
                        <dt className="text-xs text-gray-500">End-to-end fare</dt>
                        <dd className="font-heading mt-1 text-3xl leading-tight tabular-nums text-gray-950">{route.fare != null ? <><span className="mr-0.5 text-xl">{'\u20b1'}</span>{route.fare}</> : '\u2014'}</dd>
                        <dd className="mt-1 text-xs text-gray-500">One way</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Town distance</dt>
                        <dd className="font-heading mt-1 text-3xl leading-tight tabular-nums text-gray-950">{km != null ? <>{km}<span className="font-regular ml-1 text-sm text-gray-500">km</span></> : '\u2014'}</dd>
                        <dd className="mt-1 text-xs text-gray-500">Approx. straight line</dd>
                      </div>
                    </dl>
                  </> : <p className="my-5 text-sm text-gray-500">This route is no longer available.</p>}
                  {item.notes && <div className="mt-5 flex items-start gap-2 border-t border-gray-100 pt-4 text-gray-500"><StickyNote aria-hidden="true" size={15} className="mt-0.5 shrink-0" /><p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{item.notes}</p></div>}
                </div>
                {deleting === item.id ? <div className="mx-5 mb-5 mt-auto rounded-xl bg-red-50 p-3">
                  <p className="text-xs text-red-700">Remove this saved route?</p>
                  <div className="mt-1 flex gap-1"><button type="button" disabled={saved.busy} onClick={() => remove(item)} className={`${buttonClass} text-red-700`}>{saved.busy ? 'Removingâ€¦' : 'Remove'}</button><button type="button" disabled={saved.busy} onClick={() => { setDeleting(null); setError(''); }} className={`${buttonClass} text-gray-600`}>Keep route</button></div>
                </div> : <div className="mt-auto flex flex-wrap items-center gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
                  <button type="button" disabled={!route || saved.busy || !onOpen} onClick={() => onOpen(item)} aria-label={`View ${title} on map`} className={`${buttonClass.replace('justify-center', 'justify-between').replace('rounded-xl', 'rounded-lg')} flex-1 bg-gray-950 text-white hover:bg-gray-800`}>View on map <ArrowUpRight aria-hidden="true" size={17} /></button>
                  <button type="button" disabled={!route || saved.busy} title="Edit route" aria-label={`Edit ${title}`} onClick={() => beginEdit(item)} className={`${buttonClass.replace('px-4', 'px-0').replace('rounded-xl', 'rounded-lg')} w-11 border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50`}><Pencil aria-hidden="true" size={16} /></button>
                  <button type="button" disabled={saved.busy} title="Delete route" aria-label={`Delete ${title}`} onClick={() => { setDeleting(item.id); setMessage(''); setError(''); }} className={`${buttonClass.replace('px-4', 'px-0').replace('rounded-xl', 'rounded-lg')} w-11 border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600`}><Trash2 aria-hidden="true" size={16} /></button>
                </div>}
              </li>;
            })}
          </ul>
        </>
      )}
    </div>
  );
}

