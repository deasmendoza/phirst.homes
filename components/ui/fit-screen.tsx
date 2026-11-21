import { useEffect, useRef, type ReactNode } from 'react';

const DESKTOP = '(min-width: 1024px)';
const NAV = 64; // room kept clear under the fixed menu bar, in screen pixels
const MIN_ZOOM = 0.55; // never shrink a section below this

/**
 * Desktop "website view": the section inside is shown whole on one screen. When its content is
 * taller than the window (a short laptop screen, or a province with many projects opened), the
 * section is scaled down evenly, like zooming the browser out, instead of running off the
 * bottom. It is never scaled up. Below 1024px the section is left as it is.
 */
export function FitScreen({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const section = box?.firstElementChild as HTMLElement | null;
    if (!box || !section) return;
    const mq = window.matchMedia(DESKTOP);
    let raf = 0;

    const fit = () => {
      raf = 0;
      // If this section is above the screen, its change in height must not move what the visitor
      // is looking at (e.g. a page opened on /careers while the sections above are still settling).
      const before = box.getBoundingClientRect();
      const keep = () => {
        if (before.bottom > 1) return;
        const grew = box.getBoundingClientRect().height - before.height;
        if (Math.abs(grew) > 0.5) window.scrollBy({ top: grew, behavior: 'instant' });
      };

      // Measure the section at full size with no forced height.
      box.style.removeProperty('zoom');
      section.style.removeProperty('min-height');
      section.style.removeProperty('padding-top');
      if (!mq.matches) return keep();

      const screen = window.innerHeight;
      section.style.minHeight = '0px';
      const height = section.getBoundingClientRect().height;
      const top = parseFloat(getComputedStyle(section).paddingTop) || 0;

      let zoom = Math.min(1, screen / height);
      let padTop: number | null = null;
      if (top * zoom < NAV) {
        // The scaled top padding would slip under the menu bar: keep NAV pixels for it.
        zoom = Math.min(1, (screen - NAV) / Math.max(1, height - top));
        padTop = NAV / zoom;
      }
      zoom = Math.max(MIN_ZOOM, zoom);

      if (zoom < 0.999) {
        box.style.setProperty('zoom', zoom.toFixed(4));
        if (padTop !== null) section.style.paddingTop = `${padTop.toFixed(1)}px`;
      }
      // Fill exactly one screen (the section's own min-h-screen would be scaled too).
      section.style.minHeight = `${(screen / zoom).toFixed(1)}px`;
      keep();
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(fit);
    };

    // Re-fit when the window changes, when pictures or fonts load, and when content opens or closes.
    const sizes = new ResizeObserver(ask);
    sizes.observe(section);
    const content = new MutationObserver(ask);
    content.observe(section, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', ask);
    mq.addEventListener('change', ask);
    fit();

    return () => {
      sizes.disconnect();
      content.disconnect();
      window.removeEventListener('resize', ask);
      mq.removeEventListener('change', ask);
      if (raf) cancelAnimationFrame(raf);
      box.style.removeProperty('zoom');
      section.style.removeProperty('min-height');
      section.style.removeProperty('padding-top');
    };
  }, []);

  return <div ref={boxRef}>{children}</div>;
}
