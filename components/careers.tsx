// Careers: a split-screen recruitment section. Everything except the portrait is real
// text and real buttons, so it stays sharp, readable and editable.

import { SectionSeam } from '@/components/ui/section-seam';

const MESSAGE =
  "Hi! I'm interested in joining the M-BigTime team as a Territory Specialist. I would like to know more about the recruitment process and requirements.";

// m.me carries the draft message for accounts that support it and ignores it otherwise.
const MESSENGER = `https://m.me/marielle.medina.16?text=${encodeURIComponent(MESSAGE)}`;
const VIBER = 'viber://chat?number=%2B639692860316';
const MAILTO = `mailto:careers@phirst.homes?subject=${encodeURIComponent('Territory Specialist — Team M-BigTime')}&body=${encodeURIComponent(`${MESSAGE}\n\nName:\nMobile number:\nLocation:`)}`;

const REQUIREMENTS: [string, string?][] = [
  ["Seller's Accreditation Form", 'Provided by PHirst Homes'],
  ['NBI Clearance / Police Clearance'],
  ['Transcript of Records (TOR) / Certificate of Grades', 'At least 72 units'],
  ['Open and Enroll CBS Savings Account'],
];

const CHAMPAGNE = '#e7cf9b';

export function Careers() {
  return (
    <section
      id="careers"
      aria-labelledby="careers-title"
      className="relative isolate overflow-hidden px-5 py-12 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:px-[clamp(40px,4.5vw,96px)] lg:pb-10 lg:pt-[84px]"
    >
      <SectionSeam />
      <div className="mx-auto grid w-full max-w-[1760px] items-center gap-10 lg:grid-cols-[minmax(0,0.74fr)_minmax(0,1.26fr)] lg:gap-[clamp(40px,5vw,110px)]">
        {/* ---------- Portrait ---------- */}
        <div className="relative mx-auto w-full max-w-[340px] lg:max-w-none">
          <div className="relative mx-auto aspect-[2/3] w-full lg:h-[min(76vh,760px)] lg:w-auto">
            {/* offset gold outline behind the frame */}
            <div className="absolute -bottom-4 -right-4 left-6 top-6 rounded-[28px] border border-[#e7cf9b]/45" aria-hidden="true" />
            <div className="relative h-full overflow-hidden rounded-[28px] border border-[#e7cf9b]/80 shadow-[0_30px_90px_rgba(0,0,0,0.65),0_0_60px_rgba(231,207,155,0.12)]">
              <img src="/assets/img/careers-manager.webp" alt="Marielle Medina, Team Manager of Team M-BigTime, holding a model house" loading="lazy" className="h-full w-full object-cover object-[50%_18%]" />
            </div>
          </div>
        </div>

        {/* ---------- Recruitment content ---------- */}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[0.44em] text-white/75">CAREERS AT PHIRST HOMES</p>

          <div className="mt-3 inline-block bg-[linear-gradient(100deg,#c2933a,#ecca7c_45%,#c79a3f)] px-5 py-1.5 [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]">
            <span className="text-[clamp(16px,1.35vw,24px)] font-extrabold tracking-[0.14em] text-[#14100a]">WE’RE HIRING!</span>
          </div>

          <h2 id="careers-title" className="mt-3 font-serif text-[clamp(34px,4.1vw,76px)] font-semibold leading-[1.04] text-white">
            Join My Team <em className="whitespace-nowrap text-[#e7cf9b]">M-BigTime</em>
          </h2>

          <dl className="mt-5 flex flex-wrap items-stretch gap-x-10 gap-y-4">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#e7cf9b]/70 text-[#e7cf9b]">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" />
                </svg>
              </span>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.26em] text-white/60">POSITION</dt>
                <dd className="text-[clamp(20px,1.75vw,30px)] font-bold leading-tight text-white">Territory Specialist</dd>
              </div>
            </div>
            <div className="border-white/20 lg:border-l lg:pl-10">
              <dt className="text-[11px] font-semibold tracking-[0.26em] text-white/60">MONTHLY COMPENSATION</dt>
              <dd className="text-[clamp(22px,2vw,36px)] font-extrabold leading-tight text-[#e7cf9b]">
                ₱22,000 <span className="text-[0.62em] font-semibold text-white/85">/ month</span>
              </dd>
            </div>
          </dl>

          {/* Requirements */}
          <div className="mt-6 rounded-2xl border border-[#e7cf9b]/55 bg-[linear-gradient(180deg,rgba(16,27,51,0.72),rgba(7,10,19,0.72))] px-5 py-4 backdrop-blur-sm xl:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7cf9b]/25 pb-3">
              <h3 className="text-[clamp(13px,1.05vw,17px)] font-bold tracking-[0.2em] text-[#e7cf9b]">INITIAL DOCUMENTARY REQUIREMENTS</h3>
              <span className="rounded-full bg-[linear-gradient(180deg,#f1dcaa,#d6b56e)] px-3.5 py-1 text-[11px] font-extrabold tracking-[0.18em] text-[#14100a]">TRANCHE 1</span>
            </div>
            <ol className="mt-3 grid gap-x-10 gap-y-3 xl:grid-cols-2">
              {REQUIREMENTS.map(([title, note], i) => (
                <li key={title} className="flex items-start gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(180deg,#f1dcaa,#c9a55c)] text-[15px] font-extrabold text-[#14100a]">{i + 1}</span>
                  <span className="pt-0.5 text-[clamp(14px,1.05vw,17px)] font-semibold leading-snug text-white">
                    {title}
                    {note && <span className="block text-[0.82em] font-normal text-white/65">{note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-2.5 max-w-[92ch] text-[12px] leading-relaxed text-white/55">
            The requirements shown are for Tranche 1 only. Additional documentary requirements may apply to succeeding tranches, subject to applicable company guidelines.
          </p>

          {/* Message */}
          <div className="mt-5 border-l-2 border-[#e7cf9b]/70 pl-5">
            <p className="font-serif text-[clamp(20px,1.9vw,32px)] font-semibold italic leading-tight" style={{ color: CHAMPAGNE }}>
              Are you ready to be part of something big?
            </p>
            <p className="mt-1 text-[clamp(14px,1.05vw,17px)] text-white/85">Grow with us and help Filipino families find their dream homes.</p>
          </div>

          {/* Contact */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={MESSENGER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[54px] items-center gap-3 rounded-xl bg-[linear-gradient(180deg,#f1dcaa,#e0bf78_55%,#c39a4a)] px-6 text-[16px] font-bold text-[#14100a] shadow-[0_10px_30px_rgba(231,207,155,0.22)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg viewBox="0 0 48 48" className="size-7" aria-hidden="true">
                <path fill="#14100a" d="M24 4C12.7 4 4 12.3 4 23.4c0 5.8 2.4 10.8 6.3 14.3.3.3.5.7.5 1.2l.1 3.5c0 1.1 1.2 1.9 2.2 1.4l4-1.7c.3-.2.7-.2 1.1-.1 1.800.5 3.800.8 5.800.8 11.3 0 20-8.3 20-19.4S35.3 4 24 4Z" />
                <path fill="#f1dcaa" d="m12 29.1 5.9-9.3c.9-1.5 2.9-1.9 4.3-.8l4.7 3.5c.4.3 1 .3 1.4 0l6.3-4.8c.8-.6 1.900.4 1.4 1.3l-5.9 9.3c-.9 1.5-2.9 1.9-4.300.8l-4.7-3.5c-.4-.3-1-.3-1.4 0l-6.3 4.8c-.8.6-1.9-.4-1.4-1.3Z" />
              </svg>
              Message Me on Messenger
            </a>
            <a
              href={VIBER}
              className="inline-flex h-[54px] items-center gap-3 rounded-xl border border-[#e7cf9b]/70 bg-[#0a1120]/80 px-6 text-[16px] font-bold text-white transition hover:border-[#f1dcaa] hover:bg-[#101b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1dcaa]"
            >
              <svg viewBox="0 0 24 24" className="size-6 text-[#b9a7ff]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" /><path d="M14.5 4.2a6 6 0 0 1 5.3 5.3M14.2 7.3a3 3 0 0 1 2.5 2.5" />
              </svg>
              Chat on Viber
            </a>
            <a
              href={MAILTO}
              className="inline-flex h-[54px] items-center gap-3 rounded-xl border border-white/45 bg-[#0a1120]/80 px-6 text-[16px] font-bold text-white transition hover:border-[#f1dcaa] hover:bg-[#101b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1dcaa]"
            >
              <svg viewBox="0 0 24 24" className="size-6 text-[#e7cf9b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6.5L20.5 7" />
              </svg>
              Email Recruitment Team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
