import type { MouseEvent, ReactNode } from 'react';
import '@fontsource-variable/manrope';
import '@/components/admin/glass.css';
import type { AdminUser } from '@/components/admin/api';
import { Icon, type IconName } from '@/components/admin/ui';

// The frame of every admin page, in the glass look: a floating top bar, a dock menu (left side on a computer,
// along the bottom on a phone) and the page inside a frosted panel over a photo of the community.

export type View = 'dashboard' | 'applications' | 'bookings';

interface Item { id: string; label: string; short: string; icon: IconName; view?: View; allowed: boolean }

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', manager: 'Manager', agent: 'Agent' };
export const roleLabel = (u: AdminUser) => ROLE_LABEL[u.id] ?? (u.role === 'agent' ? 'Agent' : 'Admin');

/** "Welcome, Marielle" for the manager, "Welcome, Andrea" for the admin, "Welcome, Agent" for every agent (for now). */
export const welcomeName = (u: AdminUser) => (u.id === 'agent' || u.role === 'agent' ? 'Agent' : u.name);

const BACKGROUND = '/assets/img/hero/sales-pavilion-night.webp';

export function AdminShell({ user, view, onNavigate, onSignOut, space, children }: { user: AdminUser; view: View; onNavigate: (v: View) => void; onSignOut: () => void; space: string; children: ReactNode }) {
  const p = user.permissions;
  const items: Item[] = [
    { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'dashboard', view: 'dashboard', allowed: p.dashboard },
    { id: 'applications', label: 'Applications', short: 'Apps', icon: 'file', view: 'applications', allowed: p.applications },
    { id: 'bookings', label: 'Book a Viewing', short: 'Viewings', icon: 'calendar', view: 'bookings', allowed: p.bookings },
    // Not built yet: shown so the menu is the approved one, but they do nothing.
    { id: 'team', label: 'Team Management', short: 'Team', icon: 'users', allowed: false },
    { id: 'notifications', label: 'Notifications', short: 'Alerts', icon: 'bell', allowed: false },
    { id: 'settings', label: 'Settings', short: 'Settings', icon: 'gear', allowed: false },
  ];
  const shown = items.filter((i) => i.allowed || !i.view);

  const go = (e: MouseEvent, v: View) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    onNavigate(v);
  };

  const dock = (side: boolean) => (
    <nav className={side ? 'gd-dock gd-dock-side' : 'gd-dock gd-dock-bottom'} aria-label={side ? 'Admin menu' : 'Admin views'}>
      {shown.map((i) =>
        i.view ? (
          <a key={i.id} href={i.view === 'dashboard' ? '/admin' : `/admin?view=${i.view}`} aria-label={i.label} aria-current={i.view === view ? 'page' : undefined} onClick={(e) => go(e, i.view!)}>
            <Icon name={i.icon} size={17} />
            <span className="gd-dock-short" aria-hidden="true">{i.short}</span>
            {side && <span className="gd-dock-tip" aria-hidden="true">{i.label}</span>}
          </a>
        ) : (
          <span key={i.id} className="gd-dock-off" role="img" aria-label={`${i.label} (coming soon)`}>
            <Icon name={i.icon} size={17} />
            {side && <span className="gd-dock-tip" aria-hidden="true">{i.label} · Soon</span>}
          </span>
        ),
      )}
    </nav>
  );

  return (
    <div className="gd-app" data-theme="dark">
      <img className="gd-background" src={BACKGROUND} alt="" aria-hidden="true" fetchPriority="high" />
      <div className="gd-surround">
        <header className="gd-top">
          <div className="gd-brand">
            <img className="gd-logo" src="/assets/img/ph-badge-512.png" alt="" width={40} height={40} />
            <div><strong>PHIRST.HOMES</strong><small>www.phirst.homes</small></div>
          </div>
          {space === 'preview' ? <span className="gd-badge">PREVIEW DATA (not live)</span> : <span />}
          <div className="gd-top-actions">
            <div className="gd-user">
              <span className="gd-avatar" aria-hidden="true">{welcomeName(user).slice(0, 1)}</span>
              <div><strong>{user.name}</strong><small>{roleLabel(user)}</small></div>
            </div>
            <button type="button" className="gd-icon-button" aria-label="Log Out" title="Log Out" onClick={onSignOut}><Icon name="logout" size={17} /></button>
          </div>
        </header>

        <div className="gd-stage-wrap">
          {dock(true)}
          <main className="gd-stage">
            <div className="gd-stage-scroll">
              <div className="gd-content">{children}</div>
            </div>
          </main>
          {dock(false)}
        </div>
      </div>
    </div>
  );
}
