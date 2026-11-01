import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, LogOut, Map, PanelLeftClose, PanelLeftOpen, Route, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

const TABS = [
  { to: '/map', label: 'Map', Icon: Map },
  { to: '/routes', label: 'Routes', Icon: Route },
  { to: '/saved-routes', label: 'Saved routes', mobileLabel: 'Saved', Icon: Bookmark },
  { to: '/alerts', label: 'Alerts', Icon: Bell },
  { to: '/profile', label: 'Profile', Icon: User },
];

function readCollapsed() {
  try { return localStorage.getItem('larga:sidebar-collapsed') === '1'; }
  catch { return false; }
}

export default function CommuterLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const { user, profile, logOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function toggle() {
    setCollapsed((value) => {
      try { localStorage.setItem('larga:sidebar-collapsed', value ? '0' : '1'); }
      catch { /* The sidebar still works without a saved preference. */ }
      return !value;
    });
  }

  async function leave() {
    setLeaving(true);
    setError('');
    try {
      if (user) await logOut();
      navigate('/', { replace: true });
    } catch {
      setError('Could not sign out. Try again.');
      setLeaving(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="commuter-shell flex h-full w-full overflow-hidden md:flex-row flex-col">
        <aside className={cn(
          'order-2 flex shrink-0 flex-col border-t border-orange-100 bg-white pb-[env(safe-area-inset-bottom)] md:order-1 md:h-full md:border-r md:border-t-0 md:pb-0',
          collapsed ? 'md:w-[88px]' : 'md:w-60'
        )}>
          <div className={cn('hidden shrink-0 border-b border-orange-100 bg-[#fff8f0] md:flex', collapsed ? 'flex-col items-center gap-3 px-3 py-5' : 'items-center justify-between gap-3 px-5 py-6')}>
            <img
              src={collapsed ? '/logo/logo-larga-short.png' : '/logo/logo-larga-for_LIGHT.png'}
              alt="Larga"
              className={collapsed ? 'size-11 object-contain' : 'h-10 w-28 object-contain'}
            />
            <Button variant="ghost" size="icon" onClick={toggle}
              className="shrink-0 text-primary-dark hover:bg-orange-100"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </Button>
          </div>

          <nav aria-label="Main navigation" className="grid grid-cols-5 gap-1 p-1.5 md:flex md:min-h-0 md:flex-1 md:flex-col md:gap-2 md:overflow-y-auto md:p-3">
            {!collapsed && <p className="hidden px-3 pb-1 pt-3 text-[11px] font-semibold tracking-wider text-primary-dark md:block">YOUR COMMUTE</p>}
            {TABS.map(({ to, label, mobileLabel, Icon }) => {
              // Radix Slot requires a class string here: a NavLink className
              // callback would be serialized instead of evaluated by the router.
              const active = pathname === to;
              return (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <NavLink to={to} aria-label={label} className={cn(
                      'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary md:min-h-12 md:shrink-0 md:flex-row md:gap-3 md:text-sm',
                      collapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-4',
                      active ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-orange-50 hover:text-primary-dark'
                    )}>
                      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
                      <span className="md:hidden">{mobileLabel || label}</span>
                      {!collapsed && <span className="hidden md:inline">{label}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right" className="hidden md:block">{label}</TooltipContent>}
                </Tooltip>
              );
            })}
          </nav>

          <div className="hidden shrink-0 px-3 pb-4 md:block">
            <Separator className="bg-orange-100" />
            <div className={cn('flex items-center gap-3 py-4', collapsed ? 'justify-center' : 'px-2')}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-semibold text-primary-dark">
                {profile?.name?.trim()?.slice(0, 1)?.toUpperCase() || <User className="size-5" />}
              </span>
              {!collapsed && <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile?.name || 'Guest commuter'}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">{user ? user.email : 'Saved on this device'}</p>
              </div>}
            </div>
            <Button variant="ghost" disabled={leaving} onClick={leave}
              aria-label={user ? 'Sign out' : 'Back to start'}
              className={cn('w-full text-gray-600 hover:bg-orange-50 hover:text-primary-dark', collapsed ? 'px-0' : 'justify-start px-3')}>
              <LogOut className="size-4" />
              {!collapsed && (leaving ? 'Leaving…' : user ? 'Sign out' : 'Back to start')}
            </Button>
            {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
          </div>
        </aside>
        <main className="relative order-1 min-h-0 min-w-0 flex-1 md:order-2"><Outlet /></main>
      </div>
    </TooltipProvider>
  );
}
