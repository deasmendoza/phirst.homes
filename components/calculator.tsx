import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { RequirementsPanel, type RequirementsTab } from '@/components/requirements-panel';
import { SHOW_REQUIREMENTS_EVENT } from '@/lib/events';
import { Select, type Option } from '@/components/ui/select';
import { SectionSeam } from '@/components/ui/section-seam';
import { FINANCING, YEARS, loan, pagibigAvailable, price, reservationFee, termsFor, type Financing } from '@/lib/compute';
import {
  PROVINCE_ORDER,
  loadInventory,
  priceBeforeVat,
  projectLabel,
  provinceOf,
  seriesImage,
  titleCase,
  type Inventory,
  type Unit,
} from '@/lib/inventory';

const MESSENGER = 'https://m.me/marielle.medina.16';

const peso = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => `₱${peso.format(n)}`;
const pct = (n: number) => `${+(n * 100).toFixed(2)}%`;

const ICONS: Record<string, ReactNode> = {
  pin: <><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  hourglass: <path d="M6.5 3h11M6.5 21h11M7.5 3c0 5 9 5 9 9s-9 4-9 9M16.5 3c0 5-9 5-9 9s9 4 9 9" />,
  calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" /></>,
  reset: <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />,
  chat: <path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4v-11Z" />,
  print: <><path d="M7 8V3.5h10V8M7 17H4.5V9.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5V17H17" /><rect x="7" y="13.5" width="10" height="7" /></>,
  coins: <><ellipse cx="9" cy="7" rx="5.5" ry="2.5" /><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5M3.5 11v4c0 1.4 2.5 2.5 5.5 2.5" /><ellipse cx="15" cy="13" rx="5.5" ry="2.5" /><path d="M9.5 13v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" /></>,
  wallet: <><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11Zm0 0 11-3.5v3.5" /><path d="M16 14h.01" /></>,
  bank: <path d="M3.5 9.5 12 4l8.5 5.5M5 9.5h14M6.5 9.5V17M10 9.5V17M14 9.5V17M17.5 9.5V17M4 20h16M5 17h14" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.8h.01" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6.5L20.5 7" /></>,
  tools: <path d="m14 6.5 3.5-3.5a4.5 4.5 0 0 1-5.5 5.5L5.5 15a2 2 0 1 0 3 3l6.5-6.5a4.5 4.5 0 0 0 5.5-5.5L17 9.5" />,
  empty: <><path d="M3 12 10 6l7 6M5 11v8h10v-8" /><rect x="13.5" y="12.5" width="7" height="8.5" rx="1" /><path d="M15.5 15h3M15.5 17.5h.01M18.5 17.5h.01M15.5 19.2h.01M18.5 19.2h.01" /></>,
  nounit: <><path d="M3 12 10.5 5.5 18 12M5 11v8.5h8" /><circle cx="17.5" cy="17.5" r="3.5" /><path d="m16.2 16.2 2.6 2.6M18.8 16.2l-2.6 2.6" /></>,
};

