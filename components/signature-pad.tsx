import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface SignaturePadHandle {
  /** True once something has been drawn. */
  isEmpty: () => boolean;
  /** The drawing as a PNG on a white background. */
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
}

/** A box to sign in with a finger, pen or mouse. Dark ink on white, so it reads on any screen. */
export const SignaturePad = forwardRef<SignaturePadHandle, { label: string; onChange?: (empty: boolean) => void }>(function SignaturePad({ label, onChange }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const bounds = useRef({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
  const [empty, setEmpty] = useState(true);

  const paint = () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(paint, []);

  const clear = () => {
    paint();
    dirty.current = false;
    bounds.current = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    setEmpty(true);
    onChange?.(true);
  };

  useImperativeHandle(ref, () => ({
    isEmpty: () => !dirty.current,
    // The picture is cropped to the ink (with a little room), so it sits well on the form.
    toBlob: () =>
      new Promise((done) => {
        const c = canvas.current;
        if (!c) return done(null);
        const b = bounds.current;
        const pad = 14;
        const x = Math.max(0, Math.floor(b.x0 - pad));
        const y = Math.max(0, Math.floor(b.y0 - pad));
        const w = Math.min(c.width, Math.ceil(b.x1 + pad)) - x;
        const h = Math.min(c.height, Math.ceil(b.y1 + pad)) - y;
        if (!(w > 0 && h > 0)) return c.toBlob(done, 'image/png');
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        out.getContext('2d')?.drawImage(c, x, y, w, h, 0, 0, w, h);
        out.toBlob(done, 'image/png');
      }),
    clear,
  }));

  const at = (e: React.PointerEvent) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height] as const;
  };

  const grow = (x: number, y: number) => {
    const b = bounds.current;
    b.x0 = Math.min(b.x0, x);
    b.y0 = Math.min(b.y0, y);
    b.x1 = Math.max(b.x1, x);
    b.y1 = Math.max(b.y1, y);
  };

  const down = (e: React.PointerEvent) => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const [x, y] = at(e);
    grow(x, y);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y); // a tap leaves a dot
    ctx.stroke();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const [x, y] = at(e);
    grow(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!dirty.current) {
      dirty.current = true;
      setEmpty(false);
      onChange?.(false);
    }
  };
  const up = () => {
    drawing.current = false;
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-[10px] border border-[#d9b35f]/75">
        <canvas
          ref={canvas}
          width={900}
          height={260}
          role="img"
          aria-label={label}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
          className="block h-[clamp(120px,22vw,170px)] w-full cursor-crosshair touch-none bg-white"
        />
        {empty && <span className="pointer-events-none absolute inset-0 grid place-items-center text-[15px] text-black/35">Sign here</span>}
      </div>
      <button type="button" onClick={clear} disabled={empty} className="mt-1.5 text-[14px] font-semibold text-gold-soft underline-offset-2 hover:underline disabled:cursor-default disabled:text-white/35 disabled:no-underline">
        Clear signature
      </button>
    </div>
  );
});
