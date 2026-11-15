import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

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

  // Coming from the calculator: carry the project, house model and block & lot into the itinerary.
  useEffect(() => {
    const sync = () => {
      const v = readViewed();
      if (!v) return;
      setViewed(v);
      setStatus('idle');
      setF((cur) => ({ ...cur, itinerary: [v.project, v.houseModel, v.unit].filter(Boolean).join(', ') }));
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
    if (!f.clientEmail.trim() && !f.clientFacebook.trim()) {
      setError('Please give your e-mail or your Facebook link / username.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, ...(viewed ?? {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '');
      setStatus('sent');
      setF(EMPTY);
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
      className="relative isolate scroll-mt-16 overflow-hidden bg-[#06142a] lg:scroll-mt-0 px-4 py-12 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:px-[clamp(40px,4vw,84px)] lg:pb-5 lg:pt-[84px]"
    >
      {/* Backdrop: deep navy with soft light, and gold ribbons sweeping through two corners */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_74%_58%,rgba(20,44,84,0.75),transparent_60%),linear-gradient(180deg,#05070d,rgba(6,20,42,0)_16%,rgba(6,20,42,0)_86%,#05070d)]" />
        <div className="absolute -left-[16vw] -top-[26vw] hidden size-[44vw] rounded-full border-[3px] border-[#d9a94a]/70 shadow-[0_0_30px_rgba(242,182,60,0.25)] lg:block" />
        <div className="absolute -left-[19vw] -top-[29vw] hidden size-[46vw] rounded-full border border-[#ecca7c]/35 lg:block" />
        <div className="absolute -bottom-[30vw] -right-[14vw] hidden size-[46vw] rounded-full border-[3px] border-[#d9a94a]/70 shadow-[0_0_30px_rgba(242,182,60,0.25)] lg:block" />
        <div className="absolute -bottom-[33vw] -right-[17vw] hidden size-[48vw] rounded-full border border-[#ecca7c]/35 lg:block" />
      </div>

      <div className="mx-auto grid w-full max-w-[1760px] gap-x-[clamp(32px,4vw,84px)] gap-y-8 lg:gap-y-[clamp(8px,1.6vh,24px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-center">
        {/* ---------- Heading ---------- */}
        <div className="text-center lg:col-start-2 lg:row-start-1">
          <h2 id="book-viewing-title" className="font-serif text-[clamp(38px,min(4.6vw,8.2vh),84px)] font-semibold leading-[1.02] text-white">
            Schedule Your <em className="block font-bold text-gold-soft lg:text-[1.08em]">Site Tripping</em>
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
                  <input id="bv-pickup" type="text" required maxLength={200} value={f.pickupPoint} onChange={set('pickupPoint')} className={INPUT} />
                </Stacked>
                <Stacked icon="route" label="Itinerary" required htmlFor="bv-itinerary">
                  <input id="bv-itinerary" type="text" required maxLength={300} value={f.itinerary} onChange={set('itinerary')} className={INPUT} />
                </Stacked>
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
              width={426}
              height={270}
              loading="lazy"
              className="mx-auto block w-full max-w-[min(100%,58vh)] [mask-image:radial-gradient(ellipse_at_50%_52%,#000_60%,transparent_76%)] lg:max-w-[min(100%,54vh)]"
            />
            <div className="relative z-10 mx-auto -mt-[7%] flex w-[min(100%,560px)] items-center gap-4 bg-[linear-gradient(100deg,#c2933a,#f1d488_45%,#c79a3f)] py-2.5 pl-7 pr-9 shadow-[0_14px_34px_rgba(0,0,0,0.5)] [clip-path:polygon(22px_0,100%_0,calc(100%-22px)_100%,0_100%)]">
              <span className="grid size-[clamp(48px,3.8vw,68px)] shrink-0 place-items-center rounded-full bg-[#0a1a36] text-gold-soft">
                <Icon name="van" className="size-[62%]" />
              </span>
              <p className="leading-[1.1] text-[#0a1730]">
                <span className="block text-[clamp(20px,1.95vw,34px)] font-extrabold tracking-wide">FREE VAN TRANSFER</span>
                <span className="block text-[clamp(17px,1.6vw,28px)] font-semibold">for Site Tripping</span>
              </p>
            </div>
          </div>

          <div className="mx-auto mt-3 flex max-w-[760px] items-center gap-5 rounded-[22px] border-2 border-[#d9a94a] bg-[#050d1f]/80 px-5 py-3 lg:px-7">
            <Icon name="pin" className="size-11 text-gold lg:size-14" />
            <p className="border-l border-white/40 pl-5 text-[clamp(15px,1.25vw,23px)] leading-snug text-white/95">
              Pickup is at a designated landmark or agreed destination near your location.
              <strong className="mt-1 block font-bold text-gold-soft">The transfer is free of charge.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
