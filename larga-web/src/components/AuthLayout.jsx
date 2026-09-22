import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';


export const FIELD_LABEL = 'font-label mb-1.5 block text-sm text-black';
export const FIELD_WRAP =
  'flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 transition-colors ' +
  'focus-within:border-primary focus-within:bg-white';
export const FIELD_INPUT =
  'font-regular w-full bg-transparent px-3 py-3.5 text-base text-black outline-none ' +
  'placeholder:text-gray-400';
export const SUBMIT_BUTTON =
  'font-accent w-full rounded-full bg-primary py-4 text-lg text-white shadow-lg ' +
  'shadow-primary/30 transition-all hover:scale-[1.01] active:scale-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100';

export default function AuthLayout({
  badge,
  title,
  subtitle,
  backTo = '/',
  // Driver sign-up has six fields; at `xl` they pair up two to a row instead
  // of becoming a long scroll.
  width = 'md',
  children,
  footer,
  note,
}) {
  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fffdf9 52%, #fff4e6 100%)' }}
    >
      <div className="flex min-h-full flex-col">
        {/* Same header as the landing page and the role picker, so the logo
            keeps its size and position all the way through the funnel. */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/">
            <img
              src="/logo/logo-larga-for_LIGHT.png"
              alt="Larga"
              className="h-12 object-contain sm:h-16"
            />
          </Link>
          <Link
            to={backTo}
            className="font-accent group inline-flex items-center gap-1.5 rounded-full px-4 py-2
                       text-sm text-gray-600 transition-colors hover:bg-white/70 hover:text-black
                       sm:text-base"
          >
            <ArrowLeft
              size={18}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-6 lg:py-10">
          <div className={`w-full ${width === 'xl' ? 'max-w-xl' : 'max-w-md'}`}>
            <div
              className="rounded-3xl border border-gray-200/70 bg-white p-8 shadow-xl
                         shadow-orange-900/5 sm:p-10"
            >
              {badge && (
                <span
                  className="font-accent mb-5 inline-block rounded-full bg-orange-50 px-4 py-1.5
                             text-sm text-primary"
                >
                  {badge}
                </span>
              )}

              <h1 className="font-heading text-3xl text-black sm:text-4xl">{title}</h1>
              {subtitle && (
                <p className="font-regular mt-2 text-base text-gray-600">{subtitle}</p>
              )}

              <div className="mt-8">{children}</div>
            </div>

            {footer && (
              <p className="font-regular mt-6 text-center text-base text-gray-600">{footer}</p>
            )}

            {note && <div className="mt-6">{note}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
