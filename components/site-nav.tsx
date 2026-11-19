import { useEffect, useRef, useState } from 'react';
import { ROUTE_EVENT } from '@/components/book-viewing';

const LINKS = [
  { label: 'House Models', href: '/house-models', section: 'house-models' },
  { label: 'Locations', href: '/locations', section: 'locations' },
  { label: 'Calculator', href: '/calculator', section: 'calculator' },
  { label: 'Requirements', href: '/requirements', section: 'requirements' },
  { label: 'Book a Viewing', href: '/book-a-viewing', section: 'book-a-viewing' },
  { label: 'Careers', href: '/careers', section: 'careers' },
  { label: 'Contact', href: '/contact', section: 'contact' },
];

/**
 * Desktop navigation, fixed to the top of every section. Over the hero it is transparent
 * and sized to the screen; once the hero has scrolled away it becomes a compact dark bar.
 * (Below 1024px, MobileHeader does this job.)
 */
export function SiteNav({ fixedSection }: { fixedSection?: string } = {}) {
  // fixedSection: a page of its own (e.g. /application) keeps one menu item lit and the bar compact.
  const [section, setSection] = useState(fixedSection ?? 'hero');
  // A Calculator or Requirements link that was just used wins until the visitor leaves the section.
  const picked = useRef<string | null>(null);
  const arrived = useRef(false);

  useEffect(() => {
    if (fixedSection) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      // The section whose top has most recently passed under the bar.
      const line = 96;
      let current = 'hero';
      for (const id of ['house-models', 'locations', 'calculator', 'book-a-viewing', 'careers', 'contact']) {
        const el = document.getElementById(id);
        // The footer is shorter than the screen, so it counts as "in view" once it is half way up;
        // the calculator lights up as it comes into view, before it reaches the top.
        const at = id === 'contact' || id === 'calculator' ? window.innerHeight / 2 : line;
        if (el && el.getBoundingClientRect().top <= at) current = id;
      }
      // Calculator first; once the section has fully arrived and is showing the reservation
      // requirements (not a computation), Requirements lights up instead.
      if (current !== 'calculator') {
        // forget the clicked link only once the visitor has reached the section and moved on
        if (arrived.current) picked.current = null;
      } else if (picked.current) {
        arrived.current = true;
        current = picked.current;
      }
      else {
        const calc = document.getElementById('calculator');
        const view = document.getElementById('calculator-result')?.dataset.view;
        if (calc && calc.getBoundingClientRect().top <= line + 8 && view === 'requirements') current = 'requirements';
      }
      setSection(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    const pick = () => {
      const p = location.pathname.replace(/\/+$/, '');
      arrived.current = false;
      picked.current = p === '/requirements' ? 'requirements' : p === '/calculator' || p === '/how-to-buy' ? 'calculator' : null;
      onScroll();
    };
    // After a computation the panel shows results, so Calculator lights up again.
    const onView = () => {
      if (document.getElementById('calculator-result')?.dataset.view === 'computation') {
        picked.current = null;
        if (location.pathname.replace(/\/+$/, '') === '/requirements') history.replaceState(null, '', '/calculator' + location.search);
      }
      onScroll();
    };
    pick();
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('phirst:calc-view', onView);
    window.addEventListener(ROUTE_EVENT, pick);
    window.addEventListener('popstate', pick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('phirst:calc-view', onView);
      window.removeEventListener(ROUTE_EVENT, pick);
      window.removeEventListener('popstate', pick);
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
