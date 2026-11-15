import { useState } from 'react';

const MESSAGE =
  "Hi! I'm interested in joining the M-BigTime team as a Territory Specialist. I would like to know more about the recruitment process and requirements.";

// Messenger: m.me accepts a ?text= draft for some accounts and ignores it for others,
// so the same message is also offered below as a one-tap copy.
const MESSENGER = `https://m.me/marielle.medina.16?text=${encodeURIComponent(MESSAGE)}`;
const VIBER = 'viber://chat?number=%2B639692860316';
const VIBER_NUMBER = '+63 969 286 0316';
const EMAIL = 'careers@phirst.homes';
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Territory Specialist — Team M-BigTime')}&body=${encodeURIComponent(`${MESSAGE}\n\nName:\nMobile number:\nLocation:`)}`;

const POSTER_ALT =
  "We're hiring. Join My Team M-BigTime as a Territory Specialist, ₱22,000 per month monthly compensation. " +
  "Initial documentary requirements, Tranche 1: Seller's Accreditation Form provided by PHirst Homes; NBI Clearance or Police Clearance; " +
  'Transcript of Records or Certificate of Grades with at least 72 units; open and enroll a CBS Savings Account. ' +
  'Additional requirements may apply to succeeding tranches.';

function Contact({ href, label, detail, external, children }: { href: string; label: string; detail: string; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-center gap-3.5 rounded-xl border border-gold/60 bg-[#0a1120]/90 px-4 py-3 text-left text-white transition hover:border-gold-soft hover:bg-[#101b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full">{children}</span>
      <span className="min-w-0">
        <span className="block text-[16px] font-bold leading-tight">{label}</span>
        <span className="block truncate text-[13px] text-white/70">{detail}</span>
      </span>
    </a>
  );
}

export function Careers() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MESSAGE);
    } catch {
      // Older browsers and non-secure pages: fall back to a temporary text field.
      const field = document.createElement('textarea');
      field.value = MESSAGE;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section
      id="careers"
      aria-labelledby="careers-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#101b33,#0a1224_45%,#05070d)] px-4 py-12 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:px-10 lg:pb-12 lg:pt-[92px]"
    >
      <div className="mx-auto w-full max-w-[900px]">
        <div className="text-center">
          <p className="text-[13px] font-semibold tracking-[0.42em] text-white/85">CAREERS</p>
          <h2 id="careers-title" className="mt-1 font-serif text-[32px] font-semibold leading-tight text-white xl:text-[40px]">
            Join Team <span className="text-gold">M-BigTime</span>
          </h2>
        </div>

        {/* The recruitment poster itself, whole and uncropped */}
        <img
          src="/assets/img/careers-poster.png"
          alt={POSTER_ALT}
          width={689}
          height={355}
          loading="lazy"
          className="mx-auto mt-5 block h-auto w-full rounded-2xl border border-gold/50 shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Contact href={MESSENGER} label="Message on Messenger" detail="Marielle Medina" external>
            <svg viewBox="0 0 48 48" className="size-11" aria-hidden="true">
              <defs>
                <linearGradient id="msgr" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#0a7cff" /><stop offset="0.5" stopColor="#a033ff" /><stop offset="1" stopColor="#ff5c87" />
                </linearGradient>
              </defs>
              <path fill="url(#msgr)" d="M24 4C12.7 4 4 12.3 4 23.4c0 5.8 2.4 10.8 6.3 14.300.300.300.500.700.5 1.2l.1 3.5c0 1.1 1.2 1.9 2.2 1.4l4-1.7c.3-.200.7-.2 1.1-.1 1.800.5 3.800.8 5.800.8 11.3 0 20-8.3 20-19.4S35.3 4 24 4Z" />
              <path fill="#fff" d="m12 29.1 5.9-9.3c.9-1.5 2.9-1.9 4.3-.8l4.7 3.5c.400.3 1 .3 1.4 0l6.3-4.8c.8-.6 1.900.4 1.4 1.3l-5.9 9.3c-.9 1.5-2.9 1.9-4.300.8l-4.7-3.5c-.4-.3-1-.3-1.4 0l-6.3 4.8c-.800.6-1.9-.4-1.4-1.3Z" />
            </svg>
          </Contact>
          <Contact href={VIBER} label="Chat on Viber" detail={VIBER_NUMBER}>
            <svg viewBox="0 0 48 48" className="size-11" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="12" fill="#7360f2" />
              <path fill="#fff" d="M31.7 27.3c-.9-.5-1.9-1.1-2.7-1.7-.8-.5-1.7-.3-2.200.4l-.9 1.1c-.300.4-.800.5-1.200.3-3-1.3-5.2-3.5-6.4-6.5-.2-.4-.1-.900.3-1.2l1-.8c.7-.600.9-1.500.4-2.3-.6-.9-1.2-1.8-1.8-2.7-.5-.7-1.3-1-2.1-.7-1.600.7-2.8 2.2-2.5 4 .100.600.3 1.200.6 1.8 2.9 6.3 7.5 10.8 13.9 13.600.500.2 1.100.4 1.600.5 1.800.3 3.4-1 4-2.600.3-.8 0-1.6-.8-2.1-.4-.4-.8-.7-1.2-1.1ZM24.6 12.2c5.500.2 10 4.6 10.2 10.1 0 .600.900.600.9 0-.2-6-5.1-10.8-11.1-11-.6 0-.600.9 0 .9Zm.3 2.6c3.900.3 7 3.3 7.3 7.2 0 .6 1 .500.9-.1-.3-4.4-3.8-7.8-8.2-8.1-.6 0-.600.9 0 1Zm.2 2.7c2.500.2 4.4 2.1 4.6 4.5 0 .6 1 .500.9-.1-.2-2.9-2.5-5.2-5.4-5.4-.6 0-.700.9-.1 1Z" />
            </svg>
          </Contact>
          <Contact href={MAILTO} label="Email Recruitment Team" detail={EMAIL}>
            <svg viewBox="0 0 48 48" className="size-11 text-gold" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="7" y="12" width="34" height="24" rx="4" />
              <path d="m8.5 14.5 15.5 12 15.5-12" />
            </svg>
          </Contact>
        </div>

        {/* Messenger may not carry the draft message, so it can be copied in one tap */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/20 bg-[#0a1120]/80 px-4 py-3.5 sm:flex-row sm:items-center">
          <p className="text-[14px] leading-relaxed text-white/85">
            <span className="mb-0.5 block text-[12px] font-semibold tracking-[0.2em] text-gold">MESSAGE TO SEND</span>
            “{MESSAGE}”
          </p>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(180deg,#ffd77a,#f2b63c_55%,#c98a1a)] px-5 text-[15px] font-bold text-[#14100a] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:ml-auto"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {copied ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>}
            </svg>
            <span aria-live="polite">{copied ? 'Copied' : 'Copy message'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
