import { lazy, Suspense, useEffect, useState } from 'react';
import { Hero } from '@/components/hero';
import { HeroScroll } from '@/components/hero-scroll';
import { pickHero } from '@/src/hero-config';
import { MobileHeader } from '@/components/mobile-header';
import { SHOW_REQUIREMENTS_EVENT } from '@/lib/events';
import { Calculator } from '@/components/calculator';
import { HouseModels } from '@/components/house-models';
import { BookViewing, ROUTE_EVENT } from '@/components/book-viewing';
import { Careers } from '@/components/careers';
import { ApplicationPage } from '@/components/application-page';
import { Locations } from '@/components/locations';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { FitScreen } from '@/components/ui/fit-screen';
import { SignInDialog } from '@/components/admin/sign-in-dialog';

// The private admin is loaded only on /admin, so the public site never carries it.
const AdminPage = lazy(() => import('@/components/admin/admin-page'));

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
const SECTIONS: Record<string, string> = { '/house-models': 'house-models', '/locations': 'locations', '/calculator': 'calculator', '/requirements': 'calculator', '/careers': 'careers', '/book-a-viewing': 'book-a-viewing', '/contact': 'contact' };
// Other addresses that open a section; the address bar then shows the section's own address.
const ALIASES: Record<string, string> = { '/how-to-buy': '/calculator' };
// /requirements opens the calculator section with the requirements showing.
const showRequirementsIf = (path: string) => {
  if (normalize(path) === '/requirements') window.dispatchEvent(new Event(SHOW_REQUIREMENTS_EVENT));
};
const normalize = (path: string) => {
  const p = path.replace(/\/+$/, '') || '/';
  return ALIASES[p] ?? p;
};

function scrollToPath(path: string, behavior: ScrollBehavior) {
  const id = SECTIONS[normalize(path)];
  if (id) document.getElementById(id)?.scrollIntoView({ behavior });
  else window.scrollTo({ top: 0, behavior });
}

/** /calculator and /requirements (and the old /how-to-buy) show the homepage scrolled to the calculator; menu links scroll instead of reloading. */
function useSectionRoutes() {
  useEffect(() => {
    // Old "#calculator" links keep working and are rewritten to the clean address.
    const fromHash = normalize(`/${location.hash.slice(1)}`);
    if (location.hash && SECTIONS[fromHash]) history.replaceState(null, '', fromHash);
    // the old /how-to-buy becomes /calculator
    else if (normalize(location.pathname) !== (location.pathname.replace(/\/+$/, '') || '/')) history.replaceState(null, '', normalize(location.pathname) + location.search);
    showRequirementsIf(location.pathname);
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
      showRequirementsIf(path);
      scrollToPath(path, 'smooth');
    };
    const onPop = () => {
      showRequirementsIf(location.pathname);
      scrollToPath(location.pathname, 'smooth');
    };

    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
  }, []);
}

/** /login is the homepage with the staff sign-in box already open on top of it (and not indexed). */
function Home({ login = false }: { login?: boolean }) {
  const desktop = useDesktop();
  const [heroVariant] = useState(pickHero);
  const [signIn, setSignIn] = useState(login);
  useSectionRoutes();
  useEffect(() => {
    if (!login) return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';
  }, [login]);
  return (
    <>
      {signIn && (
        <SignInDialog
          onClose={() => {
            setSignIn(false);
            if (login) history.replaceState(null, '', '/');
          }}
        />
      )}
      <AuroraBackground />
      <MobileHeader />
      <SiteNav />
      <main className="relative z-10">
        {/* The hero keeps its own solid night backdrop: the shared gold glow background starts below it.
            Below 1024px (phones and tablets) there is no hero: the page opens on the House Models. */}
        {desktop && (
          <div className="bg-night">
            {heroVariant === 'original' ? <Hero desktop={desktop} /> : <HeroScroll />}
          </div>
        )}
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

/** /application is a page of its own: the Sellers Accreditation Form, under the usual menu and footer. */
function ApplicationRoute() {
  useEffect(() => {
    document.title = 'Sellers Accreditation Form | PHIRST.HOMES';
  }, []);
  return (
    <>
      <AuroraBackground />
      <MobileHeader />
      <SiteNav fixedSection="careers" />
      <main className="relative z-10">
        <ApplicationPage />
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </>
  );
}

export default function App() {
  const [onApplication] = useState(() => normalize(location.pathname) === '/application');
  const [onAdmin] = useState(() => normalize(location.pathname) === '/admin');
  const [onLogin] = useState(() => normalize(location.pathname) === '/login');
  if (onAdmin) return <Suspense fallback={null}><AdminPage /></Suspense>;
  return onApplication ? <ApplicationRoute /> : <Home login={onLogin} />;
}
