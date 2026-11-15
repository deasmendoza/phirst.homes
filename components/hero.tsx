import { useEffect, useRef } from 'react';

const VIDEO = '/assets/video/night-sky.mp4';
const POSTER = '/assets/img/hero/night-poster.webp';

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

// Both layers use the same box, so the houses always sit on the video's driveway.
const FILL = 'absolute inset-0 h-full w-full max-w-none select-none object-cover object-center';

/**
 * Desktop (>=1024px): a tall scroll track pins a full-screen stage made of three layers:
 *   1. the looping night-sky video, which never moves,
 *   2. the six house cut-outs, wiped right-to-left by scroll position only (no autoplay),
 *   3. the menu, which never moves.
 * Below 1024px: a still frame of the video with the first house.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Layer 1: the video plays on its own, unless the visitor asked for reduced motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!desktop || !video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      video.muted = true;
      if (reduced.matches) video.pause();
      else video.play().catch(() => {});
    };
    sync();
    reduced.addEventListener('change', sync);
    return () => reduced.removeEventListener('change', sync);
  }, [desktop]);

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
      WIPES.forEach(([a, b], i) => {
        const w = clamp((current - a) / (b - a)).toFixed(4);
        layerRefs.current[i]?.style.setProperty('--out', w); // the house being covered
        layerRefs.current[i + 1]?.style.setProperty('--in', w); // the house being revealed
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
          {/* Layer 1: night sky, never wipes */}
          {desktop ? (
            <video
              ref={videoRef}
              src={VIDEO}
              poster={POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              className={`${FILL} z-[1]`}
            />
          ) : (
            <img src={POSTER} alt="" width={1920} height={1080} draggable={false} fetchPriority="high" className={`${FILL} z-[1]`} />
          )}

          {/* Layer 2: the houses. Each one is revealed from the right edge towards the left
              while the one before it is cut away along the same line. */}
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

          {/* Layer 3: the menu, never wipes. Sizes follow the screen width like the artwork did. */}
          <nav
            aria-label="Main"
            className="absolute inset-x-0 top-[clamp(14px,1.6vw,30px)] z-10 hidden items-center justify-center gap-[0.85em] text-[clamp(13px,1.45vw,26px)] leading-[1.2] lg:flex"
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
