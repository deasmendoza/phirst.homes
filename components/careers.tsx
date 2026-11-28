// Careers: a split-screen recruitment section. Everything except the portrait is real
// text and real buttons, so it stays sharp, readable and editable. "Apply Now!" goes to the
// application page (/application, components/application-page.tsx).

import { SectionSeam } from '@/components/ui/section-seam';

const EMAIL = 'careers@phirst.homes';

const REQUIREMENTS: [string, string?][] = [
  ["Seller's Accreditation Form", 'Provided by PHirst Homes'],
  ['NBI Clearance / Police Clearance'],
  ['Transcript of Records (TOR) / Certificate of Grades', 'At least 72 units'],
  ['Open and Enroll CBS Savings Account'],
  ['2×2 ID Picture'],
  ['E-Signature'],
];

const CHAMPAGNE = '#e7cf9b';
const GOLD_BUTTON = 'bg-[linear-gradient(180deg,#f1dcaa,#e0bf78_55%,#c39a4a)]';

export function Careers() {
  return (
    <section
      id="careers"
      aria-labelledby="careers-title"
      className="relative isolate overflow-hidden px-5 py-12 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:px-[clamp(40px,4.5vw,96px)] lg:pb-8 lg:pt-[84px]"
    >
      <SectionSeam />
      <div className="mx-auto grid w-full max-w-[1760px] items-center gap-10 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] lg:gap-[clamp(32px,4.4vw,96px)]">
        {/* ---------- Portrait: her head rises above the gold frame ---------- */}
        <div className="relative mx-auto mt-10 w-full max-w-[340px] lg:mt-0 lg:max-w-none">
          <div className="relative mx-auto aspect-[2/3] w-full lg:h-[min(78vh,780px)] lg:w-auto">
            {/* frame */}
            <div
              className="absolute inset-0 rounded-[28px] border-2 border-[#d9a94a] bg-[radial-gradient(ellipse_at_12%_22%,rgba(231,207,155,0.32),transparent_46%),radial-gradient(ellipse_at_92%_58%,rgba(194,147,58,0.2),transparent_42%),linear-gradient(180deg,#0e1424,#06080e)] shadow-[0_30px_90px_rgba(0,0,0,0.65),0_0_60px_rgba(231,207,155,0.12)]"
              aria-hidden="true"
            />
            {/* the picture is cut off at the frame's bottom corners but not at its top */}
            <div className="absolute inset-0" style={{ clipPath: 'inset(-40% -6% 0 -6% round 0 0 28px 28px)' }}>
              <img
                src="/assets/img/careers-manager-cutout.webp"
                alt="Marielle Medina, Area Manager of Team M-BigTime, holding a model house"
                width={682}
                height={1024}
                loading="lazy"
                className="absolute left-1/2 h-[125%] w-auto max-w-none -translate-x-1/2"
                style={{ bottom: '-10%' }}
              />
            </div>
            {/* name and position */}
            <div className="absolute inset-x-[6%] bottom-[2.5%] rounded-2xl border border-[#d9a94a] bg-[#080b13]/90 px-4 pb-2.5 pt-2 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <p className="font-serif text-[clamp(22px,2vw,36px)] font-semibold italic leading-tight text-white">Marielle Medina</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#d9a94a]/80" aria-hidden="true" />
                <span className={`${GOLD_BUTTON} rounded-full px-5 py-0.5 text-[clamp(12px,1vw,17px)] font-bold text-[#14100a]`}>Area Manager</span>
                <span className="h-px flex-1 bg-[#d9a94a]/80" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Recruitment content ---------- */}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[0.44em] text-white/75">CAREERS AT PHIRST HOMES</p>

          <div className="mt-2 inline-block bg-[linear-gradient(100deg,#c2933a,#ecca7c_45%,#c79a3f)] px-5 py-1.5 [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]">
            <span className="text-[clamp(16px,1.35vw,24px)] font-extrabold tracking-[0.14em] text-[#14100a]">WE’RE HIRING!</span>
          </div>

          <h2 id="careers-title" className="mt-2 font-serif text-[clamp(34px,min(4.1vw,7.4vh),76px)] font-semibold leading-[1.04] text-white">
            Join My Team <em className="whitespace-nowrap" style={{ color: CHAMPAGNE }}>M-BigTime</em>
          </h2>

          <dl className="mt-4 flex flex-wrap items-stretch gap-x-8 gap-y-4 xl:flex-nowrap">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#e7cf9b]/70 text-[#e7cf9b]">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
                  <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" />
                </svg>
              </span>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.26em] text-white/60">POSITION</dt>
                <dd className="text-[clamp(18px,1.45vw,26px)] font-bold leading-tight text-white">International Territory Specialist</dd>
              </div>
            </div>
            <div className="border-white/20 xl:border-l xl:pl-8">
              <dt className="text-[11px] font-semibold tracking-[0.26em] text-white/60">MONETIZATION FUND</dt>
              <dd className="whitespace-nowrap text-[clamp(20px,1.65vw,30px)] leading-tight">
                <span className="font-extrabold" style={{ color: CHAMPAGNE }}>₱22,000</span>
                <span className="font-semibold text-white"> | Big Commission</span>
              </dd>
            </div>
          </dl>

          <p className="mt-3 flex items-center gap-3 rounded-xl border border-[#e7cf9b]/55 bg-[#e7cf9b]/10 px-4 py-2 text-[clamp(14px,1.05vw,17px)] font-semibold text-white">
            <span className="text-[#e7cf9b]" aria-hidden="true">✈</span>
            <span><span style={{ color: CHAMPAGNE }}>Overseas trip perk:</span> close 3 house sales and above and earn a trip abroad.</span>
          </p>

          {/* Requirements */}
          <div className="mt-5 rounded-2xl border border-[#e7cf9b]/55 bg-[linear-gradient(180deg,rgba(16,27,51,0.72),rgba(7,10,19,0.72))] px-5 py-4 backdrop-blur-sm xl:px-7">
            <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-2.5">
              <h3 className="text-[clamp(12px,1vw,16px)] font-bold tracking-[0.2em]" style={{ color: CHAMPAGNE }}>
                INITIAL DOCUMENTARY REQUIREMENTS
              </h3>
              <span className={`${GOLD_BUTTON} shrink-0 rounded-full px-3 py-0.5 text-[11px] font-extrabold tracking-[0.12em] text-[#14100a]`}>TRANCHE 1</span>
            </div>
            <ol className="mt-3 grid gap-x-10 gap-y-3 sm:grid-cols-2">
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
          <p className="mt-2.5 max-w-[92ch] text-[12px] leading-relaxed text-white/60">
            The requirements shown are for Tranche 1 only. Additional documentary requirements may apply in succeeding tranches, subject to applicable company guidelines.
          </p>

          {/* Message */}
          <div className="mt-4 border-l-2 border-[#e7cf9b]/70 pl-5">
            <p className="font-serif text-[clamp(20px,1.9vw,32px)] font-semibold italic leading-tight" style={{ color: CHAMPAGNE }}>
              Are you ready to be part of something big?
            </p>
            <p className="mt-1 text-[clamp(14px,1.05vw,17px)] text-white/85">Grow with us and help Filipino families find their dream homes.</p>
          </div>

          {/* Apply */}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/application"
              className={`${GOLD_BUTTON} inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-xl px-7 text-[19px] sm:w-auto font-bold text-[#14100a] shadow-[0_10px_30px_rgba(231,207,155,0.22)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#0a1020] text-[#f1dcaa]">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8.5" r="3" />
                  <path d="M3 19.5c.4-3.3 2.8-5 6-5s5.6 1.7 6 5M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14.8c2 .6 3.2 2.2 3.5 4.7" />
                </svg>
              </span>
              Apply Now!
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex h-[54px] w-full items-center justify-center gap-3 whitespace-nowrap rounded-xl border border-white/45 bg-[#0a1120]/80 px-4 text-[15px] sm:w-auto sm:px-6 sm:text-[17px] font-bold text-white transition hover:border-[#f1dcaa] hover:bg-[#101b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1dcaa]"
            >
              <svg viewBox="0 0 24 24" className="size-6 text-[#e7cf9b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5.5" width="18" height="13" rx="2" />
                <path d="m3.5 7 8.5 6.5L20.5 7" />
              </svg>
              E-mail: {EMAIL}
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
