import { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
export const LOCATION_REMINDER_KEY = 'larga:hide-location-reminder';

export default function LocationPrompt({ status, onEnable }) {
  const dialog = useRef(null);
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(LOCATION_REMINDER_KEY) === '1'; } catch { return false; }
  });
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    if (!hidden && status !== 'granted') dialog.current?.showModal();
    else dialog.current?.close();
  }, [hidden, status]);
  const dismiss = () => { setHidden(true); dialog.current?.close(); };
  const forget = () => {
    try { localStorage.setItem(LOCATION_REMINDER_KEY, '1'); dismiss(); }
    catch { setStorageError('Your browser could not save this preference. You can still close this card.'); }
  };
  return (
    <dialog ref={dialog} onCancel={dismiss} aria-labelledby="location-title"
      className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-black shadow-xl backdrop:bg-black/30">
      <div className="mb-5 flex items-center justify-between">
        <MapPin size={26} className="text-primary" aria-hidden="true" />
        <button onClick={dismiss} aria-label="Close location reminder" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100"><X size={20} /></button>
      </div>
      <p className="font-accent text-xs uppercase tracking-widest text-gray-500">Before you ride</p>
      <h2 id="location-title" className="font-heading mt-1 text-3xl">Find your nearest ride.</h2>
      <p className="font-regular mt-2 text-base leading-6 text-gray-600">Turn on location to see yourself on the map and estimate how far away a jeepney is. You can still browse without it.</p>
      {status === 'denied' && <p role="status" className="mt-3 text-sm text-gray-700">Location is blocked. Allow location in your browser's site settings, then try again.</p>}
      {status === 'unavailable' && <p role="status" className="mt-3 text-sm text-gray-700">Turn on your device's location services, then try again.</p>}
      {storageError && <p role="alert" className="mt-3 text-sm text-red-700">{storageError}</p>}
      <button onClick={onEnable} className="font-accent mt-6 min-h-12 w-full rounded-full bg-primary px-4 py-3 text-white">Turn on location</button>
      <div className="mt-2 flex justify-between gap-3">
        <button onClick={dismiss} className="font-accent min-h-11 px-2 text-sm text-gray-600">Not now</button>
        <button onClick={forget} className="font-accent min-h-11 px-2 text-sm text-gray-600">Don't show again</button>
      </div>
    </dialog>
  );
}
