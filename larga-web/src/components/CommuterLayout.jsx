import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, LogOut, Map, PanelLeftClose, PanelLeftOpen, Route, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

const TABS = [{ to: '/map', label: 'Map', Icon: Map }, { to: '/routes', label: 'Routes', Icon: Route }, { to: '/saved-routes', label: 'Saved', Icon: Bookmark }, { to: '/alerts', label: 'Alerts', Icon: Bell }, { to: '/profile', label: 'Profile', Icon: User }];
function readCollapsed() { try { return localStorage.getItem('larga:sidebar-collapsed') === '1'; } catch { return false; } }

export default function CommuterLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  function toggle() { setCollapsed((value) => { try { localStorage.setItem('larga:sidebar-collapsed', value ? '0' : '1'); } catch { /* Optional preference. */ } return !value; }); }
  async function leave() { setLeaving(true); setError(''); try { if (user) await logOut(); navigate('/', { replace: true }); } catch { setError('Could not sign out. Try again.'); setLeaving(false); } }
  return <TooltipProvider><div className="commuter-shell flex h-full w-full flex-col md:flex-row">
    <nav aria-label="Main navigation" className={cn('order-2 flex shrink-0 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:order-1 md:flex-col md:border-r md:border-t-0 md:bg-zinc-50/60 md:p-3', collapsed ? 'md:w-[72px]' : 'md:w-52')}>
      <div className="hidden h-16 items-center justify-between px-2 md:flex"><img src={collapsed ? '/logo/logo-larga-short.png' : '/logo/logo-larga-for_LIGHT.png'} alt="Larga" className={collapsed ? 'mx-auto size-9 object-contain' : 'h-8 w-auto object-contain'} />{!collapsed && <Button variant="ghost" size="icon" onClick={toggle} aria-label="Collapse sidebar" aria-expanded={!collapsed}><PanelLeftClose className="size-4 text-muted-foreground" /></Button>}</div>
      {collapsed && <Button variant="ghost" size="icon" className="mx-auto mb-3 hidden md:inline-flex" onClick={toggle} aria-label="Expand sidebar" aria-expanded={!collapsed}><PanelLeftOpen className="size-4" /></Button>}
      <div className="hidden px-3 pb-3 pt-4 text-[11px] font-medium text-muted-foreground md:block">{!collapsed && 'COMMUTE'}</div>
      {TABS.map(({ to, label, Icon }) => <Tooltip key={to}><TooltipTrigger asChild><NavLink to={to} aria-label={label === 'Saved' ? 'Saved routes' : label} className={({ isActive }) => cn('flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors md:mb-1 md:min-h-10 md:flex-none md:flex-row md:gap-3 md:rounded-md md:text-sm', collapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-3', isActive ? 'text-primary-dark md:bg-orange-100/60' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="size-[19px] shrink-0" strokeWidth={1.8} /><span className={collapsed ? 'md:hidden' : ''}>{label}</span></NavLink></TooltipTrigger>{collapsed && <TooltipContent side="right" className="hidden md:block">{label}</TooltipContent>}</Tooltip>)}
      <div className="mt-auto hidden pt-5 md:block"><Separator /><div className={cn('flex items-center gap-2.5 py-4', collapsed ? 'justify-center' : 'px-2')}><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold">{profile?.name?.trim()?.slice(0, 1)?.toUpperCase() || <User className="size-4" />}</span>{!collapsed && <div className="min-w-0"><p className="truncate text-xs font-medium">{profile?.name || 'Guest commuter'}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user ? user.email : 'Saved on this device'}</p></div>}</div><Button variant="ghost" disabled={leaving} onClick={leave} aria-label={user ? 'Sign out' : 'Back to start'} className={cn('w-full text-muted-foreground', collapsed ? 'px-0' : 'justify-start')}><LogOut className="size-4" />{!collapsed && (leaving ? 'Leaving…' : user ? 'Sign out' : 'Back to start')}</Button>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</div>
    </nav>
    <main className="relative order-1 min-h-0 min-w-0 flex-1 md:order-2"><Outlet /></main>
  </div></TooltipProvider>;
}
