// POST /api/applications
//
// Saves a job application from the Careers form on the website itself (Netlify Blobs).
// Nothing is e-mailed and nothing can be read back from here: applications will be read
// through the private admin page, which is not built yet.
//
// Applications sent from a Deploy Preview are kept apart from the live site's applications.

import { getStore } from '@netlify/blobs';

// Constant details that go with every application. Visitors cannot change these.
const JOB = {
  position: 'International Territory Specialist',
  team: 'Team M-BigTime',
};

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Checks a submitted form. Returns { application } when it is complete, or { error } to show the applicant. */
export function readApplication(body) {
  const a = {
    fullName: text(body.fullName, 120),
    mobile: text(body.mobile, 40),
    email: text(body.email, 160),
    location: text(body.location, 160),
    message: String(body.message ?? '').trim().slice(0, 1000),
  };
  if (!a.fullName) return { error: 'Please give your full name.' };
  if (a.mobile.replace(/\D/g, '').length < 7) return { error: 'Please give a mobile number we can reach you on.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return { error: 'Please check your e-mail address.' };
  if (!a.location) return { error: 'Please tell us where you are based (city or province).' };
  return { application: { ...a, ...JOB } };
}

export default async function handler(req, context) {
  if (req.method !== 'POST') return json(405, { error: 'Not allowed.' });

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 10_000) return json(413, { error: 'That message is too long.' });
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'The application could not be read.' });
  }
  if (!body || typeof body !== 'object') return json(400, { error: 'The application could not be read.' });

  // Hidden field that people never see. Only robots fill it in: pretend it worked, save nothing.
  if (body.website) return json(200, { ok: true });

  const { application, error } = readApplication(body);
  if (error) return json(422, { error });

  try {
    const space = context?.deploy?.context === 'production' ? 'live' : 'preview';
    const receivedAt = new Date().toISOString();
    const id = `${receivedAt}-${crypto.randomUUID().slice(0, 8)}`;
    await getStore({ name: `applications-${space}`, consistency: 'strong' }).setJSON(id, { id, receivedAt, ...application });
    return json(200, { ok: true });
  } catch (err) {
    console.error('applications:', err);
    return json(503, { error: 'Your application could not be saved right now. Please e-mail careers@phirst.homes instead.' });
  }
}

export const config = { path: '/api/applications' };
