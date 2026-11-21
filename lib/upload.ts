// Sends one file to /api/application-files. Phone pictures are shrunk first so they stay well
// under the 4 MB limit; PDFs are sent as they are.

export type UploadKind = 'transcript' | 'clearance' | 'savings' | 'photo' | 'signature';

export const MAX_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 2000;
const ACCEPT = /^(image\/(jpeg|png|webp)|application\/pdf)$/;

/** Shrinks a large picture to at most 2000 px on its long side, as a JPEG. Other files are returned as they are. */
async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.fillStyle = '#fff'; // a transparent PNG becomes white, not black, as a JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const out = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', 0.86));
  return out && out.size < file.size ? out : file;
}

/** Uploads a file (or a drawn signature) and returns its id. Throws an Error with a message for the applicant. */
export async function uploadFile(file: File | Blob, kind: UploadKind, name = (file as File).name ?? ''): Promise<string> {
  if (file.type && !ACCEPT.test(file.type)) throw new Error('Please upload a JPG, PNG, WebP or PDF.');
  const body = file instanceof File ? await shrink(file) : file;
  if (body.size > MAX_BYTES) throw new Error('That file is larger than 4 MB. Please send a smaller one.');
  let res: Response;
  try {
    res = await fetch(`/api/application-files?kind=${kind}`, {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream', 'x-file-name': encodeURIComponent(name).slice(0, 80) },
      body,
    });
  } catch {
    throw new Error('The upload did not go through. Please check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) throw new Error(data.error || 'The upload did not go through. Please try again.');
  return data.id as string;
}
