import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError, STATUSES, type AdminUser, type Status } from '@/components/admin/api';
import { ApplicationView } from '@/components/admin/application-view';
import { BTN, CARD, INPUT, Row, StatusSelect, when } from '@/components/admin/ui';

// /admin: the private page. Nothing is shown until someone signs in, and what they see depends on their role.

interface AppRow { id: string; receivedAt: string; name: string; email: string; mobile: string; focusProject: string; status: Status; edited: boolean; deleteAfter: string | null; hasFiles: number }
interface BookRow { id: string; receivedAt: string; name: string; contact: string; date: string; time: string; pax: number; itinerary: string; status: Status }
type Booking = Record<string, string | number>;

const BOOKING_LABELS: [string, string][] = [
  ['clientName', 'Client name'], ['clientContact', 'Contact number'], ['clientEmail', 'E-mail'], ['clientFacebook', 'Facebook'],
  ['date', 'Date of visit'], ['time', 'Time'], ['pickupPoint', 'Pick up point'], ['itinerary', 'Itinerary'], ['totalPax', 'Total pax'], ['purpose', 'Purpose'],
  ['project', 'Project'], ['houseModel', 'House model'], ['unit', 'Unit'],
  ['chargedTo', 'Charged to'], ['department', 'Department'], ['divHead', 'Division head'], ['genManager', 'General manager'], ['areaManager', 'Area manager'], ['sellerName', 'Seller'], ['sellerContact', 'Seller contact'],
];

/** The booking request in the exact wording the team sends on Messenger, ready to copy and paste. */
function requestText(b: Booking) {
  const date = String(b.date ?? '');
  const time = String(b.time ?? '');
  const niceDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) : date;
  const [h, m] = time.split(':').map(Number);
  const niceTime = Number.isFinite(h) ? `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` : time;
  return [
    `Charged To: ${b.chargedTo}`,
    `Department: ${b.department}`,
    `Div Head: ${b.divHead}`,
    `Gen Manager: ${b.genManager}`,
    `Date Needed: ${niceDate}`,
    `Time Needed: ${niceTime}`,
    `Pick up point: ${b.pickupPoint}`,
    `Itinerary: ${b.itinerary}`,
    `Total Pax: ${b.totalPax}`,
    `Purpose: ${b.purpose}`,
    `Client's Name: ${b.clientName}`,
    `AM: ${b.areaManager}`,
    `Seller's Name: ${b.sellerName}`,
    `Sellers Contact Number: ${b.sellerContact}`,
  ].join('\n');
}

function CopyRequest({ booking }: { booking: Booking }) {
  const [copied, setCopied] = useState(false);
  const text = requestText(booking);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className={CARD}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="m-0 mr-auto font-serif text-[20px] font-semibold text-gold-soft">Messenger request (copy and paste)</h3>
        <button className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(100deg,#c2933a,#ecca7c_42%,#e3bb63_62%,#c79a3f)] px-5 text-[14px] font-bold text-[#171c3a]" onClick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="m-0 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#040b1a] p-4 font-sans text-[15px] leading-7 text-white">{text}</pre>
    </section>
  );
}

const matches = (hay: string[], q: string) => !q || hay.join(' ').toLowerCase().includes(q.toLowerCase());
const go = (q: string) => history.pushState(null, '', `/admin${q}`);

function Heading({ children }: { children: string }) {
  return <h1 className="m-0 font-serif text-[clamp(26px,3vw,38px)] font-semibold text-gold-soft">{children}</h1>;
}

function StatusFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select aria-label="Filter by status" className={`${INPUT} sm:max-w-[160px]`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All statuses</option>
      {STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}

function ApplicationsList({ canEdit, open }: { canEdit: boolean; open: (id: string) => void }) {
  const [rows, setRows] = useState<AppRow[] | null>(null);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    api<{ applications: AppRow[] }>('applications').then((r) => setRows(r.applications), (e) => setErr(e.message));
  }, []);
  const shown = useMemo(() => (rows ?? []).filter((r) => matches([r.name, r.email, r.mobile, r.focusProject], q) && (!st || r.status === st)), [rows, q, st]);
  const change = async (r: AppRow, status: Status) => {
    setRows((all) => all!.map((x) => (x.id === r.id ? { ...x, status } : x)));
    try { await api(`applications/${encodeURIComponent(r.id)}/status`, 'PUT', { status }); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <section className={CARD}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className={INPUT} type="search" placeholder="Search: name, e-mail, number…" aria-label="Search applications" value={q} onChange={(e) => setQ(e.target.value)} />
        <StatusFilter value={st} onChange={setSt} />
      </div>
      {err && <p className="text-[#ffb4a8]">{err}</p>}
      {!rows ? <p className="text-white/60">One moment…</p> : shown.length === 0 ? <p className="text-white/60">No applications{rows.length ? ' that match' : ' yet'}.</p> : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {shown.map((r) => (
            <li key={r.id} className="grid items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_auto]">
              <button className="grid gap-0.5 bg-transparent p-0 text-left text-white" onClick={() => open(r.id)}>
                <span className="text-[16px] font-semibold text-gold-soft">{r.name}{r.edited && <span className="ml-2 text-[12px] font-normal text-white/50">(edited)</span>}</span>
                <span className="text-[13px] text-white/70">{r.focusProject} · {r.mobile} · {r.email}</span>
                <span className="text-[12px] text-white/50">Received {when(r.receivedAt)} · {r.hasFiles} requirement file(s){r.deleteAfter && <strong className="ml-2 text-[#ffb4a8]">deletes on {when(r.deleteAfter)}</strong>}</span>
              </button>
              <StatusSelect value={r.status} onChange={(s) => change(r, s)} disabled={!canEdit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingsList({ canEdit, open }: { canEdit: boolean; open: (id: string) => void }) {
  const [rows, setRows] = useState<BookRow[] | null>(null);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    api<{ bookings: BookRow[] }>('bookings').then((r) => setRows(r.bookings), (e) => setErr(e.message));
  }, []);
  const shown = useMemo(() => (rows ?? []).filter((r) => matches([r.name, r.contact, r.itinerary, r.date], q) && (!st || r.status === st)), [rows, q, st]);
  const change = async (r: BookRow, status: Status) => {
    setRows((all) => all!.map((x) => (x.id === r.id ? { ...x, status } : x)));
    try { await api(`bookings/${encodeURIComponent(r.id)}/status`, 'PUT', { status }); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <section className={CARD}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className={INPUT} type="search" placeholder="Search: name, number, place…" aria-label="Search bookings" value={q} onChange={(e) => setQ(e.target.value)} />
        <StatusFilter value={st} onChange={setSt} />
      </div>
      {err && <p className="text-[#ffb4a8]">{err}</p>}
      {!rows ? <p className="text-white/60">One moment…</p> : shown.length === 0 ? <p className="text-white/60">No bookings{rows.length ? ' that match' : ' yet'}.</p> : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {shown.map((r) => (
            <li key={r.id} className="grid items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_auto]">
              <button className="grid gap-0.5 bg-transparent p-0 text-left text-white" onClick={() => open(r.id)}>
                <span className="text-[16px] font-semibold text-gold-soft">{r.name}</span>
                <span className="text-[13px] text-white/70">Visit: {r.date} {r.time} · {r.pax} pax · {r.contact}</span>
                <span className="text-[12px] text-white/50">{r.itinerary} · Received {when(r.receivedAt)}</span>
              </button>
              <StatusSelect value={r.status} onChange={(s) => change(r, s)} disabled={!canEdit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingView({ id, canEdit, onBack }: { id: string; canEdit: boolean; onBack: () => void }) {
  const [d, setD] = useState<{ booking: Booking; meta: { status: Status } } | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api<{ booking: Booking; meta: { status: Status } }>(`bookings/${encodeURIComponent(id)}`).then(setD, (e) => setErr(e.message));
  }, [id]);
  if (err) return <div className={CARD}><button className={BTN} onClick={onBack}>← Back</button><p className="mt-4 text-[#ffb4a8]">{err}</p></div>;
  if (!d) return <p className="text-white/60">One moment…</p>;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button className={BTN} onClick={onBack}>← Bookings</button>
        <h2 className="m-0 font-serif text-[26px] font-semibold text-gold-soft">{String(d.booking.clientName)}</h2>
        <StatusSelect
          value={d.meta.status}
          disabled={!canEdit}
          onChange={async (status) => {
            setD({ ...d, meta: { status } });
            await api(`bookings/${encodeURIComponent(id)}/status`, 'PUT', { status }).catch((e) => setErr(e.message));
          }}
        />
      </div>
      <CopyRequest booking={d.booking} />
      <section className={CARD}>
        <dl className="m-0">
          <Row label="Received">{when(String(d.booking.receivedAt))}</Row>
          {BOOKING_LABELS.map(([k, label]) => <Row key={k} label={label}>{String(d.booking[k] ?? '')}</Row>)}
        </dl>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const [space, setSpace] = useState('');
  const [tab, setTab] = useState<'applications' | 'bookings'>('applications');
  const [route, setRoute] = useState(() => new URLSearchParams(location.search));
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
    const onPop = () => setRoute(new URLSearchParams(location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // A person who is signed out mid-work (12 hours are over) goes back to the sign-in box.
  const refresh = useCallback(() => setListKey((k) => k + 1), []);
  const signOut = async () => { await api('auth/logout', 'POST').catch(() => null); location.replace('/login'); };
  const showTab = (t: typeof tab) => { setTab(t); go(''); setRoute(new URLSearchParams()); };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-night text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
    </div>
  );

  // Signed out: the effect above sends the visitor to /login. Nothing else is shown meanwhile.
  if (!user) return shell(<p className="text-white/60">One moment…</p>);

  const p = user.permissions;
  const appId = route.get('application');
  const bookId = route.get('booking');
  const tabs = [p.applications && 'applications', p.bookings && 'bookings'].filter(Boolean) as (typeof tab)[];
  const active = tabs.includes(tab) ? tab : tabs[0];

  return shell(
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center gap-3 border-b border-gold/30 pb-4">
        <div className="mr-auto">
          <p className="m-0 text-[12px] font-bold uppercase tracking-[0.2em] text-gold">PHirst · Team M BigTime</p>
          <Heading>Admin</Heading>
        </div>
        {space === 'preview' && <span className="rounded-full border border-sky-300/60 px-3 py-1 text-[12px] font-bold text-sky-200">PREVIEW DATA (not live)</span>}
        <span className="text-[14px] text-white/80">{user.name} · {user.role}</span>
        <button className={BTN} onClick={signOut}>Sign out</button>
      </header>

      {tabs.length === 0 ? (
        <section className={CARD}>
          <h2 className="m-0 font-serif text-[24px] text-gold-soft">Welcome, {user.name}!</h2>
          <p className="text-white/75">There is nothing for you to see here yet. You will be told when your part is ready.</p>
        </section>
      ) : appId && p.applications ? (
        <ApplicationView key={appId} id={appId} canEdit={p.edit} canRemove={p.remove} onBack={() => { go(''); setRoute(new URLSearchParams()); setTab('applications'); refresh(); }} onChanged={refresh} />
      ) : bookId && p.bookings ? (
        <BookingView id={bookId} canEdit={p.edit} onBack={() => { go(''); setRoute(new URLSearchParams()); setTab('bookings'); }} />
      ) : (
        <>
          <nav className="flex gap-2" aria-label="Sections">
            {tabs.map((t) => (
              <button key={t} onClick={() => showTab(t)} aria-current={active === t} className={`h-10 rounded-full border px-5 text-[14px] font-bold ${active === t ? 'border-transparent bg-gold text-[#171c3a]' : 'border-[#d9b35f]/60 text-white'}`}>
                {t === 'applications' ? 'Applications' : 'Book a Viewing'}
              </button>
            ))}
          </nav>
          {active === 'applications' ? (
            <ApplicationsList key={listKey} canEdit={p.edit} open={(id) => { go(`?application=${encodeURIComponent(id)}`); setRoute(new URLSearchParams(location.search)); }} />
          ) : (
            <BookingsList key={listKey} canEdit={p.edit} open={(id) => { go(`?booking=${encodeURIComponent(id)}`); setRoute(new URLSearchParams(location.search)); }} />
          )}
        </>
      )}
    </div>,
  );
}