function Icon({ name, className = 'size-5' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function Field({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[172px_minmax(0,1fr)] sm:gap-3">
      <div className="flex items-center gap-3 whitespace-nowrap text-[15px] font-semibold text-white">
        <Icon name={icon} className="size-5 text-gold" />
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight, grow }: { label: string; value: ReactNode; highlight?: boolean; grow?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 px-3.5 py-[7px] text-[15px] ${grow ? 'flex-1 items-center' : 'items-baseline'} ${
        highlight ? 'bg-[#f0d48a] font-bold' : 'border-b border-black/10 last:border-b-0'
      }`}
    >
      <span>{label}</span>
      <span className="text-right font-bold tabular-nums">{value}</span>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-2.5 font-serif text-[19px] font-semibold text-gold-soft">
      <Icon name={icon} className="size-6 text-gold" />
      {children}
    </h3>
  );
}

function PriceCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 px-4 py-2.5 sm:block ${highlight ? 'bg-[#f0d48a]' : 'border-b border-black/10 sm:border-b-0 sm:border-r'}`}>
      <dt className={`text-[13px] ${highlight ? 'font-bold' : ''}`}>{label}</dt>
      <dd className={`font-bold tabular-nums ${highlight ? 'text-[22px] leading-tight' : 'text-[19px] leading-tight'}`}>{value}</dd>
    </div>
  );
}

function Notice({ icon, title, children, tone = 'gold' }: { icon: string; title: string; children: ReactNode; tone?: 'gold' | 'red' }) {
  return (
    <div className="flex h-full min-h-[380px] flex-col items-center justify-center px-6 py-10 text-center">
      <Icon name={icon} className={`mb-5 size-20 ${tone === 'red' ? 'text-[#e2574c]' : 'text-white/75'}`} />
      <h3 className="mb-2 font-serif text-2xl font-semibold text-white">{title}</h3>
      <div className="max-w-md text-[15px] text-white/75">{children}</div>
    </div>
  );
}

type Status = 'loading' | 'ready' | 'error';

export function Calculator() {
  const [status, setStatus] = useState<Status>('loading');
  const [inventory, setInventory] = useState<Inventory>({ asOf: null, units: [] });

  const [type, setType] = useState('');
  const [priceKey, setPriceKey] = useState('');
  const [financing, setFinancing] = useState<Financing | ''>('');
  const [termId, setTermId] = useState('');
  const [years, setYears] = useState('');
  const [computed, setComputed] = useState(false);
  const [reqTab, setReqTab] = useState<RequirementsTab>('initial');

  useEffect(() => {
    const ctl = new AbortController();
    loadInventory(ctl.signal)
      .then((inv) => {
        setInventory(inv);
        setStatus('ready');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setStatus('error');
      });
    return () => ctl.abort();
  }, []);

  // Public calculator: house model, then the TCPs in today's online inventory for that model.
  const typeOptions = useMemo<Option[]>(
    () => [...new Set(inventory.units.map((u) => u.type))].sort().map((t) => ({ value: t, label: titleCase(t) })),
    [inventory],
  );

  // Every TCP (before VAT) for the model, once per project, grouped by project, lowest first.
  const priceOptions = useMemo<Option[]>(() => {
    const seen = new Map<string, { project: string; tcp: number }>();
    for (const u of inventory.units) {
      if (u.type !== type) continue;
      const tcp = Math.round(priceBeforeVat(u) * 100) / 100;
      seen.set(`${u.project}|${tcp}`, { project: u.project, tcp });
    }
    const rank = (p: string) => PROVINCE_ORDER.indexOf(provinceOf(p));
    return [...seen.entries()]
      .sort(([, a], [, b]) => rank(a.project) - rank(b.project) || projectLabel(a.project).localeCompare(projectLabel(b.project)) || a.tcp - b.tcp)
      .map(([key, v]) => ({ value: key, label: money(v.tcp), group: projectLabel(v.project) }));
  }, [inventory, type]);

  // The units behind the chosen TCP (same project and price); the first stands for them.
  const matches = useMemo(() => {
    if (!priceKey) return [] as Unit[];
    const cut = priceKey.lastIndexOf('|');
    const project = priceKey.slice(0, cut);
    const tcp = Number(priceKey.slice(cut + 1));
    return inventory.units.filter((u) => u.type === type && u.project === project && Math.abs(priceBeforeVat(u) - tcp) < 0.01);
  }, [inventory, type, priceKey]);
  const unit: Unit | undefined = matches[0];
  const lotArea = matches.length && matches.every((u) => u.lotArea === matches[0].lotArea) ? matches[0].lotArea : null;

  const noPagibig = type !== '' && !pagibigAvailable(type);
  const terms = useMemo(() => (financing ? termsFor(financing) : []), [financing]);
  const term = terms.find((t) => t.id === termId);
  const yearChoices = financing ? YEARS[financing] : [];
  const needsYears = financing !== '' && financing !== 'cash';
  const complete = !!unit && !!financing && !!term && (!needsYears || years !== '');

  const result = useMemo(() => {
    if (!unit || !financing || !term || (needsYears && !years)) return null;
    const rf = reservationFee(unit.type, unit.project);
    if (rf == null) return { unit, rf: null } as const;

    // VAT is worked out from the 3.6M rule, not taken from the inventory.
    const { tcp, discount, vat, beforeVat, net } = price(priceBeforeVat(unit), term);

    const schedule = term.schedule(net, rf, beforeVat);
    const balance = net - schedule.total;
    const amort = needsYears ? loan(financing, balance, net, Number(years)) : null;
    return { unit, rf, tcp, discount, discountLabel: term.discount?.label ?? '', net, vat, beforeVat, schedule, balance, amort } as const;
  }, [unit, financing, term, years, needsYears]);

  const reset = () => {
    setType('');
    setPriceKey('');
    setFinancing('');
    setTermId('');
    setYears('');
    setComputed(false);
    setReqTab('initial');
  };

  const financingLabel = FINANCING.find((f) => f.id === financing)?.label ?? '';
  const isCash = financing === 'cash';
  const showResult = computed && complete && result;

  // The menu highlights Calculator or Requirements depending on what the panel shows.
  useEffect(() => {
    window.dispatchEvent(new Event('phirst:calc-view'));
  }, [showResult]);

  // The Requirements menu link brings the requirements back (selections are kept).
  useEffect(() => {
    const show = () => {
      setComputed(false);
      setReqTab('initial');
    };
    window.addEventListener(SHOW_REQUIREMENTS_EVENT, show);
    return () => window.removeEventListener(SHOW_REQUIREMENTS_EVENT, show);
  }, []);

  // Inquire: Marielle's Messenger, with the unit and computation as the draft message
  // (Messenger keeps the draft for some accounts and ignores it for others).
  const inquiry = () => {
    if (!unit) return MESSENGER;
    const lines = [
      `Project: ${projectLabel(unit.project)}`,
      `House model: ${titleCase(unit.type)}`,
      result && result.rf != null ? `TCP: ${money(result.tcp)}` : '',
      `Financing: ${financingLabel}`,
      `Payment term: ${term?.label ?? ''}`,
      needsYears ? `Years to pay: ${years}` : '',
      result && result.rf != null ? `Net contract price: ${money(result.net)}` : '',
      '',
      'Name:',
      'Mobile number:',
    ].filter((l, i, a) => l !== '' || i >= a.length - 3);
    return `${MESSENGER}?text=${encodeURIComponent([`Hi! I'd like to inquire about this unit:`, ...lines.filter((l) => l && !/:$/.test(l))].join('\n'))}`;
  };
  // Carries the unit being viewed into the Book a Viewing form.
  const viewing = unit
    ? `/book-a-viewing?${new URLSearchParams({ project: projectLabel(unit.project), model: titleCase(unit.type) })}`
    : '/book-a-viewing';

  const asOf = inventory.asOf
    ? new Date(`${inventory.asOf}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <section id="calculator" aria-labelledby="calculator-title" className="relative isolate overflow-hidden px-4 py-12 sm:px-8 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:px-10 lg:pb-9 lg:pt-[88px]">
      <SectionSeam />

      <div className="mx-auto grid w-full max-w-[1480px] items-stretch gap-6 lg:grid-cols-[minmax(410px,460px)_minmax(0,1fr)]">
        {/* ---------- Inputs ---------- */}
        <div className="print-hide">
          <div className="mb-5 flex items-start gap-3.5">
            <Icon name="calculator" className="mt-1 size-10 text-gold" />
            <div>
              <h2 id="calculator-title" className="font-serif text-[27px] font-semibold leading-tight text-white xl:whitespace-nowrap xl:text-[29px]">
                <span className="text-gold">Calculator</span>
              </h2>
              <p className="mt-1 text-[15px] text-white/85">Estimate your downpayment and monthly amortization.</p>
            </div>
          </div>

          <form
            className="space-y-3.5 rounded-2xl border border-white/20 bg-[#0a1120]/85 p-5 backdrop-blur-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (complete) setComputed(true);
            }}
          >
            <Field icon="home" label="House Model">
              <Select
                label="House Model"
                placeholder={status === 'loading' ? 'Loading…' : 'Select a house model'}
                value={type}
                options={typeOptions}
                disabled={status !== 'ready'}
                searchable
                onChange={(v) => {
                  setType(v);
                  setPriceKey('');
                  if (financing === 'pagibig' && !pagibigAvailable(v)) {
                    setFinancing('');
                    setTermId('');
                    setYears('');
                  }
                }}
              />
            </Field>
            <Field icon="coins" label="TCP">
              <Select label="TCP" placeholder="Select a TCP" value={priceKey} options={priceOptions} disabled={!type} searchable onChange={setPriceKey} />
            </Field>
            <Field icon="card" label="Financing">
              <Select
                label="Financing"
                placeholder="Select financing"
                value={financing}
                options={FINANCING.map((f) =>
                  f.id === 'pagibig' && noPagibig
                    ? { value: f.id, label: 'Pag-IBIG (not available for this model)', disabled: true }
                    : { value: f.id, label: f.label },
                )}
                onChange={(v) => {
                  setFinancing(v as Financing);
                  setTermId('');
                  setYears('');
                }}
              />
            </Field>
            <Field icon="calendar" label="Payment Term">
              <Select label="Payment Term" placeholder="Select payment term" value={termId} options={terms.map((t) => ({ value: t.id, label: t.label }))} disabled={!financing} onChange={setTermId} />
            </Field>
            <Field icon="hourglass" label="Years to Pay">
              <Select
                label="Years to Pay"
                placeholder={isCash ? 'Not applicable for cash' : 'Select years to pay'}
                value={years}
                options={yearChoices.map((y) => ({ value: String(y), label: `${y} Years` }))}
                disabled={!financing || isCash}
                onChange={setYears}
              />
            </Field>

            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="submit"
                disabled={!complete}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-lg bg-[linear-gradient(180deg,#ffd77a,#f2b63c_55%,#c98a1a)] px-6 text-[17px] font-bold text-[#14100a] shadow-lg shadow-black/40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/15 disabled:text-white/45 disabled:shadow-none"
              >
                <Icon name="calculator" /> Compute
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg border border-white/45 px-5 text-[15px] font-semibold text-white transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <Icon name="reset" /> Reset / Back to Requirements
              </button>
            </div>
          </form>
        </div>

        {/* ---------- Result ---------- */}
        <div id="calculator-result" data-view={showResult ? 'computation' : 'requirements'} className="print-area flex flex-col rounded-2xl border border-white/20 bg-[#0a1120]/90 p-5 backdrop-blur-sm" aria-live="polite">

          {status === 'error' && (
            <Notice icon="nounit" title="Inventory is unavailable right now" tone="red">
              We could not load the list of available units. Please try again in a few minutes.
            </Notice>
          )}

          {status === 'ready' && inventory.units.length === 0 && (
            <Notice icon="nounit" title="No Available Unit" tone="red">
              Sorry, there are currently no available units. Please check back soon.
            </Notice>
          )}

          {/* Until a computation is made: the reservation requirements (also while units load) */}
          {(status === 'loading' || (status === 'ready' && inventory.units.length > 0)) && !showResult && <RequirementsPanel tab={reqTab} onTab={setReqTab} />}

          {status === 'ready' && showResult && result.rf == null && (
            <Notice icon="info" title="Please inquire for this unit">
              The published reservation fee schedule does not cover {titleCase(result.unit.type)} in {projectLabel(result.unit.project)}, so we cannot show a sample computation here.
              <div className="mt-5">
                <a href={inquiry()} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-gold px-5 font-semibold text-gold hover:bg-gold hover:text-black">
                  <Icon name="chat" /> Inquire about this unit
                </a>
              </div>
            </Notice>
          )}

          {status === 'ready' && showResult && result.rf != null && (
            <>
              {/* Printed page only: washed-out logo behind the computation, and the site address */}
              <div className="print-only print-watermark" aria-hidden="true">
                <img src="/assets/img/ph-badge-512.png" alt="" />
              </div>
              <div className="print-only print-head">
                <img src="/assets/img/ph-badge-512.png" alt="" />
                <div>
                  <div className="print-head-title">Sample Computation</div>
                  <div className="print-head-sub">PHIRST.HOMES · Team M-BigTime, Accredited PHirst Sales Team</div>
                </div>
                <div className="print-head-date">
                  Prepared {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="print-only print-footer">
                <ul>
                  <li>Sample computation only. Prices and terms are subject to change without prior notice.</li>
                  <li>Reservation fee is non-refundable and non-transferable.</li>
                  <li>Monthly amortization is an estimate based on indicative interest rates.</li>
                </ul>
                <span>https://phirst.homes/calculator</span>
              </div>
              {/* Unit header */}
              <div className="print-unit mb-4 grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div
                  className={`print-hide relative overflow-hidden rounded-lg border border-white/15 bg-[#101b33] ${
                    seriesImage(result.unit.type)?.shape === 'tall' ? 'h-[150px] w-[120px]' : 'h-[118px] w-[210px]'
                  }`}
                >
                  {seriesImage(result.unit.type) ? (
                    <img src={seriesImage(result.unit.type)!.src} alt={`${titleCase(result.unit.type)} at night`} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-white/40"><Icon name="home" className="size-12" /></div>
                  )}
                </div>
                <div>
                  <div className="text-[24px] font-bold leading-tight text-white">{projectLabel(result.unit.project)}</div>
                  <div className="mt-1.5 text-[24px] font-bold leading-tight text-white">{titleCase(result.unit.type)}</div>
                  <div className="mt-0.5 text-[15px] text-white/85">
                    {lotArea != null && <>Lot Area: {lotArea} sqm</>}
                    {lotArea != null && result.unit.floorArea != null && <span className="mx-1.5 text-white/40">|</span>}
                    {result.unit.floorArea != null && <>Floor Area: {result.unit.floorArea} sqm</>}
                  </div>
                </div>
                <div className="space-y-1.5 text-[15px] text-white md:border-l md:border-white/15 md:pl-6">
                  {asOf && <div className="pt-1.5 text-[13px] text-white/70">Inventory as of {asOf}</div>}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-white/15 p-4">
                {/* Price Details: one full-width strip */}
                <div>
                  <SectionTitle icon="coins">Price Details</SectionTitle>
                  <dl className="grid overflow-hidden rounded-lg bg-[#f7f4ec] text-[#16181d] sm:grid-flow-col sm:auto-cols-fr">
                    <PriceCell label="Total Contract Price (TCP)" value={money(result.tcp)} />
                    {result.discount > 0 && <PriceCell label={`Less: ${result.discountLabel}`} value={`− ${money(result.discount)}`} />}
                    {result.vat > 0 && <PriceCell label="VAT (12%)" value={money(result.vat)} />}
                    <PriceCell label="Net Contract Price" value={money(result.net)} highlight />
                  </dl>
                  {result.discount > 0 && (
                    <p className="mt-1.5 text-[12px] text-white/60">
                      Discount applies only if payment and requirements are completed within the stated period; otherwise it is subject to reassessment.
                    </p>
                  )}
                </div>

                {/* Downpayment | Balance & Monthly Amortization: two equal columns */}
                <div className="print-cols grid gap-4 xl:grid-cols-2">
                  <div className="flex flex-col">
                    <SectionTitle icon="wallet">{isCash ? 'Payment Schedule' : 'Downpayment'}</SectionTitle>
                    <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-[#f7f4ec] text-[#16181d]">
                      {result.schedule.dpPct != null && <Row grow label={`Downpayment (${pct(result.schedule.dpPct)})`} value={money(result.schedule.total)} />}
                      <Row grow label="Reservation Fee" value={<>{money(result.rf)} <span className="font-normal">(included)</span></>} />
                      {result.schedule.spots.map((l) => <Row grow key={l.label} label={l.label} value={money(l.amount)} />)}
                      {result.schedule.monthly && (
                        <Row
                          grow
                          label={isCash ? 'Monthly Payment' : 'Monthly Downpayment'}
                          value={<>{money(result.schedule.monthly.amount)} <span className="mx-0.5">×</span> {result.schedule.monthly.count} months</>}
                          highlight
                        />
                      )}
                      {result.schedule.last && <Row grow label={result.schedule.last.label} value={money(result.schedule.last.amount)} />}
                      {result.schedule.extra.map((l) => <Row grow key={l.label} label={l.label} value={money(l.amount)} />)}
                      <Row grow label={isCash ? 'Total Payment' : 'Total Downpayment'} value={money(result.schedule.total)} />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <SectionTitle icon="bank">Balance &amp; Monthly Amortization</SectionTitle>
                    <div className="overflow-hidden rounded-lg bg-[#f7f4ec] text-[#16181d]">
                      {result.amort ? (
                        <>
                          <Row label={`Balance / Loanable Amount (${pct(1 - (result.schedule.dpPct ?? 0))})`} value={money(result.balance)} />
                          {result.amort.mri != null && (
                            <>
                              <Row label="Monthly Amortization" value={money(result.amort.amortization)} />
                              <Row label="MRI / Fire Insurance" value={money(result.amort.mri)} />
                            </>
                          )}
                          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 bg-[#f0d48a] px-3.5 py-2.5">
                            <span className="pb-1 text-[15px] font-bold">Estimated Monthly Amortization</span>
                            <span className="ml-auto text-[34px] font-extrabold leading-none tabular-nums">{money(result.amort.total)}</span>
                          </div>
                          <div className="px-3.5 py-1.5 text-[13px]">
                            Interest Rate: {result.amort.rateNote} <span className="mx-1 text-black/35">|</span> Term: {years} Years
                          </div>
                        </>
                      ) : (
                        <div className="px-3.5 py-3 text-[15px]">Cash term: there is no loan amortization. Payments follow the schedule on the left.</div>
                      )}
                    </div>

                    {/* Computation Summary: compact panel inside the amortization column */}
                    <div className="mt-3 flex-1 rounded-lg border border-white/25 px-4 py-3 text-[14px] text-white">
                      <h3 className="mb-1.5 flex items-center gap-2 font-serif text-[16px] font-semibold text-gold-soft"><Icon name="info" className="size-[18px]" /> Computation Summary</h3>
                      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                        <dt className="text-white/65">Financing</dt><dd className="font-semibold">{financingLabel}</dd>
                        <dt className="text-white/65">Payment Term</dt><dd className="font-semibold">{term?.label}</dd>
                        <dt className="text-white/65">Years to Pay</dt><dd className="font-semibold">{needsYears ? `${years} Years` : 'Not applicable'}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="print-hide mt-4 grid gap-3 sm:grid-cols-3">
                <a href={viewing} className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[linear-gradient(180deg,#ffd77a,#f2b63c_55%,#c98a1a)] px-5 text-[17px] font-bold text-[#14100a] shadow-lg shadow-black/40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <Icon name="calendar" /> Book a Viewing
                </a>
                <a href={inquiry()} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-white/45 px-5 text-[15px] font-semibold text-white transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  <Icon name="chat" /> Inquire about this unit
                </a>
                <button type="button" onClick={() => window.print()} className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-white/45 px-5 text-[15px] font-semibold text-white transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  <Icon name="print" /> Save / Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ul className="mx-auto mt-5 flex w-full max-w-[1480px] flex-wrap justify-center gap-x-7 gap-y-1 text-center text-[13px] text-white/75">
        <li>Sample computation only. Prices and terms are subject to change without prior notice.</li>
        <li>Reservation fee is non-refundable and non-transferable.</li>
        <li>Monthly amortization is an estimate based on indicative interest rates.</li>
      </ul>
    </section>
  );
}
