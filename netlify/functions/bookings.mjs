// POST /api/bookings
//
// Saves a site-tripping booking from the Book a Viewing form on the website itself
// (Netlify Blobs). Nothing is e-mailed and nothing can be read back from here: bookings
// will be read through the private admin page, which is not built yet.
//
// Bookings sent from a Deploy Preview are kept apart from the live site's bookings.

import { getStore } from '@netlify/blobs';

// Constant details that go with every booking. Visitors cannot change these.
const COMPANY = {
  chargedTo: 'PPHI',
  department: 'GST3/DIV1',
  divHead: 'MCV',
  genManager: 'ACO',
  areaManager: 'Marielle Medina',
  sellerName: 'Michael & Andrea Mendoza',
  sellerContact: '0917-651-0110',
};

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Checks a submitted form. Returns { booking } when it is complete, or { error } to show the visitor. */
export function readBooking(body) {
  const b = {
    date: text(body.date, 10),
    time: text(body.time, 5),
    pickupPoint: text(body.pickupPoint, 200),
    itinerary: text(body.itinerary, 300),
    totalPax: Number.parseInt(body.totalPax, 10),
    purpose: 'Site Tripping',
    clientName: text(body.clientName, 120),
    clientContact: text(body.clientContact, 40),
    clientEmail: text(body.clientEmail, 160),
    clientFacebook: text(body.clientFacebook, 200),
    // What the visitor was looking at in the calculator, if they came from there.
    project: text(body.project, 120),
    houseModel: text(body.houseModel, 120),
    unit: text(body.unit, 80),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return { error: 'Please choose the date of your visit.' };
  if (!/^\d{2}:\d{2}$/.test(b.time)) return { error: 'Please choose the time of your visit.' };
  if (!b.pickupPoint) return { error: 'Please tell us your pick up point.' };
  if (!b.itinerary) return { error: 'Please tell us where you would like to go.' };
  if (!(b.totalPax >= 1 && b.totalPax <= 99)) return { error: 'Please tell us how many people are coming.' };
  if (!b.clientName) return { error: 'Please give your name.' };
  if (b.clientContact.replace(/\D/g, '').length < 7) return { error: 'Please give a contact number we can reach you on.' };
  if (b.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.clientEmail)) return { error: 'Please check your e-mail address.' };
  if (!b.clientEmail && !b.clientFacebook) return { error: 'Please give your e-mail or your Facebook link / username.' };
  return { booking: { ...b, ...COMPANY } };
}

export default async function handler(req, context) {
  if (req.method !== 'POST') return json(405, { error: 'Not allowed.' });

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 10_000) return json(413, { error: 'That message is too long.' });
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'The booking could not be read.' });
  }
  if (!body || typeof body !== 'object') return json(400, { error: 'The booking could not be read.' });

  // Hidden field that people never see. Only robots fill it in: pretend it worked, save nothing.
  if (body.website) return json(200, { ok: true });

  const { booking, error } = readBooking(body);
  if (error) return json(422, { error });

  try {
    const space = context?.deploy?.context === 'production' ? 'live' : 'preview';
    const receivedAt = new Date().toISOString();
    const id = `${receivedAt}-${crypto.randomUUID().slice(0, 8)}`;
    await getStore({ name: `bookings-${space}`, consistency: 'strong' }).setJSON(id, { id, receivedAt, ...booking });
    return json(200, { ok: true });
  } catch (err) {
    console.error('bookings:', err);
    return json(503, { error: 'Your booking could not be saved right now. Please call or text us instead.' });
  }
}

export const config = { path: '/api/bookings' };
