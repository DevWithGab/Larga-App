import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, LogOut, Map, PanelLeftClose, PanelLeftOpen, Route, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const TABS = [
  { to: '/map', label: 'Map', Icon: Map },
  { to: '/routes', label: 'Routes', Icon: Route },
  { to: '/saved-routes', label: 'Saved Routes', Icon: Bookmark },
  { to: '/alerts', label: 'Alerts', Icon: Bell },
  { to: '/profile', label: 'Profile', Icon: User },
];

const STORAGE_KEY = 'larga:sidebar-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Private mode or blocked site data — the rail just always starts open.
    return false;
  }
}

export default function CommuterLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();

  const toggleCollapsed = () =>
    setCollapsed((isCollapsed) => {
      const next = !isCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* not worth telling anyone about */
      }
      return next;
    });

  const handleLogOut = async () => {
    if (user) await logOut();
    // Without this the router would land on the splash anyway once `user`
    // clears, but asking explicitly avoids a frame of the commuter shell
    // rendering with nobody signed in.
    navigate('/', { replace: true });
  };

  const tabClasses = ({ isActive }) =>
    [
      'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
      'md:flex-none md:flex-row md:gap-3 md:rounded-xl md:py-2.5',
      collapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-4',
      isActive
        ? 'text-primary md:bg-orange-50'
        : 'text-gray-500 hover:text-black md:hover:bg-gray-50',
    ].join(' ');

  const collapseButton = (
    <button
      type="button"
      onClick={toggleCollapsed}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400
                 transition-colors hover:bg-gray-100 hover:text-black"
    >
      {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
    </button>
  );

  const collapsedMark = (
    <img
      src="/logo/logo-larga-short.png"
      alt="Larga"
      className="h-10 w-10 shrink-0 object-contain"
    />
  );
  const avatar = (
    <img
      src="/avatar/commuter.webp"
      alt=""
      className="h-9 w-9 shrink-0 rounded-full bg-orange-50 object-contain"
    />
  );

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <nav
        className={`order-2 flex shrink-0 border-t border-gray-100 bg-white transition-[width]
                    duration-200 md:order-1 md:flex-col md:justify-start md:gap-1 md:overflow-y-auto
                    md:border-r md:border-t-0 md:p-3 ${collapsed ? 'md:w-20' : 'md:w-60'}`}
      >
        {/* The full wordmark when there's room, the cropped lockup when there
            isn't. */}
        <div className="hidden md:block md:px-1 md:pb-5 md:pt-2">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {collapsed ? (
              collapsedMark
            ) : (
              <>
                <img
                  src="/logo/logo-larga-for_LIGHT.png"
                  alt="Larga"
                  className="ml-1 h-9 object-contain"
                />
                {collapseButton}
              </>
            )}
          </div>
          {/* Collapsed, the mark and the toggle stack — side by side they
              wouldn't fit in the narrow rail. */}
          {collapsed && <div className="mt-3 flex justify-center">{collapseButton}</div>}
        </div>

        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={tabClasses} aria-label={label} title={collapsed ? label : undefined}>
            {({ isActive }) => (
              <>
                {/* A bar against the rail's edge, so which tab you're on reads
                    at a glance even when the labels are hidden. */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2
                               rounded-r-full bg-primary md:block"
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                <span
                  className={`font-accent text-[11px] md:text-sm ${collapsed ? 'md:hidden' : ''}`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* mt-auto pins this to the foot of the rail, however tall it is. */}
        <div className="hidden md:mt-auto md:block md:pt-4">
          <div className="border-t border-gray-100 pt-3">
            {collapsed ? (
              <div className="mb-1 flex justify-center" title={profile?.name ?? user?.email ?? ''}>
                {avatar}
              </div>
            ) : (
              <div className="mb-1 flex items-center gap-3 px-2 py-1">
                {avatar}
                <div className="min-w-0">
                  <p className="font-accent truncate text-sm text-black">
                    {profile?.name ?? 'Commuter'}
                  </p>
                  <p className="font-regular truncate text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogOut}
              title={collapsed ? (user ? 'Log out' : 'Back to start') : undefined}
              className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-gray-500
                          transition-colors hover:bg-red-50 hover:text-red-600
                          ${collapsed ? 'justify-center px-0' : 'px-4'}`}
            >
              <LogOut size={22} strokeWidth={2} />
              {!collapsed && <span className="font-accent text-sm">{user ? 'Log out' : 'Back to start'}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="order-1 relative min-h-0 flex-1 md:order-2">
        <Outlet />
      </main>
    </div>
  );
}
