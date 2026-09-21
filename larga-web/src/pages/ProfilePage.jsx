import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LogOut, Mail, Pencil, Smartphone, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { normalizeMobileNumber } from '../utils/phoneNumber';

const MAX_NAME = 60;
const buttonClass = 'font-accent inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50';
const inputClass = 'mt-2 min-h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50 sm:text-sm';

export default function ProfilePage() {
  const { user, profile, logOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  const startEditing = () => {
    // Seed once when editing starts so background profile updates don't erase drafts.
    setName(profile?.name ?? '');
    setPhoneNumber(profile?.phoneNumber ?? '');
    setError(null);
    setPhoneError(null);
    setSaved(false);
    setEditing(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    let normalizedPhone;
    try {
      normalizedPhone = normalizeMobileNumber(phoneNumber);
      setPhoneError(null);
    } catch (err) {
      setPhoneError(err.message);
      event.currentTarget.elements.phoneNumber.focus();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: trimmedName, phoneNumber: normalizedPhone });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await logOut();
      navigate('/', { replace: true });
    } catch {
      setSignOutError('Could not sign out. Please try again.');
      setSigningOut(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f8f9fb] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="font-accent mb-2 text-xs uppercase tracking-[0.16em] text-primary-dark">Your account</p>
          <h1 className="font-display text-4xl tracking-tight text-gray-950 sm:text-5xl">Profile</h1>
          <p className="mt-2 text-sm text-gray-500">Manage your personal details and contact information.</p>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside aria-label="Profile summary" className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-5 xl:flex-col xl:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-50 xl:h-24 xl:w-24">
                <img src="/avatar/commuter.webp" alt="" className="h-16 w-16 object-contain xl:h-20 xl:w-20" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading break-words text-2xl leading-tight text-gray-950">{profile?.name || 'Commuter'}</h2>
                <p className="mt-1 text-sm text-gray-500">Commuter account</p>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="font-accent mb-1 text-xs text-gray-500">Signed in as</p>
              <p className="break-all text-sm text-gray-800">{user?.email || 'Email unavailable'}</p>
            </div>
            <div className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-gray-500">
              <Smartphone aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              <p>Your profile and saved routes are shared with the Larga mobile app.</p>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <section aria-labelledby="personal-details-heading" className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5 sm:px-7 sm:py-6">
                <div>
                  <h2 id="personal-details-heading" className="font-heading text-xl text-gray-950">Personal details</h2>
                  <p className="mt-1 text-sm text-gray-500">Your name and the contact details on your account.</p>
                </div>
                {!editing && <button type="button" onClick={startEditing} disabled={signingOut} className={`${buttonClass} border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50`}><Pencil aria-hidden="true" size={15} />Edit details</button>}
              </div>

              {editing ? (
                <form onSubmit={handleSubmit}>
                  <fieldset disabled={saving || signingOut} className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">
                    <legend className="sr-only">Edit personal details</legend>
                    <label className="font-accent block text-sm text-gray-700">
                      Full name
                      <input type="text" autoComplete="name" required maxLength={MAX_NAME} className={`${inputClass} font-regular`} placeholder="Juan Dela Cruz" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
                    </label>
                    <label className="font-accent block text-sm text-gray-700">
                      Phone number <span className="font-regular text-xs text-gray-500">(optional)</span>
                      <input name="phoneNumber" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? 'phone-help phone-error' : 'phone-help'} className={`${inputClass} font-regular`} placeholder="0917 123 4567" value={phoneNumber} onChange={(event) => { setPhoneNumber(event.target.value); setPhoneError(null); }} onBlur={() => { try { normalizeMobileNumber(phoneNumber); setPhoneError(null); } catch (err) { setPhoneError(err.message); } }} />
                      <span id="phone-help" className="font-regular mt-2 block text-xs text-gray-500">Use 11 digits starting with 09, or +639 followed by 9 digits. Spaces and hyphens are allowed.</span>
                      {phoneError && <span id="phone-error" role="alert" className="font-regular mt-2 block text-xs text-red-700">{phoneError}</span>}
                    </label>
                    <div className="sm:col-span-2">
                      <p className="font-accent text-sm text-gray-700">Email address</p>
                      <p className="mt-2 flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-600"><Mail aria-hidden="true" size={16} className="mt-0.5 shrink-0" /><span className="min-w-0 break-all">{user?.email || 'Email unavailable'}</span></p>
                      <p className="mt-2 text-xs text-gray-500">Your sign-in email cannot be changed here.</p>
                    </div>
                    {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
                  </fieldset>
                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-5 py-4 sm:px-7">
                    <button type="button" onClick={() => { setEditing(false); setError(null); }} disabled={saving || signingOut} className={`${buttonClass} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Cancel</button>
                    <button type="submit" disabled={saving || signingOut} className={`${buttonClass} bg-gray-950 text-white hover:bg-gray-800`}><Check aria-hidden="true" size={16} />{saving ? 'Saving...' : 'Save changes'}</button>
                  </div>
                </form>
              ) : (
                <div className="p-5 sm:p-7">
                  <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="flex items-center gap-2 text-xs text-gray-500"><User aria-hidden="true" size={15} />Full name</dt>
                      <dd className="font-accent mt-2 break-words text-lg text-gray-950">{profile?.name || 'Not provided'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="flex items-center gap-2 text-xs text-gray-500"><Smartphone aria-hidden="true" size={15} />Phone number</dt>
                      <dd className={`mt-2 break-words text-lg ${profile?.phoneNumber ? 'font-accent text-gray-950' : 'text-gray-400'}`}>{profile?.phoneNumber || 'Not provided'}</dd>
                    </div>
                    <div className="min-w-0 border-t border-gray-100 pt-6 sm:col-span-2">
                      <dt className="flex items-center gap-2 text-xs text-gray-500"><Mail aria-hidden="true" size={15} />Email address</dt>
                      <dd className="font-accent mt-2 break-all text-lg text-gray-950">{user?.email || 'Not provided'}</dd>
                      <dd className="mt-1 text-xs text-gray-500">Used to sign in to your account.</dd>
                    </div>
                  </dl>
                  {saved && <p role="status" className="mt-6 flex items-center gap-2 text-sm text-green-700"><Check aria-hidden="true" size={16} />Your profile has been updated.</p>}
                </div>
              )}
            </section>

            <section aria-labelledby="session-heading" className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <h2 id="session-heading" className="font-heading text-lg text-gray-950">Account session</h2>
                  <p className="mt-1 text-sm text-gray-500">Sign out of Larga in this browser.</p>
                </div>
                <button type="button" onClick={handleLogOut} disabled={saving || signingOut} className={`${buttonClass} border border-gray-200 text-red-600 hover:border-red-200 hover:bg-red-50`}><LogOut aria-hidden="true" size={16} />{signingOut ? 'Signing out...' : 'Sign out'}</button>
              </div>
              {signOutError && <p role="alert" className="mt-4 text-sm text-red-700">{signOutError}</p>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
