import { useEffect, useRef } from 'react';

const MODELS = [
  { src: '/assets/img/hero/model-1.webp', alt: 'Navy and amber PHirst townhouses with stone accents at night' },
  { src: '/assets/img/hero/model-2.webp', alt: 'Blue-grey and white PHirst townhouses at night' },
  { src: '/assets/img/hero/model-3.webp', alt: 'White and yellow PHirst rowhouses at night' },
  { src: '/assets/img/hero/model-4.webp', alt: 'Single-attached PHirst homes at night' },
  { src: '/assets/img/hero/model-5.webp', alt: 'Two-storey PHirst homes with wood accents at night' },
  { src: '/assets/img/hero/model-6.webp', alt: 'Charles and Corin PHirst homes with balconies at night' },
];

// Real links placed over the six pill buttons painted into the artwork.
// Positions are percentages of the 1672x941 image, so they follow it at any size.
const LINKS = [
  { label: 'House Models', href: '/house-models/', left: 11.96, width: 14.42 },
  { label: 'Locations', href: '/locations/', left: 27.39, width: 11.01 },
  { label: 'Calculator', href: '/calculator', left: 39.41, width: 11.78 },
  { label: 'Careers', href: '/careers/', left: 52.27, width: 10.17 },
  { label: 'Book a Viewing', href: '/contact/', left: 63.46, width: 14.77 },
  { label: 'Contact', href: '/contact/', left: 79.31, width: 9.63 },
];
const PILL_TOP = 2.55;
const PILL_HEIGHT = 6.5;

// Scroll progress (0..1) windows, one per wipe, with a short rest between them.
const WIPES: [number, number][] = MODELS.slice(1).map((_, i, all) => {
  const span = 1 / all.length;
  return [i * span + span * 0.1, (i + 1) * span - span * 0.1];
});

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Desktop (>=1024px): a tall scroll track pins a full-screen stage while the six
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
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [desktop]);

  return (
    <section aria-label="PHirst house models" className="bg-night">
      <div ref={trackRef} className="lg:h-[600vh]">
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[2/1] lg:sticky lg:top-0 lg:aspect-auto lg:h-screen">
          {(desktop ? MODELS : MODELS.slice(0, 1)).map((m, i) => (
            <img
              key={m.src}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              src={m.src}
              alt={m.alt}
              width={1672}
              height={941}
              draggable={false}
              fetchPriority={i === 0 ? 'high' : 'low'}
              // each later model is revealed from the right edge towards the left
              style={i === 0 ? undefined : { clipPath: 'inset(0 0 0 calc((1 - var(--w, 0)) * 100%))' }}
              className={
                desktop
                  ? // edge to edge, menu always visible, bottom may crop
                    'absolute inset-0 h-full w-full max-w-none select-none object-cover object-top'
                  : // mobile: cropped so the menu painted into the artwork is hidden
                    'absolute bottom-0 left-0 h-[114%] w-full max-w-none select-none object-cover object-bottom'
              }
            />
          ))}

          {/* Matches the object-fit: cover / top-center box of the artwork exactly. */}
          <nav
            aria-label="Main"
            className="absolute left-1/2 top-0 z-10 hidden aspect-[1672/941] w-[max(100%,calc(100vh*1672/941))] -translate-x-1/2 lg:block"
          >
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{ left: `${l.left}%`, top: `${PILL_TOP}%`, width: `${l.width}%`, height: `${PILL_HEIGHT}%` }}
                className="hero-hotspot absolute block rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-gold"
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
