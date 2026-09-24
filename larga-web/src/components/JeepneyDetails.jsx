import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getRoute, routeLabel } from '../constants/routes';
import { seatAvailability } from '../utils/seatAvailability';

export default function JeepneyDetails({ driver, onClose }) {
  const backRef = useRef(null);
  const route = getRoute(driver.routeId);
  const seats = seatAvailability(driver);
  useEffect(() => { backRef.current?.focus(); }, [driver.id]);
  return <section aria-label="Jeepney details" className="min-h-0 overflow-y-auto" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
    <button ref={backRef} type="button" onClick={onClose} className="font-accent mb-3 flex min-h-11 items-center gap-2 text-sm text-gray-600"><ArrowLeft size={18} /> Nearby jeepneys</button>
    <p className={`font-accent text-xs ${seats.full ? 'text-red-600' : 'text-primary'}`} role="status">{seats.full ? 'Full · No seats available' : 'On the road'}</p>
    <h2 className="font-heading mt-1 text-2xl text-black">{driver.jeepneyNumber || 'Plate unavailable'}</h2>
    <p className="font-regular mt-1 text-sm text-gray-600">{route ? `${route.code} · ${routeLabel(route, driver.direction)}` : 'Route not set'}</p>
    <dl className="my-5 grid grid-cols-2 divide-x divide-gray-200 border-y border-gray-200 py-4">
      <div className="pr-3"><dt className="font-regular text-xs text-gray-500">Seats left</dt><dd className={`font-heading mt-1 text-3xl ${seats.full ? 'text-red-600' : 'text-black'}`}>{seats.left ?? '—'}</dd><p className="font-regular text-xs text-gray-500">{seats.capacity ? `of ${seats.capacity} seats` : 'Capacity unavailable'}</p></div>
      <div className="pl-4"><dt className="font-regular text-xs text-gray-500">Route fare</dt><dd className="font-heading mt-1 text-3xl text-black">{route?.fare != null ? `₱${route.fare}` : '—'}</dd><p className="font-regular text-xs text-gray-500">End-to-end · per person</p></div>
    </dl>
    <div className="font-regular flex justify-between gap-3 text-sm"><span className="text-gray-500">Passengers aboard</span><span>{seats.passengers ?? 'Not reported'}</span></div>
    <p className="font-regular mt-4 text-xs text-gray-500">{seats.left === null ? 'Seat availability has not been reported.' : 'Seat counts update live as the driver reports them.'}</p>
  </section>;
}
