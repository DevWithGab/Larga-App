import { useNavigate } from 'react-router-dom';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import SavedRoutesPanel from '../components/SavedRoutesPanel';
import { useSavedRoutes } from '../hooks/useSavedRoutes';

export default function SavedRoutesPage() {
  const saved = useSavedRoutes();
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto bg-[#f8f9fb] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-accent mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary-dark"><Bookmark size={14} /> Your collection</p>
            <h1 className="font-display text-4xl tracking-tight text-gray-950 sm:text-5xl">Saved Routes</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">Less searching. More going. Keep your everyday jeepney trips in one place.</p>
          </div>
          <button type="button" onClick={() => navigate('/routes')} className="font-accent flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 transition-colors hover:border-orange-200 hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Explore routes <ArrowUpRight size={17} />
          </button>
        </header>
        <SavedRoutesPanel saved={saved} onOpen={(item) => navigate('/map', {
          state: { filter: item.routeId, direction: item.direction === 'reverse' ? 'reverse' : 'forward' },
        })} />
      </div>
    </div>
  );
}
