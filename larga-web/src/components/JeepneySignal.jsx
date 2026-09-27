import { useEffect, useState } from 'react';
import { driverSignal } from '../utils/driverSignal';

export default function JeepneySignal({ driver }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  const signal = driverSignal(driver, now);
  return (
    <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
      <div role="status" className="font-accent flex items-center gap-2 text-xs" style={{ color: signal.color }}>
        <span aria-hidden="true" className="flex h-4 items-end gap-0.5">
          {[1, 2, 3, 4].map((bar) => <span key={bar} className="w-1 rounded-sm" style={{ height: 4 + bar * 3, backgroundColor: bar <= signal.bars ? signal.color : '#cbd5e1' }} />)}
        </span>
        Jeepney signal: {signal.label}
      </div>
      <p className="font-regular mt-1 text-xs text-gray-600">{signal.detail}</p>
      <p className="font-regular mt-0.5 text-[10px] text-gray-400">Estimated from driver check-ins.</p>
    </div>
  );
}
