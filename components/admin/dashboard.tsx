import { useEffect, useMemo, useState } from 'react';
import { api, STATUSES, type AdminUser } from '@/components/admin/api';
import { welcomeName } from '@/components/admin/shell';
import { CARD, Icon, type IconName } from '@/components/admin/ui';

// The dashboard. Every number comes from the saved applications and bookings (counts only), never from sample figures.

interface Stats {
  applications: { receivedAt: string; status: string; owner: string }[];
  bookings: { receivedAt: string; status: string; owner: string }[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GOLD = '#d9a94a';
const GOLD_SOFT = '#ffd77a';
const manila = (iso: string) => new Date(new Date(iso).getTime() + 8 * 3600000); // read with getUTC*: Manila wall-clock

/** The last 12 months, oldest first, with how many of the given records came in each month. */
function perMonth(rows: { receivedAt: string }[]) {
  const now = manila(new Date().toISOString());
  const out = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), n: 0 };
  });
  for (const r of rows) {
    const d = manila(r.receivedAt);
    const slot = out.find((o) => o.y === d.getUTCFullYear() && o.m === d.getUTCMonth());
    if (slot) slot.n++;
  }
  return out;
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 28 - (v / max) * 24] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-10 w-full" aria-hidden="true">
      <path d={d} fill="none" stroke={GOLD} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={GOLD_SOFT} />
    </svg>
  );
}

function Metric({ icon, label, value, series }: { icon: IconName; label: string; value: number; series: number[] }) {
  return (
    <section className={`${CARD} !p-4`}>
      <div className="flex items-center gap-4">
        <span className="text-gold-soft"><Icon name={icon} size={38} /></span>
        <div>
          <p className="m-0 font-serif text-[16px] text-white/90">{label}</p>
          <p className="m-0 font-serif text-[36px] font-semibold leading-none text-white">{value}</p>
        </div>
      </div>
      <div className="mt-2"><Spark values={series} /></div>
    </section>
  );
}

