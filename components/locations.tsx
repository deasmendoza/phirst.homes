import { useMemo, useState } from 'react';
import { ISLANDS, LOCATIONS, type Island, type LocationGroup } from '@/lib/locations';
import { MAP_HEIGHT, MAP_WIDTH, PH_PATH, project } from '@/lib/ph-map';

type Filter = 'all' | Island;

const count = (n: number) => `${n} ${n === 1 ? 'Project' : 'Projects'}`;

// Where each island label sits on the map, and the point its leader line runs to.
const LABELS: Record<Island, { box: [number, number]; to: [number, number]; side: 'left' | 'right' }> = {
  luzon: { box: [8, 228], to: [226, 262], side: 'left' },
  visayas: { box: [512, 512], to: [396, 598], side: 'right' },
  mindanao: { box: [236, 948], to: [462, 916], side: 'left' },
};

function PinIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 12.5 7.5 12.5s7.5-6.9 7.5-12.5A7.5 7.5 0 0 0 12 2Zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Locations() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(LOCATIONS[0].id);

  // Groups after the island filter and the search box.
  const groups = useMemo<LocationGroup[]>(() => {
    const q = query.trim().toLowerCase();
    return LOCATIONS.map((g) => ({
      ...g,
      // The combined group is named after the island when only one is showing.
      name: g.id === 'visayas-mindanao' && filter !== 'all' ? (filter === 'visayas' ? 'Visayas' : 'Mindanao') : g.name,
      developments: g.developments.filter(
        (d) =>
          (filter === 'all' || d.island === filter) &&
          (!q || d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)),
      ),
    })).filter((g) => g.developments.length > 0);
  }, [filter, query]);

  const totals = useMemo(() => {
    const t: Record<Island, number> = { luzon: 0, visayas: 0, mindanao: 0 };
    LOCATIONS.forEach((g) => g.developments.forEach((d) => (t[d.island] += 1)));
    return t;
  }, []);

  const open = groups.find((g) => g.id === openId) ?? groups[0];
  const rest = groups.filter((g) => g !== open);

  const choose = (f: Filter) => {
    setFilter(f);
    const first = LOCATIONS.find((g) => f === 'all' || g.developments.some((d) => d.island === f));
    if (first) setOpenId(first.id);
  };

  return (
    <section id="locations" aria-labelledby="locations-title" className="relative isolate overflow-hidden bg-night px-4 py-12 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:px-10 lg:pb-10 lg:pt-[92px]">
      {/* Contour-line texture, kept faint: it only adds depth behind the map and the cards */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#070b16]" aria-hidden="true">
        <img src="/assets/img/locations-bg.webp" alt="" loading="lazy" className="h-full w-full object-cover opacity-[0.22]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(7,11,22,0.25),rgba(7,11,22,0.72)_78%),linear-gradient(180deg,#05070d,rgba(5,7,13,0)_20%,rgba(10,18,36,0)_78%,#0a1224)]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1480px] items-center gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        {/* ---------- Map (desktop only) ---------- */}
        <div className="hidden lg:block">
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="ml-[3%] h-[min(84vh,820px)] w-auto overflow-visible" role="img" aria-label="Map of the Philippines showing where PHirst developments are">
            <defs>
              <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path d={PH_PATH} fill="rgba(242,182,60,0.13)" stroke="#f2b63c" strokeWidth="1.6" strokeLinejoin="round" filter="url(#map-glow)" />

            {/* Island labels with leader lines; click to filter */}
            {ISLANDS.map(({ id, label }) => {
              const { box, to, side } = LABELS[id];
              const active = filter === id;
              const w = 172;
              const h = 62;
              const from: [number, number] = [side === 'left' ? box[0] + w : box[0], box[1] + h / 2];
              return (
                <g key={id}>
                  <path d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} stroke="#f2b63c" strokeWidth="1.2" opacity="0.7" />
                  <circle cx={to[0]} cy={to[1]} r="3.5" fill="#f2b63c" />
                  <g
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    aria-label={`${label}: ${count(totals[id])}`}
                    className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-white"
                    onClick={() => choose(active ? 'all' : id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        choose(active ? 'all' : id);
                      }
                    }}
                  >
                    <rect x={box[0]} y={box[1]} width={w} height={h} rx="8" fill={active ? '#f2b63c' : 'rgba(5,7,13,0.86)'} stroke="#f2b63c" strokeWidth="1.4" />
                    <g transform={`translate(${box[0] + 12} ${box[1] + 17})`} fill={active ? '#14100a' : '#f2b63c'}>
                      <path d="M14 0a10.5 10.5 0 0 0-10.5 10.5C3.5 18.3 14 28 14 28s10.5-9.7 10.5-17.5A10.5 10.5 0 0 0 14 0Zm0 14.4a3.9 3.9 0 1 1 0-7.8 3.9 3.9 0 0 1 0 7.8Z" />
                    </g>
                    <text x={box[0] + 46} y={box[1] + 27} fontSize="18" fontWeight="800" letterSpacing="1.5" fill={active ? '#14100a' : '#fff'}>{label.toUpperCase()}</text>
                    <text x={box[0] + 46} y={box[1] + 48} fontSize="15" fill={active ? '#14100a' : '#f2b63c'}>{count(totals[id])}</text>
                  </g>
                </g>
              );
            })}

            {/* One pin per town cluster; click to open that group */}
            {LOCATIONS.flatMap((g) =>
              g.pins.map((p, i) => {
                const [x, y] = project(p.at[0], p.at[1]);
                const dim = filter !== 'all' && p.island !== filter;
                const active = open?.id === g.id && !dim;
                return (
                  <g
                    key={`${g.id}-${i}`}
                    role="button"
                    tabIndex={dim ? -1 : 0}
                    aria-label={`${g.name}: ${count(g.developments.length)}`}
                    className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-white"
                    opacity={dim ? 0.25 : 1}
                    onClick={() => setOpenId(g.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenId(g.id);
                      }
                    }}
                  >
                    <circle cx={x} cy={y} r={active ? 15 : 10} fill="#f2b63c" opacity={active ? 0.32 : 0.2} />
                    <circle cx={x} cy={y} r={active ? 7 : 5} fill={active ? '#fff' : '#ffd77a'} stroke="#f2b63c" strokeWidth="2" />
                  </g>
                );
              }),
            )}
          </svg>
        </div>

        {/* ---------- List ---------- */}
        <div>
          <p className="text-[13px] font-semibold tracking-[0.42em] text-white/85">OUR LOCATIONS</p>
          <h2 id="locations-title" className="mt-1 font-serif text-[34px] font-semibold leading-tight text-white xl:text-[42px]">
            Find a Development <span className="text-gold">Near You</span>
          </h2>
          <p className="mt-2 text-[12px] font-semibold tracking-[0.3em] text-white/75">EXPLORE OUR COMMUNITIES ACROSS THE PHILIPPINES</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter by island group">
              {([['all', 'All Locations'], ...ISLANDS.map((i) => [i.id, i.label])] as [Filter, string][]).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filter === id}
                  onClick={() => choose(id)}
                  className={`h-10 rounded-full border px-5 text-[14px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    filter === id ? 'border-gold-soft bg-[linear-gradient(180deg,#ffd77a,#f2b63c)] text-[#14100a]' : 'border-white/60 text-white hover:border-gold hover:text-gold'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative ml-auto block w-full sm:w-[300px]">
              <span className="sr-only">Search project or location</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/70" aria-hidden="true">
                <circle cx="9" cy="9" r="6" /><path d="m13.5 13.5 4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search project or location…"
                className="h-10 w-full rounded-lg border border-white/45 bg-[#0a1120]/80 pl-10 pr-3 text-[14px] text-white placeholder:text-white/55 focus:border-gold focus:outline-none"
              />
            </label>
          </div>

          {groups.length === 0 ? (
            <p className="mt-8 rounded-xl border border-white/20 bg-[#0a1120]/80 px-5 py-8 text-center text-white/80">No development matches “{query}”.</p>
          ) : (
            <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
              {/* The open group */}
              {open && (
                <div className="overflow-hidden rounded-xl border border-gold/70 bg-[#0a1120]/88">
                  <h3>
                    <button
                      type="button"
                      aria-expanded="true"
                      className="flex w-full cursor-default items-center gap-3 bg-[linear-gradient(180deg,#ffd77a,#f2b63c_60%,#d79d28)] px-4 py-3 text-left text-[#14100a]"
                    >
                      <PinIcon />
                      <span className="text-[18px] font-bold">{open.name}</span>
                      <span className="ml-auto text-[14px] font-semibold">{count(open.developments.length)}</span>
                      <Chevron open />
                    </button>
                  </h3>
                  <ul className="max-h-[52vh] divide-y divide-white/10 overflow-y-auto lg:max-h-[min(54vh,470px)]">
                    {open.developments.map((d) => (
                      <li key={d.name} className="flex gap-3.5 px-4 py-3">
                        <HouseIcon />
                        <div className="min-w-0">
                          <div className="text-[16px] font-bold leading-snug text-white">{d.name}</div>
                          <div className="text-[13px] leading-snug text-white/75">{d.address}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Every other group, collapsed */}
              <ul className="grid gap-2.5">
                {rest.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      aria-expanded="false"
                      onClick={() => setOpenId(g.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/30 bg-[#0a1120]/88 px-4 py-2.5 text-left text-white transition hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      <PinIcon className="size-5 text-gold" />
                      <span className="text-[17px] font-bold">{g.name}</span>
                      <span className="ml-auto text-[14px] text-white/85">{count(g.developments.length)}</span>
                      <Chevron open={false} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
