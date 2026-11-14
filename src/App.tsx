import { useEffect, useState } from 'react';
import { Component as SpotlightCursor } from '@/components/ui/spotlight-cursor';
import { Hero } from '@/components/hero';
import { MobileHeader } from '@/components/mobile-header';

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

export default function App() {
  const desktop = useDesktop();
  return (
    <>
      <MobileHeader />
      <main>
        <Hero desktop={desktop} />
      </main>
      {desktop && (
        <SpotlightCursor className="" config={{ color: '#f5b942', radius: 220, brightness: 0.14 }} />
      )}
    </>
  );
}