function Performance({ apps, books }: { apps: { n: number; m: number }[]; books: { n: number }[] }) {
  const max = Math.max(5, ...apps.map((a) => a.n), ...books.map((b) => b.n));
  const top = Math.ceil(max / 5) * 5;
  const W = 640, H = 220, L = 34, B = 24, T = 10;
  const bw = (W - L) / 12;
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const line = books.map((b, i) => `${i ? 'L' : 'M'}${(L + bw * i + bw / 2).toFixed(1)},${y(b.n).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Applications and site trippings per month, last 12 months">
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (top / 4) * i;
        return (
          <g key={i}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.1)" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.8)">{Math.round(v)}</text>
          </g>
        );
      })}
      {apps.map((a, i) => (
        <g key={i}>
          <rect x={L + bw * i + bw * 0.22} y={y(a.n)} width={bw * 0.56} height={Math.max(0, H - B - y(a.n))} rx="2" fill="url(#goldbar)" />
          <text x={L + bw * i + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.85)">{MONTHS[a.m]}</text>
        </g>
      ))}
      <path d={line} fill="none" stroke="#fff" strokeWidth="1.8" />
      {books.map((b, i) => <circle key={i} cx={L + bw * i + bw / 2} cy={y(b.n)} r="3.2" fill="#fff" stroke="#0a0a0a" strokeWidth="1" />)}
      <defs>
        <linearGradient id="goldbar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e8c473" /><stop offset="1" stopColor="#a67c2c" /></linearGradient>
      </defs>
    </svg>
  );
}

function Donut({ parts, total }: { parts: { label: string; n: number; color: string }[]; total: number }) {
  const R = 70, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 200 200" className="size-[190px]" role="img" aria-label="Application status">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="30" />
        {total > 0 && parts.map((p) => {
          const len = (p.n / total) * C;
          const el = <circle key={p.label} cx="100" cy="100" r={R} fill="none" stroke={p.color} strokeWidth="30" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 100 100)" />;
          acc += len;
          return el;
        })}
        <text x="100" y="102" textAnchor="middle" fontSize="34" fontFamily="serif" fill="#fff">{total}</text>
        <text x="100" y="124" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.85)">Total</text>
      </svg>
      <ul className="m-0 grid list-none gap-3 p-0 text-[15px]">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-3">
            <span className="size-3.5 rounded-full" style={{ background: p.color }} />
            <span className="w-24">{p.label}</span>
            <span className="font-semibold">{total ? Math.round((p.n / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  return (
    <section className={`${CARD} flex items-center gap-4 !p-4`}>
      <span className="text-gold-soft"><Icon name={icon} size={34} /></span>
      <div>
        <p className="m-0 text-[14px] text-white/85">{label}</p>
        <p className="m-0 font-serif text-[30px] font-semibold leading-tight">{value}</p>
      </div>
    </section>
  );
}

export function Dashboard({ user }: { user: AdminUser }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [who, setWho] = useState('');
  useEffect(() => {
    api<Stats>('stats').then(setStats, (e) => setErr(e.message));
  }, []);

  // The team tabs: everyone named as the manager of an application or the seller of a booking.
  const people = useMemo(() => {
    const names = new Set<string>();
    for (const r of [...(stats?.applications ?? []), ...(stats?.bookings ?? [])]) if (r.owner.trim()) names.add(r.owner.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [stats]);
  const mine = <T extends { owner: string }>(rows: T[]) => (who ? rows.filter((r) => r.owner.trim() === who) : rows);

  const data = useMemo(() => {
    const apps = mine(stats?.applications ?? []);
    const books = mine(stats?.bookings ?? []);
    const count = (rows: { status: string }[], s: string) => rows.filter((r) => r.status === s).length;
    const thisMonth = (rows: { receivedAt: string }[]) => perMonth(rows)[11].n;
    return { apps, books, appMonths: perMonth(apps), bookMonths: perMonth(books), count, thisMonth };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, who]);

  const { apps, books, appMonths, bookMonths, count, thisMonth } = data;
  const statusColors = [GOLD, '#ffffff', '#6f6f6f'];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="m-0 font-serif text-[clamp(30px,4vw,46px)] font-semibold text-white">
          Welcome, <span className="text-gold-soft">{welcomeName(user)}</span>
        </h1>
        <p className="m-0 mt-1 text-[17px] text-white/90">Here&apos;s what&apos;s happening with your team today.</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Team">
        {['', ...people].map((p) => (
          <button key={p || 'all'} onClick={() => setWho(p)} aria-pressed={who === p} className={`h-10 shrink-0 rounded-full border px-6 text-[15px] ${who === p ? 'border-transparent bg-[linear-gradient(100deg,#c2933a,#ecca7c_50%,#c79a3f)] font-bold text-[#141414]' : 'border-[#d9b35f]/50 text-white hover:bg-gold/10'}`}>
            {p || 'All Team'}
          </button>
        ))}
      </nav>

      {err && <p className="m-0 text-[#ff8f86]">{err}</p>}
      {!stats && !err ? <p className="m-0 text-white/70">One moment…</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon="file" label="Total Applications" value={apps.length} series={appMonths.map((m) => m.n)} />
            <Metric icon="calendar" label="Total Trippings" value={books.length} series={bookMonths.map((m) => m.n)} />
            <Metric icon="clock" label="New Applications" value={count(apps, 'New')} series={appMonths.map((m) => m.n)} />
            <Metric icon="check" label="Trippings Done" value={count(books, 'Done')} series={bookMonths.map((m) => m.n)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
            <section className={CARD}>
              <h2 className="m-0 mb-3 flex items-center gap-3 font-serif text-[22px] font-semibold"><span className="text-gold-soft"><Icon name="dashboard" size={26} /></span>Performance Overview <span className="ml-auto rounded-lg border border-[#d9b35f]/50 px-3 py-1 font-sans text-[13px] font-normal">Last 12 Months</span></h2>
              <Performance apps={appMonths} books={bookMonths} />
              <p className="m-0 mt-2 flex justify-center gap-6 text-[14px]">
                <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-gold" />Applications</span>
                <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-white" />Site Trippings</span>
              </p>
            </section>
            <section className={CARD}>
              <h2 className="m-0 mb-4 flex items-center gap-3 font-serif text-[22px] font-semibold"><span className="text-gold-soft"><Icon name="chart" size={26} /></span>Application Status</h2>
              <Donut total={apps.length} parts={STATUSES.map((s, i) => ({ label: s, n: count(apps, s), color: statusColors[i] }))} />
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Tile icon="file" label="Applications" value={apps.length} />
            <Tile icon="file" label="Applications this month" value={thisMonth(apps)} />
            <Tile icon="car" label="Trippings" value={books.length} />
            <Tile icon="calendar" label="Trippings this month" value={thisMonth(books)} />
            <Tile icon="handshake" label="Contacted (all)" value={count(apps, 'Contacted') + count(books, 'Contacted')} />
          </div>
        </>
      )}
    </div>
  );
}
