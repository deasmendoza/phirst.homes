import { SectionSeam } from '@/components/ui/section-seam';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Select, type Option } from '@/components/ui/select';
import { PROVINCE_ORDER, loadInventory, projectLabel, provinceOf, type Unit } from '@/lib/inventory';
import { LOCATIONS } from '@/lib/locations';

// Book a Viewing: the site-tripping booking form beside the free van transfer.
// Everything is real text; only the van is a picture.

/** Sent by the page when a link changes the address without reloading (see src/App.tsx). */
export const ROUTE_EVENT = 'phirst:route';

// Constant details, shown on the form and saved with every booking (the server adds its own copy).
const COMPANY_LEFT: [string, string][] = [
  ['Charged To', 'PPHI'],
  ['Department', 'GST3/DIV1'],
  ['Div Head', 'MCV'],
  ['Gen Manager', 'ACO'],
];
const COMPANY_RIGHT: [string, string][] = [
  ['Area Manager', 'Marielle Medina'],
  ["Seller's Name", 'Michael & Andrea Mendoza'],
  ["Seller's Contact Number", '0917-651-0110'],
];

// Pick up points. South and North are the malls and buildings where the van meets the client;
// the last choice opens a province and a place, limited to provinces where PHirst has projects.
const SOUTH = ['Pacific Star Building', 'SM Mall of Asia', 'Alabang Town Center', 'Festival Mall', 'Star Mall', 'Evia Mall, Daang Hari', 'SM San Pablo'];
const NORTH = ['SM North Edsa', 'Trinoma Mall', 'WalterMart North Edsa', 'Pure Gold Balintawak', 'Victory Mall Monumento', 'SM Clark & SM San Fernando', 'Malls nearby NLEX', 'All Malls within EDSA - Cubao Area'];
const IN_PROVINCE = 'in-province';
const PICKUP_OPTIONS: Option[] = [
  ...SOUTH.map((p) => ({ value: p, label: p, group: 'South Projects' })),
  ...NORTH.map((p) => ({ value: p, label: p, group: 'North Projects' })),
  { value: IN_PROVINCE, label: "Malls or landmarks within the project's province", group: "Within the project's province" },
];
const groupOfPickup = (value: string) => PICKUP_OPTIONS.find((o) => o.value === value)?.group ?? '';

/** Projects for the Itinerary list: the live inventory (same as the calculator), grouped by province. */
function projectChoices(units: Unit[] | null): Option[] {
  const names = units?.length ? [...new Set(units.map((u) => u.project))] : LOCATIONS.flatMap((g) => g.developments.map((d) => d.name.toUpperCase()));
  return [...new Set(names)]
    .map((p) => ({ value: projectLabel(p), label: projectLabel(p), group: provinceOf(p) }))
    .sort((a, b) => PROVINCE_ORDER.indexOf(a.group) - PROVINCE_ORDER.indexOf(b.group) || a.label.localeCompare(b.label));
}

const EMPTY = {
  date: '',
  time: '',
  pickupPoint: '',
  itinerary: '',
  totalPax: '',
  clientName: '',
  clientContact: '',
  clientEmail: '',
  clientFacebook: '',
  website: '', // hidden trap for robots
};
type Fields = typeof EMPTY;

interface Viewed {
  project: string;
  houseModel: string;
  unit: string;
}

/** What the visitor was looking at in the calculator, carried in the address. */
function readViewed(): Viewed | null {
  const q = new URLSearchParams(location.search);
  const v = { project: q.get('project') ?? '', houseModel: q.get('model') ?? '', unit: q.get('unit') ?? '' };
  return v.project || v.houseModel || v.unit ? v : null;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ICONS: Record<string, ReactNode> = {
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 17h2M14 17h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 0 0-13 0c0 4.8 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  route: (
    <>
      <rect x="3.5" y="4" width="5" height="5" rx="1" />
      <rect x="15.5" y="15" width="5" height="5" rx="1" />
      <path d="M8.5 6.5H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.5" />
    </>
  ),
  group: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3 19.5c.400-3.3 2.8-5 6-5s5.6 1.7 6 5M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14.8c2 .600 3.2 2.2 3.5 4.7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l7-7M16.5 4.5H19.5V7.5" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.500-4 3.3-6 7-6s6.5 2 7 6" />
    </>
  ),
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </>
  ),
  facebook: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M13 20.5V12.5h2.3M13 12.5v-2c0-1.2.7-2 2-2h.800M10.5 12.5H13" />
    </>
  ),
  van: (
    <>
      <path d="M2.5 16.5v-8a2 2 0 0 1 2-2h9.5c2.5 0 4 1 5 3l1.5 2.5c.600.5 1 1.2 1 2v2.5h-2" />
      <path d="M8.5 16.5h7M2.5 16.5h2M14.5 6.5V11.5H20M5.5 9.5h5.5" />
      <circle cx="6.5" cy="16.8" r="1.9" />
      <circle cx="17.5" cy="16.8" r="1.9" />
    </>
  ),
};

