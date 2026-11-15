const LINKS = [
  ['House Models', '/house-models/'],
  ['Locations', '/locations'],
  ['Calculator', '/calculator'],
  ['Careers', '/careers/'],
  ['Contact', '/contact/'],
  ['Book a Viewing', '/contact/'],
];

/** Shown below 1024px only; on desktop the menu is part of the hero artwork. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold/35 bg-night/95 lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <a href="/" aria-label="PHIRST.HOMES home" className="flex items-center gap-2.5 font-extrabold tracking-wider text-white no-underline">
          <img src="/assets/img/mph-logo.webp" alt="" width={48} height={48} className="size-12 rounded-full" />
          <span>PHIRST.HOMES</span>
        </a>
        <details className="group">
          <summary className="cursor-pointer list-none rounded-full border border-gold/35 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white group-open:border-gold group-open:bg-gold group-open:text-black [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav aria-label="Main" className="absolute inset-x-0 top-full grid border-b border-gold/35 bg-navy">
            {LINKS.map(([label, href]) => (
              <a key={label} href={href} className="border-t border-white/5 px-5 py-4 font-semibold text-white no-underline last:text-gold">
                {label}
              </a>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
