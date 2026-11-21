import { useEffect, useRef, useState } from 'react';
import layout from '@/lib/saf/layout.json';

// Shows the generated PDF right in the page (all pages, as pictures) so the admin can see exactly
// what will be downloaded. The small X sits over the 2x2 frame on page 1.
const PHOTO = (layout as unknown as { photo: { x0: number; y0: number; x1: number; y1: number } }).photo;

export function PdfPreview({ pdf, hasPhoto, photoRemoved, onTogglePhoto }: { pdf: Uint8Array | null; hasPhoto: boolean; photoRemoved: boolean; onTogglePhoto: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<{ w: number; h: number }[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pdf || !host.current) return;
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const doc = await pdfjs.getDocument({ data: pdf.slice() }).promise;
        const el = host.current!;
        const width = Math.min(el.clientWidth || 800, 900);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sizes: { w: number; h: number }[] = [];
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = width / base.width;
          const vp = page.getViewport({ scale: scale * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${base.height * scale}px`;
          canvas.className = 'block bg-white';
          await page.render({ canvas, viewport: vp }).promise;
          sizes.push({ w: base.width, h: base.height });
          canvases.push(canvas);
        }
        if (dead) return;
        canvases.forEach((c, i) => {
          const slot = el.querySelector<HTMLElement>(`[data-page="${i}"]`);
          slot?.replaceChildren(c);
        });
        setPages(sizes);
        setError(false);
        void doc.destroy();
      } catch {
        if (!dead) setError(true);
      }
    })();
    return () => {
      dead = true;
    };
  }, [pdf]);

  const count = pages.length || 3;
  return (
    <div ref={host} className="grid gap-4">
      {error && <p className="rounded-lg bg-[#2a0d0b] p-3 text-[14px] text-[#ff8f86]">The PDF can't be shown here, but you can still download it.</p>}
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="relative mx-auto w-full max-w-[900px] overflow-hidden rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)]" aria-label={`Page ${i + 1}`}>
          <div data-page={i} className="min-h-[200px] bg-white/90" />
          {i === 0 && pages[0] && hasPhoto && (
            <button
              type="button"
              onClick={onTogglePhoto}
              title={photoRemoved ? 'Restore the 2x2 picture' : 'Remove the 2x2 picture from the PDF'}
              aria-label={photoRemoved ? 'Restore 2x2 picture' : 'Remove 2x2 picture'}
              style={
                photoRemoved
                  ? { left: `${(PHOTO.x0 / pages[0].w) * 100}%`, top: `${(PHOTO.y0 / pages[0].h) * 100}%`, width: `${((PHOTO.x1 - PHOTO.x0) / pages[0].w) * 100}%`, height: `${((PHOTO.y1 - PHOTO.y0) / pages[0].h) * 100}%` }
                  : { left: `${((PHOTO.x1 - 9) / pages[0].w) * 100}%`, top: `${((PHOTO.y0 - 9) / pages[0].h) * 100}%` }
              }
              className={
                photoRemoved
                  ? 'absolute grid place-items-center border-2 border-dashed border-[#c2933a] bg-[#c2933a]/10 text-[11px] font-bold leading-tight text-[#8a6212]'
                  : 'absolute grid size-[22px] place-items-center rounded-full bg-[#b3261e] text-[13px] font-bold leading-none text-white shadow ring-2 ring-white'
              }
            >
              {photoRemoved ? 'Restore' : '×'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
