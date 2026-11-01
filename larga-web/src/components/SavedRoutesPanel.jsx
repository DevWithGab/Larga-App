import { useRef, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowRight, Bookmark } from 'lucide-react';
import { ROUTES, getRoute, routeLabel, routePairLabel } from '../constants/routes';
import { savedRouteError } from '../utils/savedRoutes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from './ui/alert-dialog';

const selectClass = 'mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50';

export default function SavedRoutesPanel({ saved, activeRouteId, onOpen }) {
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const opener = useRef(null);
  const addButton = useRef(null);
  const available = ROUTES.filter((route) => !saved.routes.some((item) => item.routeId === route.id));

  function beginEdit(item) {
    opener.current = document.activeElement;
    setError(''); setMessage('');
    setEditor(item ? { id: item.id, routeId: item.routeId, name: item.name || '', notes: item.notes || '', direction: item.direction || 'forward' }
      : { routeId: available.find((route) => route.id === activeRouteId)?.id || available[0]?.id || '', name: '', notes: '', direction: 'forward' });
  }
  async function submit(event) {
    event.preventDefault(); setError('');
    try { if (editor.id) await saved.update(editor); else await saved.create(editor); setMessage(editor.id ? 'Route updated.' : 'Route saved.'); setEditor(null); }
    catch (cause) { setError(savedRouteError(cause)); }
  }
  async function remove() {
    setError('');
    try { await saved.remove(deleting); setDeleting(null); setMessage('Saved route removed.'); }
    catch (cause) { setError(savedRouteError(cause)); }
  }

  if (saved.loading) return <div role="status" aria-label="Loading saved routes" className="space-y-3">{[1, 2, 3].map((id) => <Skeleton key={id} className="h-24 w-full rounded-md" />)}</div>;
  if (saved.error) return <div role="alert" className="rounded-lg border border-border p-5"><p className="text-sm font-medium">Could not load saved routes</p><p className="mt-2 text-sm text-muted-foreground">{savedRouteError(saved.error)}</p><Button variant="outline" className="mt-4" onClick={saved.retry}>Try again</Button></div>;

  return <>
    <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{saved.routes.length} saved {saved.routes.length === 1 ? 'route' : 'routes'}</p><Button ref={addButton} disabled={saved.busy || !available.length} onClick={() => beginEdit(null)}><Plus className="size-4" />Save route</Button></div>
    <div role="status" className="mb-3 text-sm text-emerald-700">{message}</div>
    {!saved.routes.length ? <div className="rounded-lg border border-border px-5 py-12 text-center"><Bookmark className="mx-auto mb-3 size-6 text-muted-foreground" /><h2 className="text-sm font-medium">No saved routes</h2><p className="mt-2 text-sm text-muted-foreground">Save a route to quickly find its map and your boarding notes.</p><Button variant="outline" className="mt-5" onClick={() => beginEdit(null)}>Save a route</Button></div>
      : <ul className="divide-y divide-border rounded-lg border border-border">{saved.routes.map((item) => {
        const route = getRoute(item.routeId);
        const title = item.name || routePairLabel(route) || 'Unavailable route';
        return <li key={item.id} className="flex flex-wrap items-start gap-3 p-4 sm:items-center sm:gap-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-sm font-semibold">{route?.code || '—'}</span>
          <div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{route ? routeLabel(route, item.direction) : 'This route is no longer available.'}{route && <span> · ₱{route.fare} one way</span>}</p>{item.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{item.notes}</p>}</div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled={!route || saved.busy} aria-label={`Edit ${title}`} onClick={() => beginEdit(item)}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="icon" disabled={saved.busy} aria-label={`Remove ${title}`} onClick={() => { setDeleting(item); setError(''); }}><Trash2 className="size-4 text-muted-foreground" /></Button>
            <Button variant="outline" size="sm" disabled={!route || saved.busy || !onOpen} aria-label={`View ${title} on map`} onClick={() => onOpen(item)}>Map<ArrowRight className="size-3.5" /></Button>
          </div>
        </li>;
      })}</ul>}
    <Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open && !saved.busy) setEditor(null); }}>
      <DialogContent className="commuter-shell max-h-[90dvh] overflow-y-auto sm:max-w-lg" onCloseAutoFocus={(event) => { event.preventDefault(); (opener.current?.isConnected && !opener.current.disabled ? opener.current : addButton.current)?.focus(); }} onEscapeKeyDown={(event) => { if (saved.busy) event.preventDefault(); }} onInteractOutside={(event) => { if (saved.busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>{editor?.id ? 'Edit saved route' : 'Save a route'}</DialogTitle><DialogDescription>Choose a direction and add any boarding notes.</DialogDescription></DialogHeader>
        {editor && <form onSubmit={submit}><fieldset disabled={saved.busy} className="space-y-5 py-2">
          <div><Label htmlFor="saved-route">Route</Label><select id="saved-route" required disabled={Boolean(editor.id)} value={editor.routeId} onChange={(event) => setEditor({ ...editor, routeId: event.target.value })} className={selectClass}>{(editor.id ? ROUTES.filter((route) => route.id === editor.routeId) : available).map((route) => <option key={route.id} value={route.id}>{routePairLabel(route)}</option>)}</select></div>
          <div><Label htmlFor="saved-name">Name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="saved-name" className="mt-2" maxLength={60} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="e.g. Trip to school" /></div>
          <div><Label htmlFor="saved-direction">Travel direction</Label><select id="saved-direction" className={selectClass} value={editor.direction} onChange={(event) => setEditor({ ...editor, direction: event.target.value })}><option value="forward">{routeLabel(getRoute(editor.routeId), 'forward')}</option><option value="reverse">{routeLabel(getRoute(editor.routeId), 'reverse')}</option></select></div>
          <div><Label htmlFor="saved-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="saved-notes" className="mt-2" rows={3} maxLength={300} value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} placeholder="Boarding point or reminders" /></div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button type="submit">{saved.busy ? 'Saving…' : 'Save route'}</Button></DialogFooter>
        </fieldset></form>}
      </DialogContent>
    </Dialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !saved.busy) setDeleting(null); }}><AlertDialogContent className="commuter-shell"><AlertDialogHeader><AlertDialogTitle>Remove saved route?</AlertDialogTitle><AlertDialogDescription>This removes your bookmark and its notes. You can save the route again later.</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={saved.busy}>Keep route</AlertDialogCancel><AlertDialogAction disabled={saved.busy} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); remove(); }}>{saved.busy ? 'Removing…' : 'Remove'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
