import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Bus, MapPin, Radio } from 'lucide-react';
import { ROUTES, TOWN_COORDS } from '../constants/routes';

const FARES = ROUTES.map((route) => route.fare).filter((fare) => fare != null);
const TOWNS = Object.keys(TOWN_COORDS);


const FEATURES = [
  {
    Icon: Radio,
    label: 'Real-time\ntracking',
    title: 'Live, not scheduled',
    body: "Drivers share their GPS while they drive, so you see where the jeepney actually is — not where a timetable says it should be.",
  },
  {
    Icon: MapPin,
    label: `${ROUTES.length} real\nroutes`,
    title: `${ROUTES.length} real routes`,
    body: `Every route on the Santa Fe–Solano corridor, with the fare operators actually charge: ₱${Math.min(
      ...FARES
    )} to ₱${Math.max(...FARES)} end to end.`,
  },
  {
    Icon: Bell,
    label: 'Arrival\nalerts',
    title: 'Told before it arrives',
    body: 'Pick a jeepney and get an alert as it gets close, so waiting happens indoors instead of at the roadside.',
  },
];

export default function SplashPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-white">

      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #ffffff 0%, #fffdf9 52%, #fff4e6 100%)',
        }}
      >

        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 w-full sm:h-32"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 140 C 300 132, 520 54, 1440 18 L1440 140 Z" fill="#f57c1f" opacity="0.12" />
          <path d="M0 140 C 340 138, 600 86, 1440 62 L1440 140 Z" fill="#f57c1f" opacity="0.22" />
        </svg>

        <img
          src="/hero/right-visual-larga-new.png"
          width="1312"
          height="1199"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="hero-art-fade relative z-0 w-full lg:absolute lg:bottom-0 lg:right-0
                     lg:w-[60%]"
        />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <img
            src="/logo/logo-larga-for_LIGHT.png"
            alt="Larga"
            className="h-14 object-contain sm:h-20"
          />
          <Link
            to="/driver"
            className="font-accent rounded-full border border-primary/50 bg-white/70 px-6 py-2.5
                       text-sm text-black backdrop-blur-sm transition-colors hover:bg-primary
                       hover:text-white sm:text-base"
          >
            Driver sign in
          </Link>
        </header>

        {/* Hero copy. Capped well short of half the container on a wide screen:
            the artwork now starts at 40% of the window, and the copy has to end
            inside the artwork's faded left edge, not past it. Full width below
            lg, where the artwork has moved beneath it. */}
        <section
          className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 pt-6 lg:pb-32 lg:pt-10"
        >
          <div className="lg:w-[46%]">
            <span
              className="font-accent mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/80
                         px-4 py-1.5 text-sm text-primary shadow-sm shadow-orange-900/5 sm:mb-8"
            >
              <MapPin size={15} color="#f57c1f" />
              Nueva Vizcaya, Philippines
            </span>

            {/* Sizes and gaps in this column are taken from the design mockup,
                scaled by width (1536/1672 ≈ 0.92) rather than by height — the
                mockup is 16:9 and a browser window is not, so matching on
                height would shrink the type on every real screen.
                Negative tracking because Baloo 2 is drawn for UI sizes and
                spaces a little wide once it is this large. */}
            <h1
              className="font-heading text-[2.875rem] leading-[1.03] tracking-[-0.015em] text-black
                         sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
            >
              Never miss
              <br />
              your ride<span className="text-primary">.</span>
            </h1>

            <p
              className="font-regular mt-6 max-w-[34rem] text-lg leading-8 text-gray-600
                         sm:text-xl sm:leading-9"
            >
              Real-time jeepney tracking and route information along the {TOWNS[0]}–
              {TOWNS[TOWNS.length - 1]} corridor.
            </p>

            {/* Both roles get their own door, side by side — on a phone the app
                asks this on a separate screen, but a landing page has room. */}
            <div className="mt-9 flex flex-col gap-3.5 sm:flex-row">
              <Link
                to="/map"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-9 py-5
                           shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]
                           active:scale-100"
              >
                <span className="font-heading text-lg tracking-wide text-white">LARGA NA!</span>
                <ArrowRight size={22} color="#ffffff" />
              </Link>
              <Link
                to="/driver"
                className="font-accent flex items-center justify-center gap-2.5 rounded-full
                           border border-gray-200 bg-white px-9 py-5 text-base text-black
                           transition-colors hover:bg-gray-50"
              >
                <Bus size={20} color="#f57c1f" />
                I drive a jeepney
              </Link>
            </div>

            <p className="font-regular mt-7 text-sm text-gray-500">
              Free to use. No account needed to look around.
            </p>

            {/* The glance-level version of the three claims below the fold.
                A fixed three-column grid rather than a wrapping flex row: with
                flex-wrap, an item that wraps to a second line takes its divider
                with it and leaves a stray rule hanging at the start of the row. */}
            <div className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-orange-200 sm:mt-16">
              {FEATURES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 first:pl-0 last:pr-0 sm:gap-2.5 sm:px-5"
                >
                  <Icon size={18} color="#f57c1f" className="shrink-0" />
                  <span className="font-accent whitespace-pre-line text-sm leading-tight text-gray-700">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* What it actually does */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 md:grid-cols-3 lg:py-16">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title}>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
                <Icon size={20} color="#f57c1f" />
              </span>
              <h2 className="font-heading mb-1.5 text-lg text-black">{title}</h2>
              <p className="font-regular text-sm leading-6 text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-7xl px-6 py-8">
        <p className="font-accent text-sm text-gray-500">{TOWNS.join(' · ')}</p>
        <p className="font-regular mt-2 text-xs text-gray-400">
          Built for Filipino commuters. Map data © OpenStreetMap contributors.
        </p>
      </footer>
    </div>
  );
}
