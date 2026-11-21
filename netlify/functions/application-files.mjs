// POST /api/application-files?kind=transcript|clearance|savings|photo|signature
//
// Saves one file from the application form (Netlify Blobs) and answers with its id; the
// application then refers to the file by that id. Pictures and PDFs only, 4 MB at most; the
// contents are checked, not just the name. Files from a Deploy Preview are kept apart from
// the live site's files. Nothing can be read back from here: files will be opened through
// the private admin page, which is not built yet.

import { getStore } from '@netlify/blobs';

export const KINDS = ['transcript', 'clearance', 'savings', 'photo', 'signature'];
export const MAX_BYTES = 4 * 1024 * 1024; // keeps the request under Netlify's size limit

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** The real type of a file, from its first bytes. Null when it is not a JPG, PNG, WebP or PDF. */
export function sniff(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  if (b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  return null;
}

/** Checks an upload. Returns { type } when it is fine, or { error } to show the applicant. */
export function checkFile(bytes, kind) {
  if (!KINDS.includes(kind)) return { error: 'That upload is not recognised.' };
  if (!bytes.length) return { error: 'That file is empty.' };
  if (bytes.length > MAX_BYTES) return { error: 'That file is larger than 4 MB. Please send a smaller one.' };
  const type = sniff(bytes);
  if (!type) return { error: 'Please upload a JPG, PNG, WebP or PDF.' };
  if ((kind === 'photo' || kind === 'signature') && type === 'application/pdf') return { error: 'Please upload a picture (JPG, PNG or WebP).' };
  return { type };
}

export default async function handler(req, context) {
  if (req.method !== 'POST') return json(405, { error: 'Not allowed.' });
  const kind = new URL(req.url).searchParams.get('kind') ?? '';
  if (Number(req.headers.get('content-length') || 0) > MAX_BYTES + 1024) return json(413, { error: 'That file is larger than 4 MB. Please send a smaller one.' });

  let bytes;
  try {
    bytes = new Uint8Array(await req.arrayBuffer());
  } catch {
    return json(400, { error: 'The file could not be read.' });
  }
  const { type, error } = checkFile(bytes, kind);
  if (error) return json(422, { error });

  try {
    const space = context?.deploy?.context === 'production' ? 'live' : 'preview';
    const id = crypto.randomUUID();
    const name = String(req.headers.get('x-file-name') ?? '').replace(/[^\w.\- ]+/g, '').slice(0, 80);
    await getStore({ name: `application-files-${space}`, consistency: 'strong' }).set(id, bytes.buffer, {
      metadata: { kind, type, size: bytes.length, name, receivedAt: new Date().toISOString() },
    });
    return json(200, { id });
  } catch (err) {
    console.error('application-files:', err);
    return json(503, { error: 'Your file could not be saved right now. Please try again in a moment.' });
  }
}

export const config = { path: '/api/application-files' };
