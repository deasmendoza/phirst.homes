import { useEffect, useRef, type CSSProperties } from 'react';

const MODELS = [
  { src: '/assets/img/hero/unna.webp', alt: 'Unna single-attached homes at night' },
  { src: '/assets/img/hero/calista.webp', alt: 'Calista townhouses at night' },
  { src: '/assets/img/hero/amani.webp', alt: 'Amani townhouses at night' },
  { src: '/assets/img/hero/alora.webp', alt: 'Alora rowhouses at night' },
];

// Real links placed over the logo and menu painted into the artwork.
// Positions are percentages of the 1024x576 image, so they follow it at any size.
const LINKS = [
  { label: 'PHIRST.HOMES home', href: '/', left: 6.5, top: 2.2, width: 12, height: 21.4, round: true },
  { label: 'House Models', href: '/house-models/', left: 20.9, top: 1.2, width: 14.55, height: 12.2 },
  { label: 'Locations', href: '/locations/', left: 35.45, top: 1.2, width: 11.82, height: 12.2 },
  { label: 'Calculator', href: '/calculator', left: 47.27, top: 1.2, width: 12.01, height: 12.2 },
  { label: 'Careers', href: '/careers/', left: 59.28, top: 1.2, width: 11.72, height: 12.2 },
  { label: 'Book a Viewing', href: '/contact/', left: 71, top: 1.2, width: 14.94, height: 12.2 },
  { label: 'Contact', href: '/contact/', left: 85.94, top: 1.2, width: 10.8, height: 12.2 },
];

// Scroll progress (0..1) windows for the three quarter-turns.
const TURNS: [number, number][] = [
  [0.04, 0.32],
  [0.36, 0.64],
  [0.68, 0.96],
];

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Desktop (>=1024px): a tall scroll track pins a full-screen stage while the four
 * models turn like the faces of a cube, driven only by scroll position (no autoplay).
 * Below 1024px: a single static image.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const cube = cubeRef.current;
    if (!desktop || !track || !cube) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let target = 0;
    let current = 0;

    const read = () => {
      const total = track.offsetHeight - window.innerHeight;
      target = total > 0 ? clamp(-track.getBoundingClientRect().top / total) : 0;
    };
    const render = () => {
      // 0 = model 1 facing front, 1 = model 2, 2 = model 3, 3 = model 4
      const turn = TURNS.reduce((sum, [a, b]) => sum + clamp((current - a) / (b - a)), 0);
      cube.style.setProperty('--turn', turn.toFixed(4));
    };
    const size = () => cube.style.setProperty('--half', `${cube.offsetWidth / 2}px`);
    const tick = () => {
      raf = 0;
      current += (target - current) * (reduced.matches ? 1 : 0.16);
      if (Math.abs(target - current) < 0.0004) current = target;
      render();
      if (current !== target) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      read();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      size();
      onScroll();
    };

    size();
    read();
    current = target; // nothing moves on load
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [desktop]);

  return (
    <section aria-label="PHirst house models" className="bg-night">
      <div ref={trackRef} className="lg:h-[400vh]">
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[2/1] lg:sticky lg:top-0 lg:aspect-auto lg:h-screen">
          {desktop ? (
            <div className="hero-scene absolute inset-0">
              <div ref={cubeRef} className="hero-cube absolute inset-0">
                {MODELS.map((m, i) => (
                  <img
                    key={m.src}
                    src={m.src}
                    alt={m.alt}
                    width={1024}
                    height={576}
                    draggable={false}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    style={{ '--i': i } as CSSProperties}
                    // edge to edge, menu always visible, bottom may crop
                    className="hero-face absolute inset-0 h-full w-full max-w-none select-none object-cover object-top"
                  />
                ))}
              </div>
            </div>
          ) : (
            // mobile: one still image, cropped so the menu painted into the artwork is hidden
            <img
              src={MODELS[0].src}
              alt={MODELS[0].alt}
              width={1024}
              height={576}
              draggable={false}
              fetchPriority="high"
              className="absolute bottom-0 left-0 h-[131%] w-full max-w-none select-none object-cover object-bottom"
            />
          )}

          {/* Matches the object-fit: cover / top-center box of the artwork exactly. */}
          <nav
            aria-label="Main"
            className="absolute left-1/2 top-0 z-10 hidden aspect-video w-[max(100%,calc(100vh*16/9))] -translate-x-1/2 lg:block"
          >
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }}
                className={`hero-hotspot absolute block outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-gold ${l.round ? 'rounded-full' : 'rounded-2xl'}`}
              >
                <span className="sr-only">{l.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
