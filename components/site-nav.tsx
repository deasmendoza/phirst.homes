import { useEffect, useState } from 'react';

const LINKS = [
  { label: 'House Models', href: '/house-models/', section: 'hero' },
  { label: 'Locations', href: '/locations', section: 'locations' },
  { label: 'Calculator', href: '/calculator', section: 'calculator' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Book a Viewing', href: '/contact/' },
  { label: 'Contact', href: '/contact/' },
];

/**
 * Desktop navigation, fixed to the top of every section. Over the hero it is transparent
 * and sized to the screen; once the hero has scrolled away it becomes a compact dark bar.
 * The logo always returns to the top of the homepage. (Below 1024px, MobileHeader does this job.)
 */
export function SiteNav() {
  const [section, setSection] = useState('hero');

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      // The section whose top has most recently passed under the bar.
      const line = 96;
      let current = 'hero';
      for (const id of ['locations', 'calculator']) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setSection(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const compact = section !== 'hero';

  return (
    <header
      className={`print-hide fixed inset-x-0 top-0 z-40 hidden items-center justify-center leading-[1.2] transition-[background-color,padding,border-color] duration-300 lg:flex ${
        compact
          ? 'border-b border-gold/30 bg-night/90 py-2.5 text-[15px] backdrop-blur-md'
          : 'border-b border-transparent py-[clamp(14px,1.6vw,30px)] text-[clamp(13px,1.45vw,26px)]'
      }`}
    >
      <a
        href="/"
        aria-label="PHirst Homes: back to the top of the homepage"
        className="absolute left-[clamp(16px,2.2vw,44px)] top-1/2 -translate-y-1/2 rounded-full transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
      >
        <img src="/assets/img/ph-badge-512.png" alt="PHirst Homes" width={512} height={512} className={`w-auto transition-[height] duration-300 ${compact ? 'h-12' : 'h-[3.1em]'}`} />
      </a>
      <nav aria-label="Main" className="flex items-center gap-[0.85em]">
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} aria-current={l.section === section ? 'true' : undefined} className={`hero-pill ${l.section === section ? 'hero-pill--primary' : ''}`}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
