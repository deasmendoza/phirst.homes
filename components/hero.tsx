import { useEffect, useRef } from 'react';

// Full-bleed renders, one per model. The menu that was painted into them has been
// replaced by plain sky, because the menu below is real HTML.
const MODELS = [
  { src: '/assets/img/hero/model-1.webp', alt: 'Navy and amber PHirst townhouses with stone accents at night' },
  { src: '/assets/img/hero/model-2.webp', alt: 'Blue-grey and white PHirst townhouses at night' },
  { src: '/assets/img/hero/model-3.webp', alt: 'White and yellow PHirst rowhouses at night' },
  { src: '/assets/img/hero/model-4.webp', alt: 'Single-attached PHirst homes at night' },
  { src: '/assets/img/hero/model-5.webp', alt: 'Cartland, Charles and Christie PHirst homes at night' },
  { src: '/assets/img/hero/model-6.webp', alt: 'Charles and Corin PHirst homes with balconies at night' },
];

const LINKS = [
  { label: 'House Models', href: '/house-models/', primary: true },
  { label: 'Locations', href: '/locations/' },
  { label: 'Calculator', href: '/calculator' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Book a Viewing', href: '/contact/' },
  { label: 'Contact', href: '/contact/' },
];

const SLICES = 4; // wedges, one every 90 degrees
const WEDGE = 360 / SLICES;
const CENTER = '50% 52%';
const START_DEG = 30; // where the first wedge opens
const TURN_DEG = 90; // how far the wedges rotate while they open

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Scroll progress (0..1) windows, one per reveal, with a short rest between them.
const REVEALS: [number, number][] = MODELS.slice(1).map((_, i, all) => {
  const span = 1 / all.length;
  return [i * span + span * 0.1, (i + 1) * span - span * 0.1];
});

/** Four wedges, each `open` degrees wide, starting at `from` degrees (0 = straight up, clockwise). */
function wedgeMask(from: number, open: number) {
  const stops: string[] = [];
  for (let k = 0; k < SLICES; k++) {
    const a = k * WEDGE;
    stops.push(`#000 ${a}deg ${(a + open).toFixed(3)}deg`, `transparent ${(a + open).toFixed(3)}deg ${a + WEDGE}deg`);
  }
  return `conic-gradient(from ${from.toFixed(3)}deg at ${CENTER}, ${stops.join(', ')})`;
}

/**
 * Desktop (>=1024px): a 600vh scroll track pins a 100vh stage. The six renders are stacked in
 * the same spot and never move. Scrolling reveals the next one through four "pizza slices"
 * around the centre of the screen that widen and rotate until they close the full circle
 * (a conic-gradient mask), with hairlines on the slice edges. Scrolling up reverses it.
 * Nothing plays by itself.
 * Below 1024px: the first model only.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linesRef = useRef<HTMLDivElement>(null);

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
    const draw = () => {
      let live = -1; // progress of the reveal that is under way, if any
      REVEALS.forEach(([a, b], i) => {
        const w = clamp((current - a) / (b - a));
        const layer = layerRefs.current[i + 1];
        if (!layer) return;
        if (w <= 0) {
          layer.style.visibility = 'hidden';
        } else {
          const mask = w >= 1 ? 'none' : wedgeMask(START_DEG + w * TURN_DEG, w * WEDGE);
          layer.style.visibility = 'visible';
          layer.style.maskImage = mask;
          layer.style.setProperty('-webkit-mask-image', mask);
          if (w < 1) live = w;
        }
      });

      // Hairlines on the slice edges. Opposite wedges share an edge, so each line runs through
      // the centre: two on the leading edges, two on the trailing edges.
      const lines = linesRef.current;
      if (lines) lines.style.opacity = live < 0 ? '0' : '1';
      if (live >= 0) {
        const from = START_DEG + live * TURN_DEG;
        [from, from + WEDGE, from + live * WEDGE, from + WEDGE + live * WEDGE].forEach((deg, k) => {
          const line = lineRefs.current[k];
          if (line) line.style.rotate = `${deg.toFixed(3)}deg`;
        });
      }
    };
    const tick = () => {
      raf = 0;
      current += (target - current) * (reduced.matches ? 1 : 0.2);
      if (Math.abs(target - current) < 0.0004) current = target;
      draw();
      if (current !== target) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      read();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    read();
    current = target; // nothing moves on load
    draw();
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
          {/* The six renders, stacked in the same place. A later one is only ever masked. */}
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
              style={{ zIndex: i + 1, visibility: desktop && i > 0 ? 'hidden' : undefined }}
              className="absolute inset-0 h-full w-full max-w-none select-none object-cover object-top"
            />
          ))}

          {/* Slice-edge hairlines, kept below the menu. */}
          {desktop && (
            <div
              ref={linesRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 opacity-0 [clip-path:inset(88px_0_0_0)]"
            >
              {[0, 1, 2, 3].map((k) => (
                <div
                  key={k}
                  ref={(el) => {
                    lineRefs.current[k] = el;
                  }}
                  className="hero-slice-line"
                />
              ))}
            </div>
          )}

          {/* The menu, above the hairlines. Sizes follow the screen width. */}
          <nav
            aria-label="Main"
            className="absolute inset-x-0 top-[clamp(14px,1.6vw,30px)] z-20 hidden items-center justify-center gap-[0.85em] text-[clamp(13px,1.45vw,26px)] leading-[1.2] lg:flex"
          >
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className={`hero-pill ${l.primary ? 'hero-pill--primary' : ''}`}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
