import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';


const ROLES = [
  {
    id: 'commuter',
    title: 'Commuter',
    blurb: 'Track Jeepney and view routes.',
    avatar: '/avatar/commuter.webp',
    to: '/login',
  },
  {
    id: 'driver',
    title: 'Jeepney Driver',
    blurb: 'Manage your jeepney and location',
    avatar: '/avatar/driver.webp',
    to: '/driver',
  },
];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const go = (id) => {
    const role = ROLES.find((r) => r.id === id);
    if (role) navigate(role.to);
  };

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fffdf9 52%, #fff4e6 100%)' }}
    >
      <div className="flex min-h-full flex-col">
        {/* Same header as the landing page, so the logo does not jump when you
            arrive here from it. */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/">
            <img
              src="/logo/logo-larga-for_LIGHT.png"
              alt="Larga"
              className="h-14 object-contain sm:h-20"
            />
          </Link>
          <Link
            to="/"
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

        <main className="flex flex-1 items-center justify-center px-6 py-10 lg:py-16">
          <div className="w-full max-w-4xl text-center">
            <h1 className="font-heading text-4xl text-black sm:text-5xl">Let&rsquo;s get started!</h1>
            <p className="font-regular mt-3 text-lg text-gray-600">
              Tell us how you&rsquo;ll be using Larga
            </p>


            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedRole(role.id)}
                    onDoubleClick={() => go(role.id)}
                    className={`relative rounded-3xl border-2 p-8 text-center transition-all
                                duration-150 ${
                                  isSelected
                                    ? 'border-primary bg-orange-50 shadow-lg shadow-primary/10'
                                    : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
                                }`}
                  >
                    <span
                      className={`absolute right-5 top-5 flex h-7 w-7 items-center justify-center
                                  rounded-full border-2 transition-colors ${
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-gray-200 bg-white'
                                  }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                    </span>

                    <img
                      src={role.avatar}
                      alt=""
                      width={112}
                      height={112}
                      className="mx-auto h-28 w-28 object-contain"
                    />
                    <h2 className="font-heading mt-5 text-2xl text-black">{role.title}</h2>
                    <p className="font-regular mt-2 text-base leading-6 text-gray-600">
                      {role.blurb}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Sized to its content and centred, rather than a full-width bar
                shoved to the bottom of the viewport by a flex spacer. */}
            <button
              type="button"
              onClick={() => go(selectedRole)}
              disabled={!selectedRole}
              className="font-accent mt-10 inline-flex items-center justify-center gap-2 rounded-full
                         bg-primary px-14 py-4 text-lg text-white shadow-lg shadow-primary/30
                         transition-all hover:scale-[1.02] active:scale-100
                         disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none
                         disabled:hover:scale-100"
            >
              Continue
              <ArrowRight size={20} color="#ffffff" />
            </button>

            {/* Follows the selected role — sending a driver to the commuter form
                was the reason there appeared to be no way to register as one. */}
            <p className="font-regular mt-6 text-sm text-gray-600">
              Don&rsquo;t have an account?{' '}
              <Link
                to={selectedRole === 'driver' ? '/driver/signup' : '/signup'}
                className="font-accent text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
