import { useEffect, useState } from 'react';
import { Hero } from '@/components/hero';
import { MobileHeader } from '@/components/mobile-header';
import { Calculator } from '@/components/calculator';
import { BookViewing, ROUTE_EVENT } from '@/components/book-viewing';
import { Careers } from '@/components/careers';
import { Locations } from '@/components/locations';
import { SiteNav } from '@/components/site-nav';

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
const SECTIONS: Record<string, string> = { '/locations': 'locations', '/calculator': 'calculator', '/careers': 'careers', '/book-a-viewing': 'book-a-viewing' };
const normalize = (path: string) => path.replace(/\/+$/, '') || '/';

function scrollToPath(path: string, behavior: ScrollBehavior) {
  const id = SECTIONS[normalize(path)];
  if (id) document.getElementById(id)?.scrollIntoView({ behavior });
  else window.scrollTo({ top: 0, behavior });
}

/** /calculator shows the homepage scrolled to the calculator; menu links scroll instead of reloading. */
function useSectionRoutes() {
  useEffect(() => {
    // Old "#calculator" links keep working and are rewritten to the clean address.
    const fromHash = `/${location.hash.slice(1)}`;
    if (location.hash && SECTIONS[fromHash]) history.replaceState(null, '', fromHash);
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
  useSectionRoutes();
  return (
    <>
      <MobileHeader />
      <SiteNav />
      <main>
        <Hero desktop={desktop} />
        <Locations />
        <Calculator />
        <Careers />
        <BookViewing />
      </main>
    </>
  );
}
