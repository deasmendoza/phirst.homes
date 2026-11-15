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
const LAST = MODELS.length - 1;

const LINKS = [
  { label: 'House Models', href: '/house-models/', primary: true },
  { label: 'Locations', href: '/locations/' },
  { label: 'Calculator', href: '/calculator' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Book a Viewing', href: '/contact/' },
  { label: 'Contact', href: '/contact/' },
];

const HOLD_MS = 1800; // rest on each house
const WIPE_MS = 1700; // one full reveal
const RESUME_MS = 2500; // wait this long after the last scroll or drag before playing again

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/** Scroll progress through the track (0..1) -> position in the sequence (0..LAST), with a rest on each house. */
function sequenceAt(progress: number) {
  const span = 1 / LAST;
  let pos = 0;
  for (let i = 0; i < LAST; i++) pos += clamp((progress - (i + 0.1) * span) / (0.8 * span));
  return pos;
}

/**
 * Desktop (>=1024px): a 600vh scroll track pins a 100vh stage. The six renders are stacked in
 * the same spot and never move; the next one is revealed by cutting it from the left edge
 * (clip-path only), with a 1px line on the cut.
 * `pos` (0..5) says where the sequence is: 2.25 = model 3 with model 4 a quarter revealed.
 *   - Left alone, it plays by itself: reveal, rest, reveal ... to the last house, then back.
 *   - Scrolling or dragging sideways takes over, and it resumes a moment after you stop.
 * Below 1024px: the first model only.
 */
export function Hero({ desktop }: { desktop: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!desktop || !track || !stage) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let visible = true;
    let pos = 0; // what is on screen
    let goal = 0; // where scrolling / dragging wants it
    let manualAt = -Infinity; // time of the last scroll or drag
    let dir = 1; // autoplay direction
    let leg: { from: number; to: number; start: number; ms: number } | null = null;
    let restUntil = performance.now() + HOLD_MS;
    let drag: { x: number; pos: number; id: number } | null = null;

    const draw = () => {
      for (let i = 1; i <= LAST; i++) {
        const cut = (1 - clamp(pos - (i - 1))) * 100; // 100% -> 0%
        const layer = layerRefs.current[i];
        if (layer) layer.style.clipPath = `inset(0 0 0 ${cut.toFixed(3)}%)`;
      }
      const part = pos - Math.floor(pos);
      const line = lineRef.current;
      if (line) {
        const moving = part > 0.0005 && part < 0.9995;
        line.style.opacity = moving ? '1' : '0';
        if (moving) line.style.left = `${((1 - part) * 100).toFixed(3)}%`;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const manual = drag !== null || now - manualAt < RESUME_MS;
      if (manual) {
        pos += (goal - pos) * 0.22;
        if (Math.abs(goal - pos) < 0.0005) pos = goal;
        leg = null;
        restUntil = now;
      } else if (!reduced.matches) {
        if (!leg && now >= restUntil) {
          if (pos >= LAST) dir = -1;
          else if (pos <= 0) dir = 1;
          const next = dir > 0 ? Math.floor(pos + 1e-6) + 1 : Math.ceil(pos - 1e-6) - 1;
          leg = { from: pos, to: clamp(next, 0, LAST), start: now, ms: WIPE_MS * Math.max(0.35, Math.abs(next - pos)) };
        }
        if (leg) {
          const k = clamp((now - leg.start) / leg.ms);
          pos = leg.from + (leg.to - leg.from) * ease(k);
          if (k >= 1) {
            pos = leg.to;
            leg = null;
            restUntil = now + HOLD_MS;
          }
        }
        goal = pos;
      }
      draw();
      if (visible) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    // Scrolling takes over, and the sequence follows the scroll position.
    const onScroll = () => {
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      goal = sequenceAt(clamp(-track.getBoundingClientRect().top / total));
      manualAt = performance.now();
      wake();
    };

    // Dragging sideways moves the cut with the pointer: one screen width = one house.
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest('a')) return;
      drag = { x: e.clientX, pos, id: e.pointerId };
      goal = pos;
      stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      goal = clamp(drag.pos - (e.clientX - drag.x) / stage.offsetWidth, 0, LAST);
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      manualAt = performance.now();
    };

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    seen.observe(stage);

    draw();
    wake();
    window.addEventListener('scroll', onScroll, { passive: true });
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    return () => {
      seen.disconnect();
      window.removeEventListener('scroll', onScroll);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [desktop]);

  return (
    <section aria-label="PHirst house models" className="bg-night">
      <div ref={trackRef} className="lg:h-[600vh]">
        <div
          ref={stageRef}
          className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden select-none sm:aspect-[2/1] lg:sticky lg:top-0 lg:aspect-auto lg:h-screen"
        >
          {/* The six renders, stacked in the same place. A later one is only ever cut from its left edge. */}
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
              style={{ zIndex: i + 1, clipPath: desktop && i > 0 ? 'inset(0 0 0 100%)' : undefined }}
              className="absolute inset-0 h-full w-full max-w-none object-cover object-top"
            />
          ))}

          {/* The cut line, from just below the menu to the bottom. */}
          {desktop && (
            <div
              ref={lineRef}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 top-[90px] z-10 w-px bg-white/75 opacity-0 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            />
          )}

          {/* The menu, above the cut line. Sizes follow the screen width. */}
          <nav
            aria-label="Main"
            className="absolute inset-x-0 top-[clamp(14px,1.6vw,30px)] z-20 hidden items-center justify-center gap-[0.85em] text-[clamp(13px,1.45vw,26px)] leading-[1.2] lg:flex"
          >
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} draggable={false} className={`hero-pill ${l.primary ? 'hero-pill--primary' : ''}`}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
