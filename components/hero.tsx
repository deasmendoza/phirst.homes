import { useEffect, useRef } from 'react';

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
  { label: 'Calculator', href: '/calculator/', left: 47.27, top: 1.2, width: 12.01, height: 12.2 },
  { label: 'Careers', href: '/careers/', left: 59.28, top: 1.2, width: 11.72, height: 12.2 },
  { label: 'Book a Viewing', href: '/contact/', left: 71, top: 1.2, width: 14.94, height: 12.2 },
  { label: 'Contact', href: '/contact/', left: 85.94, top: 1.2, width: 10.8, height: 12.2 },
];

// Scroll progress (0..1) windows for the three wipes.
const WIPES: [number, number][] = [
  [0.04, 0.32],
  [0.36, 0.64],
  [0.68, 0.96],
];

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Desktop (>=1024px): a tall scroll track pins a full-screen stage while the four
 * models wipe right-to-left, driven only by scroll position (no autoplay).
 * Below 1024px: a single static image.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!desktop || !track) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let target = 0;
    let current = 0;

    const read = () => {
      const total = track.offsetHeight - window.innerHeight;
      target = total > 0 ? clamp(-track.getBoundingClientRect().top / total) : 0;
    };
    const render = () => {
      WIPES.forEach(([a, b], i) => {
        const w = clamp((current - a) / (b - a));
        layerRefs.current[i + 1]?.style.setProperty('--w', w.toFixed(4));
      });
    };
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

    read();
    current = target; // nothing moves on load
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const layers = layerRefs.current;
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      layers.forEach((l) => l?.style.removeProperty('--w'));
    };
  }, [desktop]);

  return (
    <section aria-label="PHirst house models" className="bg-night">
      <div ref={trackRef} className="lg:h-[400vh]">
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[2/1] lg:sticky lg:top-0 lg:aspect-auto lg:h-screen">
          {MODELS.map((m, i) => (
            <img
              key={m.src}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              src={m.src}
              alt={m.alt}
              width={1024}
              height={576}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              style={i === 0 ? undefined : { clipPath: 'inset(0 0 0 calc((1 - var(--w, 0)) * 100%))' }}
              className={[
                'absolute left-0 w-full max-w-none select-none object-cover',
                // mobile: crop away the menu painted into the top of the artwork
                'bottom-0 h-[131%] object-bottom',
                // desktop: edge to edge, menu always visible, bottom may crop
                'lg:inset-0 lg:h-full lg:object-top',
                i === 0 ? '' : 'hidden lg:block',
              ].join(' ')}
            />
          ))}

          {/* Matches the object-fit: cover / top-center box of the artwork exactly. */}
          <nav
            aria-label="Main"
            className="absolute left-1/2 top-0 hidden aspect-video w-[max(100%,calc(100vh*16/9))] -translate-x-1/2 lg:block"
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
