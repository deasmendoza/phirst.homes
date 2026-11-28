import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { api, STATUSES, type AdminUser } from '@/components/admin/api';
import { welcomeName } from '@/components/admin/shell';
import { Icon, type IconName } from '@/components/admin/ui';

// The dashboard, in the glass look. Every number comes from the saved applications and bookings (counts only),
// never from sample figures.

interface Stats {
  applications: { receivedAt: string; status: string; owner: string }[];
  bookings: { receivedAt: string; status: string; owner: string }[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const manila = (iso: string) => new Date(new Date(iso).getTime() + 8 * 3600000); // read with getUTC*: Manila wall-clock
const rise = (i: number) => ({ '--gd-i': i }) as CSSProperties;

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
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * 100).toFixed(1)},${(28 - (v / max) * 24).toFixed(1)}`).join(' ');
  return (
    <svg className="gd-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Metric({ icon, label, value, series, tone, i }: { icon: IconName; label: string; value: number; series: number[]; tone?: 'gold'; i: number }) {
  return (
    <article className="gd-metric gd-enter" data-tone={tone} style={rise(i)}>
      <div className="gd-metric-head"><span>{label}</span><span className="gd-metric-icon" aria-hidden="true"><Icon name={icon} size={14} /></span></div>
      <strong className="gd-metric-value">{value}</strong>
      <div className="gd-metric-caption"><span>last 12 months</span></div>
      <Spark values={series} />
    </article>
  );
}

function Tile({ icon, label, value, i }: { icon: IconName; label: string; value: number; i: number }) {
  return (
    <article className="gd-metric gd-tile gd-enter" style={rise(i)}>
      <span className="gd-metric-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </article>
  );
}

function Panel({ title, subtitle, action, i, children }: { title: string; subtitle?: string; action?: ReactNode; i: number; children: ReactNode }) {
  return (
    <section className="gd-panel gd-enter" style={rise(i)}>
      <header className="gd-panel-head">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {action}
      </header>
      {children}
    </section>
  );
}

type Point = [number, number];
const curve = (points: Point[]) =>
  points.reduce((path, [x, y], index) => {
    if (index === 0) return `M ${x} ${y}`;
    const [px, py] = points[index - 1];
    const mid = (x + px) / 2;
    return `${path} C ${mid} ${py}, ${mid} ${y}, ${x} ${y}`;
  }, '');

/** Applications and site trippings per month, as two smooth lines. Hover (or Tab to) a month to read it. */
function MonthlyChart({ labels, apps, trips }: { labels: string[]; apps: number[]; trips: number[] }) {
  const [active, setActive] = useState<number | null>(null);
  const H = 204, W = 600;
  const top = Math.ceil(Math.max(5, ...apps, ...trips) / 4) * 4;
  const pts = (values: number[]): Point[] => values.map((v, i) => [(i * W) / Math.max(1, values.length - 1), H - (v / top) * H]);
  const a = pts(apps), t = pts(trips);
  const ticks = [top, (top * 3) / 4, top / 2, top / 4, 0];
  return (
    <figure aria-label="Applications and site trippings per month, last 12 months">
      <div className="gd-revenue-main">
        <div className="gd-chart-y" aria-hidden="true">{ticks.map((v) => <span key={v}>{v}</span>)}</div>
        <div className="gd-line-plot" onMouseLeave={() => setActive(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {ticks.map((v, i) => <line className="gd-grid-line" key={v} x1="0" x2={W} y1={(H * i) / 4} y2={(H * i) / 4} />)}
            <path className="gd-chart-path" data-tone="gold" d={curve(a)} />
            <path className="gd-chart-path" data-tone="ink" d={curve(t)} />
            {active !== null && (
              <g>
                <line className="gd-line-cursor" x1={a[active][0]} x2={a[active][0]} y1="0" y2={H} />
                <circle cx={a[active][0]} cy={a[active][1]} r="4" fill="var(--gd-gold)" />
                <circle cx={t[active][0]} cy={t[active][1]} r="4" fill="var(--gd-graph-ink)" />
              </g>
            )}
          </svg>
          <div className="gd-chart-zones">
            {labels.map((label, i) => (
              <button type="button" key={i} aria-label={`${label}: ${apps[i]} applications, ${trips[i]} site trippings`} aria-pressed={active === i}
                onFocus={() => setActive(i)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} />
            ))}
          </div>
          {active !== null && (
            <div className="gd-line-tooltip" style={{ '--gd-tooltip-x': `${(active / (labels.length - 1)) * 100}%` } as CSSProperties}>
              <strong>{labels[active]}</strong>
              <span>Applications <b>{apps[active]}</b></span>
              <span>Site trippings <b>{trips[active]}</b></span>
            </div>
          )}
        </div>
      </div>
      <div className="gd-chart-axis" aria-hidden="true">{labels.map((l, i) => <span key={i}>{l}</span>)}</div>
    </figure>
  );
}

/** Application status as a ring with a clickable list. */
function StatusRing({ parts, total }: { parts: { label: string; n: number; tone: 'gold' | 'ink' | 'teal' }[]; total: number }) {
  const [active, setActive] = useState<number | null>(null);
  const R = 47;
  let acc = 0;
  return (
    <div className="gd-device">
      <div className="gd-device-ring">
        <svg viewBox="0 0 124 124" role="img" aria-label="Application status">
          <circle cx="62" cy="62" r={R} fill="none" stroke="var(--gd-track)" strokeWidth="14" />
          <g transform="rotate(-90 62 62)">
            {total > 0 && parts.map((p, i) => {
              const ratio = (p.n / total) * 100;
              const el = (
                <circle key={p.label} cx="62" cy="62" r={R} pathLength="100" fill="none" strokeWidth="14" data-tone={p.tone} className="gd-device-segment"
                  data-muted={active !== null && i !== active} strokeDasharray={`${Math.max(0, ratio - 1.1)} 100`} strokeDashoffset={-acc} />
              );
              acc += ratio;
              return el;
            })}
          </g>
        </svg>
        <div className="gd-device-total">
          <strong>{active === null ? total : parts[active].n}</strong>
          <span>{active === null ? 'Total' : parts[active].label}</span>
        </div>
      </div>
      <div className="gd-device-list">
        {parts.map((p, i) => {
          const pct = total ? Math.round((p.n / total) * 100) : 0;
          return (
            <button type="button" key={p.label} aria-pressed={active === i} aria-label={`${p.label}, ${pct}% of applications`} onClick={() => setActive(active === i ? null : i)}>
              <span><i data-tone={p.tone} aria-hidden="true" />{p.label}</span>
              <span className="gd-mix-track" aria-hidden="true"><i data-tone={p.tone} style={{ width: `${pct}%` }} /></span>
              <strong>{pct}%</strong>
            </button>
          );
        })}
      </div>
    </div>
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

  const data = useMemo(() => {
    const mine = <T extends { owner: string }>(rows: T[]) => (who ? rows.filter((r) => r.owner.trim() === who) : rows);
    const apps = mine(stats?.applications ?? []);
    const books = mine(stats?.bookings ?? []);
    const count = (rows: { status: string }[], s: string) => rows.filter((r) => r.status === s).length;
    const thisMonth = (rows: { receivedAt: string }[]) => perMonth(rows)[11].n;
    return { apps, books, appMonths: perMonth(apps), bookMonths: perMonth(books), count, thisMonth };
  }, [stats, who]);

  const { apps, books, appMonths, bookMonths, count, thisMonth } = data;
  const tones = ['gold', 'ink', 'teal'] as const;

  return (
    <>
      <header className="gd-view-head">
        <div>
          <h1>Welcome, <em>{welcomeName(user)}</em></h1>
          <p>Here&apos;s what&apos;s happening with your team today.</p>
        </div>
        <div className="gd-view-actions">
          <div className="gd-period" role="group" aria-label="Team">
            {['', ...people].map((p) => (
              <button type="button" key={p || 'all'} aria-pressed={who === p} onClick={() => setWho(p)}>{p || 'All Team'}</button>
            ))}
          </div>
        </div>
      </header>

      {err && <p className="gd-empty" role="alert">{err}</p>}
      {!stats && !err ? <p className="gd-empty" role="status">One moment…</p> : (
        <div className="gd-board">
          <div className="gd-metric-grid">
            <Metric i={0} tone="gold" icon="file" label="Total Applications" value={apps.length} series={appMonths.map((m) => m.n)} />
            <Metric i={1} icon="calendar" label="Total Trippings" value={books.length} series={bookMonths.map((m) => m.n)} />
            <Metric i={2} icon="clock" label="New Applications" value={count(apps, 'New')} series={appMonths.map((m) => m.n)} />
            <Metric i={3} icon="check" label="Trippings Done" value={count(books, 'Done')} series={bookMonths.map((m) => m.n)} />
          </div>

          <div className="gd-two">
            <Panel i={4} title="Performance Overview" subtitle="Last 12 months" action={
              <div className="gd-legend"><span><i data-tone="gold" aria-hidden="true" />Applications</span><span><i data-tone="ink" aria-hidden="true" />Site Trippings</span></div>
            }>
              <MonthlyChart labels={appMonths.map((m) => MONTHS[m.m])} apps={appMonths.map((m) => m.n)} trips={bookMonths.map((m) => m.n)} />
            </Panel>
            <Panel i={5} title="Application Status">
              <StatusRing total={apps.length} parts={STATUSES.map((s, i) => ({ label: s, n: count(apps, s), tone: tones[i] }))} />
            </Panel>
          </div>

          <div className="gd-tiles">
            <Tile i={6} icon="file" label="Applications" value={apps.length} />
            <Tile i={7} icon="file" label="Applications this month" value={thisMonth(apps)} />
            <Tile i={8} icon="car" label="Trippings" value={books.length} />
            <Tile i={9} icon="calendar" label="Trippings this month" value={thisMonth(books)} />
            <Tile i={10} icon="handshake" label="Contacted (all)" value={count(apps, 'Contacted') + count(books, 'Contacted')} />
          </div>
        </div>
      )}
    </>
  );
}
