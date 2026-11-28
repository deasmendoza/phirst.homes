import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type AdminUser } from '@/components/admin/api';
import { ApplicationView } from '@/components/admin/application-view';
import { ApplicationsList } from '@/components/admin/applications-list';
import { BookingsList } from '@/components/admin/bookings-list';
import { Dashboard } from '@/components/admin/dashboard';
import { AdminShell, type View } from '@/components/admin/shell';

// /admin: the private page. Nothing is shown until someone signs in, and what they see depends on their role.
//   /admin                      the dashboard (every role)
//   /admin?view=applications    the applications table      /admin?application=<id>   one application
//   /admin?view=bookings        the tripping requests

const readRoute = () => {
  const q = new URLSearchParams(location.search);
  const view = q.get('view');
  return { application: q.get('application'), view: (view === 'applications' || view === 'bookings' ? view : 'dashboard') as View };
};
const go = (q: string) => history.pushState(null, '', `/admin${q}`);

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const [space, setSpace] = useState('');
  const [route, setRoute] = useState(readRoute);
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    document.title = 'Admin | PHIRST.HOMES';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';
    api<{ user: AdminUser; space: string }>('auth/session').then(
      (r) => { if (r.user) { setUser(r.user); setSpace(r.space); } else location.replace('/login'); },
      (e) => { if (e instanceof ApiError && e.status !== 401) console.error('admin session'); location.replace('/login'); },
    );
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const refresh = useCallback(() => setListKey((k) => k + 1), []);
  const signOut = async () => { await api('auth/logout', 'POST').catch(() => null); location.replace('/login'); };
  const navigate = (v: View) => { go(v === 'dashboard' ? '' : `?view=${v}`); setRoute(readRoute()); refresh(); };
  const openApplication = (id: string) => { go(`?application=${encodeURIComponent(id)}`); setRoute(readRoute()); };

  // Signed out: the effect above sends the visitor to /login. Nothing else is shown meanwhile.
  if (!user) return <div className="min-h-screen bg-[#050505] p-8 text-white/60">One moment…</div>;

  const p = user.permissions;
  // A person only ever lands on a part they may see; anything else falls back to the dashboard.
  const allowed = (v: View) => (v === 'dashboard' ? p.dashboard : v === 'applications' ? p.applications : p.bookings);
  const inApplication = !!route.application && p.applications;
  const view: View = inApplication ? 'applications' : allowed(route.view) ? route.view : 'dashboard';

  return (
    <AdminShell user={user} view={view} onNavigate={navigate} onSignOut={signOut} space={space}>
      {inApplication ? (
        <ApplicationView key={route.application} id={route.application!} canEdit={p.edit} canRemove={p.remove} onBack={() => navigate('applications')} onChanged={refresh} />
      ) : view === 'applications' ? (
        <ApplicationsList key={listKey} canEdit={p.edit} canRemove={p.remove} open={openApplication} />
      ) : view === 'bookings' ? (
        <BookingsList key={listKey} canEdit={p.edit} canRemove={p.remove} />
      ) : (
        <Dashboard key={listKey} user={user} />
      )}
    </AdminShell>
  );
}
