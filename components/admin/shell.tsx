import type { ReactNode } from 'react';
import type { AdminUser } from '@/components/admin/api';
import { Icon, type IconName } from '@/components/admin/ui';

// The frame of every admin page: the approved left sidebar (Dashboard, Applications, Book a Viewing, ...) and the page beside it.

export type View = 'dashboard' | 'applications' | 'bookings';

interface Item { id: string; label: string; icon: IconName; view?: View; allowed: boolean }

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', manager: 'Manager', agent: 'Agent' };
export const roleLabel = (u: AdminUser) => ROLE_LABEL[u.id] ?? (u.role === 'agent' ? 'Agent' : 'Admin');

/** "Welcome, Marielle" for the manager, "Welcome, Andrea" for the admin, "Welcome, Agent" for every agent (for now). */
export const welcomeName = (u: AdminUser) => (u.id === 'agent' || u.role === 'agent' ? 'Agent' : u.name);

export function AdminShell({ user, view, onNavigate, onSignOut, space, children }: { user: AdminUser; view: View; onNavigate: (v: View) => void; onSignOut: () => void; space: string; children: ReactNode }) {
  const p = user.permissions;
  const items: Item[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', view: 'dashboard', allowed: p.dashboard },
    { id: 'applications', label: 'Applications', icon: 'file', view: 'applications', allowed: p.applications },
    { id: 'bookings', label: 'Book a Viewing', icon: 'calendar', view: 'bookings', allowed: p.bookings },
    // Not built yet: shown so the menu is the approved one, but they do nothing.
    { id: 'team', label: 'Team Management', icon: 'users', allowed: false },
    { id: 'notifications', label: 'Notifications', icon: 'bell', allowed: false },
    { id: 'settings', label: 'Settings', icon: 'gear', allowed: false },
  ];
  const shown = items.filter((i) => i.allowed || !i.view);

  const link = (i: Item, compact = false) => {
    const on = i.view === view;
    const base = compact ? 'h-10 shrink-0 px-4 text-[14px]' : 'h-[52px] w-full px-4 text-[16px]';
    if (!i.view) {
      return (
        <span key={i.id} title="Coming soon" className={`${base} flex cursor-not-allowed items-center gap-3 rounded-xl text-white/35`}>
          <Icon name={i.icon} size={22} />{i.label}
          {!compact && <span className="ml-auto rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider">Soon</span>}
        </span>
      );
    }
    return (
      <button
        key={i.id}
        aria-current={on ? 'page' : undefined}
        onClick={() => onNavigate(i.view!)}
        className={`${base} flex items-center gap-3 rounded-xl border text-left font-medium transition ${on ? 'border-gold-soft/60 bg-[linear-gradient(100deg,#b88a35,#e8c473_50%,#c79a3f)] text-[#141414] shadow-[0_0_24px_rgba(242,182,60,0.25)]' : 'border-transparent text-white hover:bg-gold/10'}`}
      >
        <Icon name={i.icon} size={22} />{i.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="relative hidden border-r border-gold/20 bg-[linear-gradient(180deg,#0c0c0c,#040404)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col" aria-label="Admin menu">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(242,182,60,0.16),transparent_28%)]" />
        <div className="relative flex flex-col items-center px-5 pb-5 pt-7">
          <img src="/assets/img/ph-badge-512.png" alt="PHIRST.HOMES" width={132} height={132} className="size-[132px] rounded-full" />
          <p className="m-0 mt-2 text-[14px] tracking-wide text-white/90">www.phirst.homes</p>
        </div>
        <nav className="relative grid gap-1.5 px-3">{shown.map((i) => link(i))}</nav>
        <div className="relative mt-auto border-t border-gold/20 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,#c2933a,#ecca7c)] text-[20px] font-bold text-[#141414]">{welcomeName(user).slice(0, 1)}</span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[15px] font-semibold">{user.name}</p>
              <p className="m-0 text-[13px] text-white/60">{roleLabel(user)}</p>
            </div>
          </div>
          <button onClick={onSignOut} className="flex h-10 w-full items-center gap-3 rounded-lg px-2 text-[15px] text-white/90 hover:bg-gold/10"><Icon name="logout" size={22} />Log Out</button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Phone and tablet top bar: the same menu, laid out in a row */}
        <header className="border-b border-gold/20 bg-[#0a0a0a] lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <img src="/assets/img/ph-badge-512.png" alt="PHIRST.HOMES" width={44} height={44} className="size-11 rounded-full" />
            <span className="mr-auto text-[14px] font-semibold">{user.name} · {roleLabel(user)}</span>
            <button onClick={onSignOut} className="flex h-9 items-center gap-2 rounded-full border border-[#d9b35f]/60 px-4 text-[13px]"><Icon name="logout" size={16} />Log Out</button>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3" aria-label="Admin menu">{shown.filter((i) => i.view).map((i) => link(i, true))}</nav>
        </header>

        <main className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-[60%] bg-[radial-gradient(ellipse_at_top_right,rgba(242,182,60,0.13),transparent_65%)]" />
          <div className="relative grid gap-6">
            {space === 'preview' && <p className="m-0 w-fit rounded-full border border-gold/60 px-3 py-1 text-[12px] font-bold text-gold-soft">PREVIEW DATA (not live)</p>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
