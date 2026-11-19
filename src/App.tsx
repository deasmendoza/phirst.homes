import { useEffect, useState } from 'react';
import { Hero } from '@/components/hero';
import { HeroScroll } from '@/components/hero-scroll';
import { pickHero } from '@/src/hero-config';
import { MobileHeader } from '@/components/mobile-header';
import { Calculator } from '@/components/calculator';
import { HouseModels } from '@/components/house-models';
import { BookViewing, ROUTE_EVENT } from '@/components/book-viewing';
import { Careers } from '@/components/careers';
import { Locations } from '@/components/locations';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { FitScreen } from '@/components/ui/fit-screen';

const DESKTOP = '(min-width: 1024px)';

function useDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return desktop;
}

// Sections of the homepage that have their own clean address (no "#").
const SECTIONS: Record<string, string> = { '/house-models': 'house-models', '/locations': 'locations', '/how-to-buy': 'calculator', '/careers': 'careers', '/book-a-viewing': 'book-a-viewing', '/contact': 'contact' };
// Other addresses that open a section; the address bar then shows the section's own address.
const ALIASES: Record<string, string> = { '/calculator': '/how-to-buy', '/requirements': '/how-to-buy' };
const normalize = (path: string) => {
  const p = path.replace(/\/+$/, '') || '/';
  return ALIASES[p] ?? p;
};

function scrollToPath(path: string, behavior: ScrollBehavior) {
  const id = SECTIONS[normalize(path)];
  if (id) document.getElementById(id)?.scrollIntoView({ behavior });
  else window.scrollTo({ top: 0, behavior });
}

/** /how-to-buy (also /calculator and /requirements) shows the homepage scrolled to the calculator; menu links scroll instead of reloading. */
function useSectionRoutes() {
  useEffect(() => {
    // Old "#calculator" links keep working and are rewritten to the clean address.
    const fromHash = normalize(`/${location.hash.slice(1)}`);
    if (location.hash && SECTIONS[fromHash]) history.replaceState(null, '', fromHash);
    // /calculator and /requirements become /how-to-buy
    else if (normalize(location.pathname) !== (location.pathname.replace(/\/+$/, '') || '/')) history.replaceState(null, '', normalize(location.pathname) + location.search);
    if (SECTIONS[normalize(location.pathname)]) scrollToPath(location.pathname, 'instant');

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      const path = normalize(url.pathname);
      if (url.origin !== location.origin || url.hash) return;
      if (path !== '/' && !SECTIONS[path]) return;
      // Only section links may carry details (the calculator's unit, for the booking form).
      if (url.search && !SECTIONS[path]) return;
      e.preventDefault();
      if (normalize(location.pathname) !== path || location.search !== url.search) history.pushState(null, '', path + url.search);
      window.dispatchEvent(new Event(ROUTE_EVENT));
      scrollToPath(path, 'smooth');
    };
    const onPop = () => scrollToPath(location.pathname, 'smooth');

    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
  }, []);
}

export default function App() {
  const desktop = useDesktop();
  const [heroVariant] = useState(pickHero);
  useSectionRoutes();
  return (
    <>
      <AuroraBackground />
      <MobileHeader />
      <SiteNav />
      <main className="relative z-10">
        {/* The hero keeps its own solid night backdrop: the shared gold glow background starts below it. */}
        <div className="bg-night">
          {heroVariant === 'original' ? <Hero desktop={desktop} /> : <HeroScroll />}
        </div>
        <HouseModels />
        {/* On desktop these are scaled to fit one screen when they are taller than the window. */}
        <FitScreen>
          <Locations />
        </FitScreen>
        <FitScreen>
          <Calculator />
        </FitScreen>
        <FitScreen>
          <BookViewing />
        </FitScreen>
        <FitScreen>
          <Careers />
        </FitScreen>
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </>
  );
}
