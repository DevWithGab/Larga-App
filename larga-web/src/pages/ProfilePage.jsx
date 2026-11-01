import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, LogOut, Pencil, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { normalizeMobileNumber } from '../utils/phoneNumber';
import { Page, PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export default function ProfilePage() {
  const { user, profile, logOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [message, setMessage] = useState('');

  function edit() { setName(profile?.name || ''); setPhone(profile?.phoneNumber || ''); setError(''); setPhoneError(''); setMessage(''); setEditing(true); }
  async function submit(event) {
    event.preventDefault(); setError(''); setPhoneError('');
    if (!name.trim()) { setError('Enter your name.'); return; }
    let normalized;
    try { normalized = normalizeMobileNumber(phone); }
    catch (cause) { setPhoneError(cause.message); event.currentTarget.elements.phoneNumber.focus(); return; }
    setSaving(true);
    try { await updateProfile({ name: name.trim(), phoneNumber: normalized }); setEditing(false); setMessage('Your details have been updated.'); }
    catch (cause) { setError(cause.message); } finally { setSaving(false); }
  }
  async function leave() { setLeaving(true); setError(''); try { await logOut(); navigate('/', { replace: true }); } catch { setError('Could not sign out. Try again.'); setLeaving(false); } }

  return <Page><PageHeader title="Profile" description={user ? 'Manage your personal details.' : 'Your commuter preferences and account.'} />
    {!user ? <div className="max-w-2xl space-y-6">
      <Card className="gap-4 shadow-none"><CardHeader><div className="mb-2 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-muted"><User className="size-5 text-muted-foreground" /></span><CardTitle className="text-base">Browsing as a guest</CardTitle></div><CardDescription>You can track jeepneys and save routes without an account. Your bookmarks and notes stay in this browser.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild><Link to="/saved-routes">View saved routes</Link></Button><Button asChild variant="outline"><Link to="/map">Open map</Link></Button></CardContent></Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><div><h2 className="text-sm font-medium">Drive a jeepney?</h2><p className="mt-1 text-sm text-muted-foreground">Sign in to view your trip reports.</p></div><Button asChild variant="outline"><Link to="/driver">Driver sign in</Link></Button></div>
    </div> : <div className="max-w-2xl">
      <div className="mb-7 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full border border-border bg-muted text-base font-medium">{profile?.name?.trim()?.slice(0, 1)?.toUpperCase() || <User className="size-5" />}</span><div className="min-w-0"><p className="break-words text-sm font-semibold">{profile?.name || 'Commuter'}</p><p className="mt-1 text-xs text-muted-foreground">Commuter account</p></div></div>
      <Separator />
      <section aria-labelledby="personal-details" className="py-6">
        <div className="mb-6 flex items-center justify-between gap-4"><h2 id="personal-details" className="text-sm font-semibold">Personal details</h2>{!editing && <Button variant="outline" size="sm" disabled={leaving} onClick={edit}><Pencil className="size-3.5" />Edit</Button>}</div>
        {editing ? <form onSubmit={submit}><fieldset disabled={saving || leaving} className="space-y-5">
          <div><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" autoComplete="name" required maxLength={60} autoFocus className="mt-2" value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div><Label htmlFor="profile-phone">Phone number <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="profile-phone" name="phoneNumber" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} className="mt-2" placeholder="0917 123 4567" value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneError(''); }} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? 'profile-phone-help profile-phone-error' : 'profile-phone-help'} /><p id="profile-phone-help" className="mt-2 text-xs text-muted-foreground">Use an 11-digit mobile number starting with 09, or +639.</p>{phoneError && <p id="profile-phone-error" role="alert" className="mt-2 text-sm text-red-700">{phoneError}</p>}</div>
          <div><Label htmlFor="profile-email">Email address</Label><Input id="profile-email" type="email" readOnly value={user.email || ''} className="mt-2 bg-muted/40 text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Your sign-in email cannot be changed here.</p></div>
          <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => { setEditing(false); setError(''); }}>Cancel</Button><Button type="submit">{saving ? 'Saving…' : 'Save changes'}</Button></div>
        </fieldset></form> : <dl className="divide-y divide-border text-sm">{[['Full name', profile?.name || 'Not provided'], ['Phone number', profile?.phoneNumber || 'Not provided'], ['Email address', user.email || 'Not provided']].map(([label, value]) => <div key={label} className="grid gap-2 py-4 first:pt-0 sm:grid-cols-[160px_minmax(0,1fr)]"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>}
        {message && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-emerald-700"><Check className="size-4" />{message}</p>}
      </section>
      <Separator />
      <section className="flex flex-wrap items-center justify-between gap-4 py-6"><div><h2 className="text-sm font-semibold">Sign out</h2><p className="mt-1 text-sm text-muted-foreground">End your session in this browser.</p></div><Button variant="outline" disabled={saving || leaving} onClick={leave}><LogOut className="size-4" />{leaving ? 'Signing out…' : 'Sign out'}</Button></section>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>}
  </Page>;
}
