import HalftoneWordmarkFooter, { type FooterColumn } from '@/components/ui/halftone-wordmark-footer';

// The animated halftone footer, rebranded for PHIRST.HOMES. Only the content, colours and
// font are set here; the dots, springs, shock ring and grain are the original component's.

// The wordmark is drawn on a canvas, which does not make the browser fetch its font by itself.
// Asking for it now means it is ready (or re-set by the component) as soon as it arrives.
if (typeof document !== 'undefined') void document.fonts?.load('800 100px Montserrat').catch(() => {});

const COLUMNS: FooterColumn[] = [
  {
    title: 'Explore',
    links: [
      { label: 'House Models', href: '/house-models' },
      { label: 'Locations', href: '/locations' },
      { label: 'Calculator', href: '/calculator' },
      { label: 'Requirements', href: '/requirements' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Careers', href: '/careers' },
      { label: 'Book a Viewing', href: '/book-a-viewing' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'sales@phirst.homes', href: 'mailto:sales@phirst.homes' },
      { label: '+63 969 286 0316', href: 'tel:+639692860316' },
    ],
  },
];

// Where the contact buttons go. Messenger is the same chat the calculator links to; Viber opens a
// chat with the mobile number.
const EMAIL = 'sales@phirst.homes';
const MOBILE = { label: '+63 969 286 0316', tel: '+639692860316' };
const MESSENGER = 'https://m.me/marielle.medina.16';
const VIBER = `viber://chat?number=${encodeURIComponent(MOBILE.tel)}`;

const BUTTON =
  'inline-flex h-[58px] items-center justify-center gap-3 whitespace-nowrap rounded-xl border border-white/45 bg-[#0a1120]/80 px-5 text-[15px] font-bold text-white transition hover:border-[#f1dcaa] hover:bg-[#101b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1dcaa] sm:px-6 sm:text-[17px]';

function ContactButtons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-10 sm:gap-4 lg:py-0">
      <a href={MESSENGER} target="_blank" rel="noopener noreferrer" aria-label="Message us on Messenger" className={BUTTON}>
        <img src="/assets/img/icons/messenger.png" alt="" width={264} height={120} className="h-[44px] w-auto" />
      </a>
      <a href={VIBER} aria-label="Chat with us on Viber" className={BUTTON}>
        <img src="/assets/img/icons/viber.png" alt="" width={255} height={120} className="h-[44px] w-auto" />
      </a>
      <a href={`mailto:${EMAIL}`} className={BUTTON}>
        <svg viewBox="0 0 24 24" className="size-6 text-[#e7cf9b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m3.5 7 8.5 6.5L20.5 7" />
        </svg>
        E-mail: {EMAIL}
      </a>
      <a href={`tel:${MOBILE.tel}`} className={BUTTON}>
        <svg viewBox="0 0 24 24" className="size-6 text-[#e7cf9b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
          <path d="M10.5 18.5h3" />
        </svg>
        Mobile Number: {MOBILE.label}
      </a>
    </div>
  );
}

/**
 * The Contact tab. On desktop it is a full screen of its own, so the menu's Contact link shows
 * only this and none of Careers above it: the contact buttons fill the space over the footer.
 */
export function SiteFooter() {
  return (
    <div id="contact" className="print-hide lg:flex lg:min-h-screen lg:flex-col lg:pt-[72px]">
      <div className="lg:flex lg:flex-1 lg:items-center lg:justify-center">
        <ContactButtons />
      </div>
      <HalftoneWordmarkFooter
        wordmark="phirst"
        label="Phirst.Homes"
        meta="©2026 · Philippines"
        columns={COLUMNS}
        palette={{ background: 'transparent', ink: '#FFFFFF', warm: '#C5A368' }}
        fontFamily='"Montserrat", "Helvetica Neue", Arial, system-ui, sans-serif'
        fontWeight={800}
      />
    </div>
  );
}
