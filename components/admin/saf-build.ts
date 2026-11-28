// Builds the Sellers Accreditation Form PDF inside the admin page. The PDF code, the official
// form (template) and the font are only loaded here, so the public site does not carry them.
import templateUrl from '@/lib/saf/saf-template.pdf?url';
import fontUrl from '@fontsource/caudex/files/caudex-latin-400-normal.woff?url';
import type { Checklist, SafApplication } from '@/lib/saf/saf-pdf';

export type { Checklist, SafApplication };

const bytes = async (url: string) => {
  const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
  if (!r.ok) throw new Error('file');
  return new Uint8Array(await r.arrayBuffer());
};

let statics: Promise<[Uint8Array, Uint8Array]> | null = null;
const loadStatics = () => (statics ??= Promise.all([bytes(templateUrl), bytes(fontUrl)]));

/** pdf-lib takes JPG and PNG only: anything else (WebP) is redrawn as PNG. */
async function forPdf(b: Uint8Array): Promise<Uint8Array> {
  if ((b[0] === 0x89 && b[1] === 0x50) || (b[0] === 0xff && b[1] === 0xd8)) return b;
  const bitmap = await createImageBitmap(new Blob([b as BlobPart]));
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob((x) => (x ? res(x) : rej(new Error('png'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

const pictures = new Map<string, Promise<Uint8Array | null>>();
/** An uploaded picture (2x2 or signature), ready for the PDF. A missing one is simply left out. */
export function loadPicture(fileId?: string): Promise<Uint8Array | null> {
  if (!fileId) return Promise.resolve(null);
  if (!pictures.has(fileId)) {
    pictures.set(fileId, bytes(`/api/admin/files/${fileId}`).then(forPdf).catch(() => null));
  }
  return pictures.get(fileId)!;
}

export async function makePdf(opts: { app: SafApplication; photo: Uint8Array | null; signature: Uint8Array | null; checklist: Partial<Checklist> }) {
  const [{ buildSafPdf }, [template, caudex]] = await Promise.all([import('@/lib/saf/saf-pdf'), loadStatics()]);
  return buildSafPdf({ ...opts, template, caudex });
}

export async function autoTicks(app: SafApplication) {
  return (await import('@/lib/saf/saf-pdf')).autoChecklist(app);
}
