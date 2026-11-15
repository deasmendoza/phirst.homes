import { useEffect, useRef } from 'react';

// The still night scene (sky, moon, trees, lamps, driveway) behind every house.
const SCENE = '/assets/img/hero/night-scene.webp';

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

// Scroll progress (0..1) windows, one per reveal, with a short rest between them.
const REVEALS: [number, number][] = MODELS.slice(1).map((_, i, all) => {
  const span = 1 / all.length;
  return [i * span + span * 0.1, (i + 1) * span - span * 0.1];
});

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Desktop (>=1024px): a 600vh scroll track pins a 100vh stage. The six models are stacked
 * in the same spot and never move. Scrolling moves a vertical cut from the right edge to
 * the left edge of the next model (clip-path only), with a 1px hairline on the cut.
 * Nothing plays by itself: the cut sits exactly where the scroll position puts it.
 * Below 1024px: the first model only.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!desktop || !track) return;
    let raf = 0;

    const render = () => {
      raf = 0;
      const total = track.offsetHeight - window.innerHeight;
      const top = track.getBoundingClientRect().top + window.scrollY;
      const progress = total > 0 ? clamp((window.scrollY - top) / total) : 0;

      let cutLine = -1; // where the cut is, in % from the left, while a reveal is under way
      REVEALS.forEach(([a, b], i) => {
        const cut = (1 - clamp((progress - a) / (b - a))) * 100; // 100% -> 0%
        const layer = layerRefs.current[i + 1];
        if (layer) layer.style.clipPath = `inset(0 0 0 ${cut.toFixed(3)}%)`;
        if (cut > 0 && cut < 100) cutLine = cut;
      });

      const line = lineRef.current;
      if (line) {
        line.style.opacity = cutLine < 0 ? '0' : '1';
        if (cutLine >= 0) line.style.left = `${cutLine.toFixed(3)}%`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

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
          {/* One full-screen layer per model: the night scene with the house on it. All six sit
              in the same place; a later layer is only ever cut, from its left edge. */}
          {(desktop ? MODELS : MODELS.slice(0, 1)).map((m, i) => (
            <div
              key={m.src}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              className="absolute inset-0 h-full w-full bg-cover bg-center"
              style={{
                zIndex: i + 1,
                backgroundImage: `url(${SCENE})`,
                clipPath: desktop && i > 0 ? 'inset(0 0 0 100%)' : undefined,
              }}
            >
              <img
                src={m.src}
                alt={m.alt}
                width={1672}
                height={941}
                draggable={false}
                fetchPriority={i === 0 ? 'high' : 'low'}
                className="absolute inset-0 h-full w-full max-w-none select-none object-cover object-center"
              />
            </div>
          ))}

          {/* The cut line: 1px, soft glow, placed by the same scroll progress. */}
          {desktop && (
            <div
              ref={lineRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/45 opacity-0 shadow-[0_0_10px_1px_rgba(255,255,255,0.35)]"
            />
          )}

          {/* The menu, above the cut line. Sizes follow the screen width. */}
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
