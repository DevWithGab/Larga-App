import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ROUTES, TOWN_COORDS, routePairLabel } from '../constants/routes';

const TOWNS = Object.keys(TOWN_COORDS);

export default function SplashPage() {
  return (
    <div className="landing-page h-full w-full overflow-y-auto bg-[#fffaf4] text-[#291608]">
      <div className="flex min-h-full flex-col">
        <header className="border-b border-orange-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-12">
            <Link to="/" aria-label="Larga home" className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-primary">
              <img src="/logo/logo-larga-for_LIGHT.png" alt="Larga" width="132" height="44" className="h-10 w-auto sm:h-11" />
            </Link>
            <Button asChild variant="ghost" className="text-sm text-[#291608] hover:bg-orange-50">
              <Link to="/driver">Driver sign in<ArrowUpRight className="size-4" /></Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section aria-labelledby="welcome-title" className="border-b border-orange-200 bg-primary">
            <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.05fr_1fr]">
              <div className="flex flex-col items-start px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
                <p className="text-xs font-semibold uppercase tracking-widest">Jeepney tracking · Nueva Vizcaya</p>
                <h1 id="welcome-title" className="font-display mt-6 text-6xl leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.5rem]">
                  Find your<br />jeepney.
                </h1>
                <p className="mt-6 max-w-sm text-base leading-7 text-[#4d2c13] sm:text-lg">
                  Live locations and route fares along the {TOWNS[0]}–{TOWNS[TOWNS.length - 1]} corridor.
                </p>
                <Button asChild size="lg" className="mt-8 h-12 rounded-lg bg-[#291608] px-6 text-base text-white hover:bg-[#46270f]">
                  <Link to="/map">Open live map<ArrowRight className="size-5" /></Link>
                </Button>
                <p className="mt-4 text-xs text-[#4d2c13]">No account needed.</p>
              </div>

              <section aria-labelledby="choose-route" className="border-t border-[#291608]/15 bg-[#fffaf4] px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-12">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h2 id="choose-route" className="text-lg font-semibold">Choose your route</h2>
                  <span className="text-xs text-[#785638]">{ROUTES.length} routes</span>
                </div>
                <ul className="border-y border-orange-200">
                  {ROUTES.map((route) => (
                    <li key={route.id} className="border-b border-orange-200 last:border-0">
                      <Link to="/map" state={{ filter: route.id }} aria-label={`View ${routePairLabel(route)}, fare ₱${route.fare}, on the map`}
                        className="group grid min-h-20 grid-cols-[28px_minmax(0,1fr)_auto_16px] items-center gap-3 rounded-sm py-4 transition-colors hover:bg-orange-100/70 focus-visible:outline-2 focus-visible:outline-primary sm:gap-4">
                        <span className="text-xs font-semibold tabular-nums text-[#9b4a0b]">{route.code}</span>
                        <span className="min-w-0"><span className="block text-sm font-semibold leading-6">{routePairLabel(route)}</span><span className="mt-0.5 block text-xs text-[#785638]">Both directions</span></span>
                        <span className="text-sm font-semibold tabular-nums">₱{route.fare}</span>
                        <ArrowRight aria-hidden="true" className="size-4 text-[#9b4a0b] transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-5 text-[#785638]">Fares are per person, one way, end to end.</p>
              </section>
            </div>
          </section>

          <section aria-labelledby="service-area" className="mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-x-12 gap-y-6 px-5 py-8 sm:px-8 lg:px-12">
            <div><h2 id="service-area" className="text-xs font-semibold uppercase tracking-wider text-[#785638]">Service area</h2><p className="mt-2 text-sm leading-7">{TOWNS.join(' / ')}</p></div>
            <div className="max-w-xs"><h2 className="text-sm font-semibold">Driving today?</h2><p className="mt-2 text-sm leading-6 text-[#785638]">Share your location from the Larga mobile app. View your trip reports here.</p><Link to="/driver" className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline decoration-orange-300 underline-offset-4 hover:decoration-[#291608]">Driver sign in<ArrowUpRight className="size-4" /></Link></div>
          </section>
        </main>

        <footer className="border-t border-orange-200"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-[#785638] sm:px-8 lg:px-12"><p>Larga · Nueva Vizcaya, Philippines</p><p>Live locations depend on drivers broadcasting.</p></div></footer>
      </div>
    </div>
  );
}
