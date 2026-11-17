import { useEffect, useMemo, useState } from 'react';
import { SectionSeam } from '@/components/ui/section-seam';
import SneakerProductHero, { type SneakerVariant } from '@/components/ui/sneaker-product-hero';
import { HOUSES, HOUSE_TYPES, houseStats, specLines, type House, type HouseStats } from '@/lib/house-models';
import { loadInventory, type Unit } from '@/lib/inventory';

// The component reads these three colours; the site is dark, so they are set for dark here.
// Brand gold is the tint and the accent for every house.
const GOLD = '#f2b63c';
const THEME = {
  ['--color-foreground' as string]: '#ffffff',
  ['--color-background' as string]: '#05070d',
  ['--color-muted-foreground' as string]: 'rgba(255,255,255,0.7)',
};

const peso = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });
const money = (n: number | null | undefined) => (n == null ? '—' : `₱${peso.format(Math.round(n))}`);
const list = (items: string[]) => items.join(', ');

/** The left-hand text: the specs, then a labelled line for where the model is sold. */
function copy(h: House, stats: HouseStats | null | undefined): { description: string; extra?: { label: string; text?: string } } {
  if (h.status === 'soon') {
    return { description: 'Details will be announced soon.', extra: { label: 'COMING SOON IN', text: stats ? list(stats.provinces) : undefined } };
  }
  const description = specLines(h).join('\n');
  if (h.status === 'soldout') return { description, extra: { label: 'SOLD OUT' } };
  return { description, extra: stats ? { label: 'AVAILABLE IN', text: list(stats.provinces) } : undefined };
}

function toVariant(h: House, stats: HouseStats | null | undefined): SneakerVariant {
  return {
    name: h.name,
    swatch: GOLD,
    tint: GOLD,
    src: h.images[0],
    gallery: h.images.map((src, i) => ({ src, label: i === 0 ? 'Front' : `Photo ${i + 1}` })),
    eyebrow: 'HOUSE SPECS',
    title: '',
    ...copy(h, stats),
  };
}

function Prices({ house, stats }: { house: House; stats: HouseStats | null | undefined }) {
  if (house.status !== 'available') return null;
  const cols = stats?.columns ?? [{ label: '', tcp: null as number | null, fee: null as number | null, monthly: null as number | null }];
  const rows: [string, (c: (typeof cols)[number]) => number | null][] = [
    ['TCP starts at', (c) => c.tcp],
    ['Reservation fee', (c) => c.fee],
    ['Monthly DP', (c) => c.monthly],
  ];
  const named = cols.length > 1;
  return (
    <div className="mt-[2.6cqw]">
      <div
        className="grid items-baseline gap-x-[1.2cqw] gap-y-[0.9cqw] text-[max(11px,1.1cqw)]"
        style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(0, 1fr))` }}
      >
        {named && (
          <>
            <span />
            {cols.map((c) => (
              <span key={c.label} className="text-right text-[max(10px,0.95cqw)] font-semibold uppercase tracking-[0.12em] text-gold">
                {c.label}
              </span>
            ))}
          </>
        )}
        {rows.map(([label, get]) => (
          <div key={label} className="contents">
            <span className="snp-label !text-[max(11px,1.05cqw)]">{label}</span>
            {cols.map((c) => (
              <span key={c.label} className="text-right font-semibold tabular-nums">
                {money(get(c))}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-[1.2cqw] text-[max(10px,0.9cqw)] leading-snug text-white/55">Monthly DP: 10% downpayment in 12 months, bank financing.</p>
    </div>
  );
}

export function HouseModels() {
  const [units, setUnits] = useState<Unit[] | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    loadInventory(ctl.signal)
      .then((inv) => setUnits(inv.units))
      .catch(() => setUnits([]));
    return () => ctl.abort();
  }, []);

  const stats = useMemo(() => new Map(HOUSES.map((h) => [h.name, units ? houseStats(h, units) : undefined])), [units]);
  const variants = useMemo(() => HOUSES.map((h) => toVariant(h, stats.get(h.name))), [stats]);

  return (
    <div id="house-models" className="relative isolate">
      <SectionSeam />
      <SneakerProductHero
        mode="listing"
        variants={variants}
        defaultVariant={0}
        accent={GOLD}
        accentText="#171c3a"
        wordSize={5.5}
        style={THEME}
        renderAside={({ active, select }) => {
          const house = HOUSES[active];
          const group = HOUSES.map((h, i) => ({ h, i })).filter(({ h }) => h.type === house.type);
          return (
            <>
              <span className="snp-label">HOUSE TYPE</span>
              <div className="snp-chips" role="group" aria-label="House type">
                {HOUSE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="snp-chip"
                    aria-pressed={t.id === house.type}
                    onClick={() => {
                      if (t.id !== house.type) select(HOUSES.findIndex((h) => h.type === t.id));
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {group.length > 1 && (
                <>
                  <span className="snp-label mt-[2.2cqw]">MODEL</span>
                  <div className="snp-chips" role="group" aria-label="Model">
                    {group.map(({ h, i }) => (
                      <button key={h.name} type="button" className="snp-chip" aria-pressed={i === active} onClick={() => select(i)}>
                        {h.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <Prices house={house} stats={stats.get(house.name)} />
            </>
          );
        }}
      />
    </div>
  );
}