function Icon({ name, className = 'size-6' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const INPUT =
  'h-9 lg:h-[clamp(30px,4.3vh,38px)] w-full min-w-0 rounded-[10px] border border-[#d9b35f]/75 bg-[#040b1a]/70 px-3 text-[15px] text-white outline-none transition [color-scheme:dark] placeholder:text-white/35 focus:border-gold-soft focus:ring-2 focus:ring-gold/35';
const selectLook = ({ open, selected }: { open: boolean; selected: boolean }) =>
  `flex h-9 lg:h-[clamp(30px,4.3vh,38px)] w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border bg-[#040b1a]/70 px-3 text-left text-[15px] outline-none transition focus-visible:border-gold-soft focus-visible:ring-2 focus-visible:ring-gold/35 ${
    open ? 'border-gold-soft ring-2 ring-gold/35' : 'border-[#d9b35f]/75'
  } ${selected ? 'text-white' : 'text-white/45'}`;
const LABEL = 'text-[14px] font-semibold leading-tight text-white xl:text-[15px]';
const Star = () => (
  <span className="text-gold" aria-hidden="true">
    {' '}
    *
  </span>
);

/** Icon, with the label above its field (top half of the form). */
function Stacked({ icon, label, required, htmlFor, children }: { icon: string; label: string; required?: boolean; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} className="mt-0.5 size-7 text-gold" />
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className={`${LABEL} mb-1 block`}>
          {label}
          {required && <Star />}
        </label>
        {children}
      </div>
    </div>
  );
}

/** Icon and label on the left, field on the right (client details). */
function Inline({ icon, label, required, htmlFor, children }: { icon: string; label: string; required?: boolean; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] sm:items-center sm:gap-4">
      <label htmlFor={htmlFor} className={`${LABEL} flex items-center gap-3`}>
        <Icon name={icon} className="size-7 text-gold" />
        <span>
          {label}
          {required && <Star />}
        </span>
      </label>
      {children}
    </div>
  );
}

type Status = 'idle' | 'sending' | 'sent';

