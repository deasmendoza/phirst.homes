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

export function SiteFooter() {
  return (
    <div id="contact" className="print-hide">
      <HalftoneWordmarkFooter
        wordmark="phirst"
        label="Phirst.Homes"
        meta="©2026 · Philippines"
        columns={COLUMNS}
        palette={{ background: '#000000', ink: '#FFFFFF', warm: '#C5A368' }}
        fontFamily='"Montserrat", "Helvetica Neue", Arial, system-ui, sans-serif'
        fontWeight={800}
      />
    </div>
  );
}
