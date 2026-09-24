import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

export default function MapLegend() {
  const [expanded, setExpanded] = useState(false);
  return (
    <aside aria-label="Map legend" className="absolute left-4 top-32 z-10 w-44 rounded-2xl bg-white/95 p-3 shadow-lg shadow-black/10 backdrop-blur-sm md:bottom-9 md:left-auto md:right-4 md:top-auto">
      <button type="button" aria-expanded={expanded} aria-controls="map-legend-items"
        onClick={() => setExpanded(!expanded)}
        className="font-accent flex min-h-8 w-full items-center justify-between text-xs text-gray-800 md:hidden">
        Map legend
        <ChevronDown size={14} className={expanded ? 'rotate-180' : ''} />
      </button>
      <h2 className="font-accent mb-2 hidden text-xs text-gray-800 md:block">Map legend</h2>
      <div id="map-legend-items" className={`${expanded ? 'block' : 'hidden'} md:block`}>
        <ul className="font-regular space-y-2 text-[11px] text-gray-600">
          <li className="flex items-center gap-2"><span aria-hidden="true" className="w-6 border-t-4 border-dashed border-[#f57c1f]" />Route path</li>
          <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-orange-100"><img src="/larga-jeep/larga-jeep.png" alt="" className="h-5 w-5 object-contain" /></span>Online jeepney</li>
          <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-red-600 bg-red-100"><img src="/larga-jeep/larga-jeep.png" alt="" className="h-5 w-5 object-contain" /></span>Full jeepney</li>
          <li className="flex items-center gap-2"><MapPin aria-hidden="true" size={24} fill="#f57c1f" stroke="white" />Origin / Start</li>
          <li className="flex items-center gap-2"><MapPin aria-hidden="true" size={24} fill="#ef4444" stroke="white" />Destination / End</li>
          <li className="flex items-center gap-2"><span aria-hidden="true" className="flex w-6 justify-center"><span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow" /></span>Your location</li>
        </ul>
        <p className="font-regular mt-2 border-t border-gray-100 pt-2 text-[10px] text-gray-400">Offline jeepneys are hidden.</p>
      </div>
    </aside>
  );
}