export function BookViewing() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [viewed, setViewed] = useState<Viewed | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [province, setProvince] = useState('');
  const [place, setPlace] = useState('');

  // The same live list of projects the calculator uses (a built-in list takes over if it cannot load).
  useEffect(() => {
    const ctl = new AbortController();
    loadInventory(ctl.signal)
      .then((inv) => setUnits(inv.units))
      .catch(() => {});
    return () => ctl.abort();
  }, []);

  const projects = useMemo(() => projectChoices(units), [units]);
  const provinces = useMemo<Option[]>(
    () => PROVINCE_ORDER.filter((p) => p !== 'Other' && projects.some((o) => o.group === p)).map((p) => ({ value: p, label: p })),
    [projects],
  );
  const projectProvince = projects.find((o) => o.value === f.itinerary)?.group ?? '';
  const chosenProvince = province || projectProvince;

  // Coming from the calculator: carry the project, house model and block & lot into the itinerary.
  useEffect(() => {
    const sync = () => {
      const v = readViewed();
      if (!v) return;
      setViewed(v);
      setStatus('idle');
      setProvince('');
      setF((cur) => ({ ...cur, itinerary: v.project || cur.itinerary }));
    };
    sync();
    window.addEventListener(ROUTE_EVENT, sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener(ROUTE_EVENT, sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => setF((cur) => ({ ...cur, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    const inProvince = f.pickupPoint === IN_PROVINCE;
    const problem = !f.pickupPoint
      ? 'Please choose your pick up point.'
      : inProvince && !chosenProvince
        ? 'Please choose the province for your pick up.'
        : inProvince && !place.trim()
          ? 'Please tell us which mall or landmark in that province.'
          : !f.itinerary
            ? 'Please choose where you would like to go.'
            : !f.clientEmail.trim() && !f.clientFacebook.trim()
              ? 'Please give your e-mail or your Facebook link / username.'
              : '';
    if (problem) {
      setError(problem);
      return;
    }
    const pickupPoint = inProvince ? `${place.trim()}, ${chosenProvince} (within the project's province)` : `${f.pickupPoint} (${groupOfPickup(f.pickupPoint)})`;
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, pickupPoint, ...(viewed ?? {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '');
      setStatus('sent');
      setF(EMPTY);
      setProvince('');
      setPlace('');
      setViewed(null);
    } catch (err) {
      setStatus('idle');
      setError((err instanceof Error && err.message) || 'Your booking could not be sent right now. Please call or text us instead.');
    }
  };

  return (
    <section
      id="book-a-viewing"
      aria-labelledby="book-viewing-title"
      className="relative isolate scroll-mt-16 overflow-hidden lg:scroll-mt-0 px-4 py-12 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:px-[clamp(40px,4vw,84px)] lg:pb-5 lg:pt-[84px]"
    >
      <SectionSeam />
      <div className="mx-auto grid w-full max-w-[1760px] gap-x-[clamp(32px,4vw,84px)] gap-y-8 lg:gap-y-[clamp(8px,1.6vh,24px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-center">
        {/* ---------- Heading ---------- */}
        <div className="text-center lg:col-start-2 lg:row-start-1">
          <h2 id="book-viewing-title" className="font-serif text-[clamp(38px,min(4.6vw,8.2vh),84px)] font-semibold leading-[1.02] text-white">
            Schedule Your <em className="block font-bold text-gold-soft">Free Site Tripping</em>
          </h2>
          <p className="mx-auto mt-3 max-w-[30em] text-[clamp(16px,1.35vw,25px)] leading-snug text-white/90">See our house models up close and explore the community in person.</p>
        </div>

        {/* ---------- Booking form ---------- */}
        <div className="rounded-[26px] border-2 border-[#d9a94a] bg-[linear-gradient(180deg,rgba(9,20,42,0.94),rgba(5,11,26,0.94))] px-4 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.55),0_0_34px_rgba(242,182,60,0.12)] sm:px-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:py-[clamp(14px,2.2vh,26px)]">
          <div className="flex items-center gap-4 border-b border-[#d9a94a]/80 pb-2.5">
            <Icon name="calendar" className="size-11 text-gold lg:size-12" />
            <div className="min-w-0">
              <h3 className="text-[clamp(24px,2.3vw,40px)] font-bold leading-tight text-white">
                Book Your <span className="text-gold-soft">Site Tripping</span>
              </h3>
              <p className="text-[clamp(14px,1.1vw,19px)] text-white/90">Fill in the details below so we can arrange your visit.</p>
            </div>
          </div>

          {status === 'sent' ? (
            <div role="status" className="grid min-h-[320px] place-items-center py-10 text-center">
              <div>
                <p className="font-serif text-[clamp(26px,2.4vw,40px)] font-semibold text-gold-soft">Thank you!</p>
                <p className="mx-auto mt-2 max-w-[26em] text-[17px] text-white/90">Your site tripping request has been received. We will contact you to confirm your schedule.</p>
                <button type="button" onClick={() => setStatus('idle')} className="mt-6 rounded-full border border-[#d9a94a] px-6 py-2 text-[15px] font-semibold text-white transition hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft">
                  Book another visit
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 grid gap-[clamp(8px,1.3vh,14px)]">
              <div className="grid gap-x-8 gap-y-[clamp(8px,1.3vh,14px)] sm:grid-cols-2">
                <Stacked icon="calendar" label="Date Needed" required htmlFor="bv-date">
                  <input id="bv-date" type="date" required min={today()} value={f.date} onChange={set('date')} className={INPUT} />
                </Stacked>
                <Stacked icon="clock" label="Time Needed" required htmlFor="bv-time">
                  <input id="bv-time" type="time" required value={f.time} onChange={set('time')} className={INPUT} />
                </Stacked>
                <Stacked icon="pin" label="Pick up point" required htmlFor="bv-pickup">
                  <Select label="Pick up point" placeholder="Select pick up point" value={f.pickupPoint} options={PICKUP_OPTIONS} onChange={(v) => setF((cur) => ({ ...cur, pickupPoint: v }))} buttonClass={selectLook} />
                </Stacked>
                <Stacked icon="route" label="Itinerary" required htmlFor="bv-itinerary">
                  <Select label="Itinerary" placeholder="Select project to visit" value={f.itinerary} options={projects} onChange={(v) => setF((cur) => ({ ...cur, itinerary: v }))} searchable buttonClass={selectLook} />
                  {viewed && (viewed.houseModel || viewed.unit) && (
                    <p className="mt-1 text-[13px] leading-snug text-gold-soft">
                      {[viewed.houseModel, viewed.unit].filter(Boolean).join(' · ')}
                      <button type="button" onClick={() => setViewed((v) => (v ? { ...v, houseModel: '', unit: '' } : v))} aria-label="Remove the house model and block and lot" className="ml-2 text-white/70 hover:text-white">
                        ×
                      </button>
                    </p>
                  )}
                </Stacked>
                {f.pickupPoint === IN_PROVINCE && (
                  <div className="grid gap-x-8 gap-y-[clamp(8px,1.3vh,14px)] sm:col-span-2 sm:grid-cols-2">
                    <Stacked icon="pin" label="Province" required htmlFor="bv-province">
                      <Select label="Province" placeholder="Select province" value={chosenProvince} options={provinces} onChange={setProvince} buttonClass={selectLook} />
                    </Stacked>
                    <Stacked icon="pin" label="Mall or landmark" required htmlFor="bv-place">
                      <input id="bv-place" type="text" maxLength={120} value={place} onChange={(e) => setPlace(e.target.value)} className={INPUT} />
                    </Stacked>
                  </div>
                )}
                <Stacked icon="group" label="Total Pax" required htmlFor="bv-pax">
                  <input id="bv-pax" type="number" required min={1} max={99} inputMode="numeric" value={f.totalPax} onChange={set('totalPax')} className={INPUT} />
                </Stacked>
                <Stacked icon="target" label="Purpose" htmlFor="bv-purpose">
                  <input id="bv-purpose" type="text" readOnly tabIndex={-1} value="Site Tripping" className={`${INPUT} cursor-default focus:border-[#d9b35f]/75 focus:ring-0`} />
                </Stacked>
              </div>

              <Inline icon="person" label="Client's Name" required htmlFor="bv-name">
                <input id="bv-name" type="text" required maxLength={120} autoComplete="name" value={f.clientName} onChange={set('clientName')} className={INPUT} />
              </Inline>
              <Inline icon="phone" label="Client's Contact Number" required htmlFor="bv-contact">
                <input id="bv-contact" type="tel" required maxLength={40} autoComplete="tel" value={f.clientContact} onChange={set('clientContact')} className={INPUT} />
              </Inline>
              <Inline icon="mail" label="Client's E-mail" htmlFor="bv-email">
                <input id="bv-email" type="email" maxLength={160} autoComplete="email" value={f.clientEmail} onChange={set('clientEmail')} className={INPUT} />
              </Inline>
              <Inline icon="facebook" label="Client's Facebook Link / Username" htmlFor="bv-facebook">
                <input id="bv-facebook" type="text" maxLength={200} value={f.clientFacebook} onChange={set('clientFacebook')} className={INPUT} />
              </Inline>

              {/* Robots fill this in; people never see it. */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Leave this empty
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
                </label>
              </div>

              {/* Fixed company details: shown, saved with the booking, not editable */}
              <div className="mt-1 grid gap-x-8 gap-y-3 border-t border-[#d9a94a]/80 pt-3 text-[clamp(14px,1.05vw,18px)] leading-[1.42] text-white/90 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                <dl className="sm:border-r sm:border-white/35 sm:pr-6">
                  {COMPANY_LEFT.map(([k, v]) => (
                    <div key={k} className="flex gap-1.5">
                      <dt>{k}:</dt>
                      <dd className="font-bold text-white">{v}</dd>
                    </div>
                  ))}
                </dl>
                <dl>
                  {COMPANY_RIGHT.map(([k, v], i) => (
                    <div key={k} className="flex items-start gap-3">
                      <Icon name={['person', 'group', 'phone'][i]} className="mt-0.5 size-6 text-gold" />
                      <div className="flex flex-wrap gap-x-1.5">
                        <dt>{k}:</dt>
                        <dd className="font-bold text-white">{v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-400/60 bg-red-950/50 px-3 py-2 text-[14px] text-red-100">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[linear-gradient(180deg,#ffd77a,#f2b63c_55%,#c98a1a)] px-6 text-[17px] font-bold text-[#14100a] shadow-lg shadow-black/40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : 'Book a Viewing'}
              </button>
            </form>
          )}
        </div>

        {/* ---------- Free van transfer ---------- */}
        <div className="lg:col-start-2 lg:row-start-2 lg:self-start">
          <div className="relative mx-auto max-w-[760px]">
            <img
              src="/assets/img/site-tripping-van.webp"
              alt="White PHirst Park Homes van used for free site tripping transfers"
              width={772}
              height={367}
              loading="lazy"
              className="mx-auto block w-full [mask-image:radial-gradient(ellipse_at_50%_50%,#000_64%,transparent_80%)] lg:max-w-[min(100%,76vh)]"
            />
          </div>

          <div className="mx-auto mt-3 flex max-w-[760px] items-center gap-5 rounded-[22px] border-2 border-[#d9a94a] bg-[#050d1f]/80 px-5 py-3 lg:px-7">
            <Icon name="pin" className="size-11 text-gold lg:size-14" />
            <p className="border-l border-white/40 pl-5 text-[clamp(15px,1.25vw,23px)] leading-snug text-white/95">
              Pickup is at a designated landmark or agreed destination near your location.
              <strong className="mt-1 block font-bold text-gold-soft">The transfer is free of charge.</strong>
            </p>
          </div>
          <p className="mx-auto mt-2 max-w-[760px] text-center text-[clamp(12px,0.95vw,16px)] italic text-white/75">*Client will only be responsible for any toll fee (if applicable).</p>
        </div>
      </div>
    </section>
  );
}
