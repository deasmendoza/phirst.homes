import { useEffect, useRef } from 'react';

const SKY = '/assets/img/hero/night-scene.webp';

// Transparent cut-outs: only the houses, their fences and front bushes.
const MODELS = [
  { src: '/assets/img/hero/house-1.webp', alt: 'Navy and amber PHirst townhouses with stone accents' },
  { src: '/assets/img/hero/house-2.webp', alt: 'Blue-grey and white PHirst townhouses' },
  { src: '/assets/img/hero/house-3.webp', alt: 'White and yellow PHirst rowhouses' },
  { src: '/assets/img/hero/house-4.webp', alt: 'Single-attached PHirst homes' },
  { src: '/assets/img/hero/house-5.webp', alt: 'Cartland, Charles and Christie PHirst homes' },
  { src: '/assets/img/hero/house-6.webp', alt: 'Charles and Corin PHirst homes with balconies' },
];

const LINKS = [
  { label: 'House Models', href: '/house-models/', primary: true },
  { label: 'Locations', href: '/locations/' },
  { label: 'Calculator', href: '/calculator' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Book a Viewing', href: '/contact/' },
  { label: 'Contact', href: '/contact/' },
];

// Scroll progress (0..1) windows, one per wipe, with a short rest between them.
const WIPES: [number, number][] = MODELS.slice(1).map((_, i, all) => {
  const span = 1 / all.length;
  return [i * span + span * 0.1, (i + 1) * span - span * 0.1];
});

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Both layers use the same box, so the houses always sit on the scene's driveway.
const FILL = 'absolute inset-0 h-full w-full max-w-none select-none object-cover object-center';

/**
 * Desktop (>=1024px): a tall scroll track pins a full-screen stage made of three layers:
 *   1. the still night scene (sky, trees, lamps, driveway), which never moves,
 *   2. the six house cut-outs, stacked and stationary, revealed by a vertical split that
 *      scroll position moves right to left (no autoplay),
 *   3. the menu, which never moves.
 * Below 1024px: the night scene with the first house.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  // Layer 2: scroll position drives the wipes.
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
      let split = -1; // progress of the reveal that is under way, if any
      WIPES.forEach(([a, b], i) => {
        const w = clamp((current - a) / (b - a));
        if (w > 0 && w < 1) split = w;
        layerRefs.current[i]?.style.setProperty('--out', w.toFixed(4)); // the house being covered
        layerRefs.current[i + 1]?.style.setProperty('--in', w.toFixed(4)); // the house being revealed
      });
      // The hairline rides the split boundary and is hidden while a house is at rest.
      const line = lineRef.current;
      if (line) {
        line.style.opacity = split < 0 ? '0' : '1';
        if (split >= 0) line.style.left = `${((1 - split) * 100).toFixed(3)}%`;
      }
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
          {/* Layer 1: the night scene, a still image that never moves */}
          <img src={SKY} alt="" width={1920} height={1080} draggable={false} fetchPriority="high" className={`${FILL} z-[1]`} />

          {/* Layer 2: the houses, stacked in the same spot and never moved. A vertical split travels
              right to left: the next house shows on its right, the current one on its left. */}
          <div className="absolute inset-0 z-[2]">
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
                style={
                  desktop
                    ? { clipPath: `inset(0 calc(var(--out, 0) * 100%) 0 calc((1 - var(--in, ${i === 0 ? 1 : 0})) * 100%))` }
                    : undefined
                }
                className={FILL}
              />
            ))}
          </div>

          {/* The split boundary: a 1px hairline with a soft glow, moved by the same scroll progress. */}
          {desktop && (
            <div
              ref={lineRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 z-[3] w-px -translate-x-1/2 bg-white/45 opacity-0 shadow-[0_0_10px_1px_rgba(255,255,255,0.35)]"
            />
          )}

          {/* Layer 3: the menu, never wipes. Sizes follow the screen width like the artwork did. */}
          <nav
            aria-label="Main"
            className="absolute inset-x-0 top-[clamp(14px,1.6vw,30px)] z-20 hidden items-center justify-center gap-[0.85em] text-[clamp(13px,1.45vw,26px)] leading-[1.2] lg:flex"
          >
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`hero-pill ${l.primary ? 'hero-pill--primary' : ''}`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
