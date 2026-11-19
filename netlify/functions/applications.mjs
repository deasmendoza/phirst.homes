// POST /api/applications
//
// Saves a Sellers Accreditation application from the /application page on the website itself
// (Netlify Blobs). Nothing is e-mailed and nothing can be read back from here: applications
// will be read through the private admin page, which is not built yet. The files (documents,
// 2x2 picture, signature) are uploaded first through /api/application-files and arrive here
// as ids.
//
// Applications sent from a Deploy Preview are kept apart from the live site's applications.

import { getStore } from '@netlify/blobs';

// Constant details that go with every application. Visitors cannot change these.
const JOB = {
  position: 'International Territory Specialist',
  team: 'Team M-BigTime',
  salesChannel: 'GST3/DIV1',
  focusProject: 'SOMA 1',
  manager: 'Marielle Medina',
  director: 'Jay Ar Tan Hachenova',
};

const FILE_KINDS = ['transcript', 'clearance', 'savings', 'photo', 'signature'];

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function ageOn(birthDate, today) {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = today.getUTCFullYear() - y;
  if (today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d)) age -= 1;
  return age;
}

/** Checks a submitted form. Returns { application } when it is complete, or { error } to show the applicant. */
export function readApplication(body, today = new Date()) {
  const a = {
    lastName: text(body.lastName, 80),
    firstName: text(body.firstName, 80),
    middleName: text(body.middleName, 80),
    nickName: text(body.nickName, 40),
    birthDate: text(body.birthDate, 10),
    gender: text(body.gender, 20),
    civilStatus: text(body.civilStatus, 30),
    licenseNo: text(body.licenseNo, 40),
    citizenship: text(body.citizenship, 60),
    houseNo: text(body.houseNo, 60),
    street: text(body.street, 120),
    city: text(body.city, 80),
    province: text(body.province, 80),
    mobile: text(body.mobile, 40),
    homePhone: text(body.homePhone, 40),
    email: text(body.email, 160),
    source: text(body.source, 60),
    tin: text(body.tin, 30),
    attainment: text(body.attainment, 60),
    course: text(body.course, 100),
    school: text(body.school, 120),
    yearGraduated: text(body.yearGraduated, 20),
    schoolYears: text(body.schoolYears, 10),
  };
  const required = [
    ['lastName', 'your last name'], ['firstName', 'your first name'], ['middleName', 'your middle name'],
    ['gender', 'your gender'], ['civilStatus', 'your civil status'], ['citizenship', 'your citizenship'],
    ['houseNo', 'your house number'], ['street', 'your street or village'], ['city', 'your town or city'], ['province', 'your province'],
    ['source', 'where you heard about us'], ['tin', 'your Tax Identification Number'],
    ['attainment', 'your highest educational attainment'], ['course', 'your course'], ['school', 'your school'], ['yearGraduated', 'the year you graduated'],
  ];
  for (const [key, label] of required) if (!a[key]) return { error: `Please give ${label}.` };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.birthDate) || Number.isNaN(Date.parse(a.birthDate))) return { error: 'Please give your date of birth.' };
  const age = ageOn(a.birthDate, today);
  if (age < 18 || age > 100) return { error: 'Please check your date of birth.' };
  if (a.mobile.replace(/\D/g, '').length < 7) return { error: 'Please give a mobile number we can reach you on.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return { error: 'Please check your e-mail address.' };

  // Accreditation history: up to five rows; rows left empty are dropped.
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(0, 5)
    .map((r) => ({ year: text(r?.year, 10), company: text(r?.company, 100), position: text(r?.position, 100), address: text(r?.address, 120) }))
    .filter((r) => r.year || r.company || r.position || r.address);

  // Files arrive as ids from /api/application-files. The signature is required, the rest are optional.
  const files = {};
  for (const kind of FILE_KINDS) {
    const id = text(body.files?.[kind], 60);
    if (id) {
      if (!/^[0-9a-f-]{36}$/i.test(id) && !/^local-/.test(id)) return { error: 'One of your uploads could not be matched. Please upload it again.' };
      files[kind] = id;
    }
  }
  if (!files.signature) return { error: 'Please sign the form (draw your signature or upload a picture of it).' };

  const c = body.consents ?? {};
  if (c.privacy !== true) return { error: 'Please confirm you have read and agree to the Privacy Statement.' };
  if (c.background !== true) return { error: 'Please confirm the Background Check Authorization.' };
  if (c.declaration !== true) return { error: 'Please confirm the declaration.' };

  return {
    application: {
      ...a,
      age,
      history,
      files,
      printedName: `${a.firstName} ${a.lastName}`,
      consents: { privacy: true, background: true, declaration: true },
      ...JOB,
    },
  };
}

export default async function handler(req, context) {
  if (req.method !== 'POST') return json(405, { error: 'Not allowed.' });

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 30_000) return json(413, { error: 'That form is too long.' });
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
    // Every file the application names must really have been uploaded.
    const fileStore = getStore({ name: `application-files-${space}`, consistency: 'strong' });
    for (const id of Object.values(application.files)) {
      if (!(await fileStore.getMetadata(id))) return json(422, { error: 'One of your uploads could not be found. Please upload it again.' });
    }
    const receivedAt = new Date().toISOString();
    const id = `${receivedAt}-${crypto.randomUUID().slice(0, 8)}`;
    await getStore({ name: `applications-${space}`, consistency: 'strong' }).setJSON(id, { id, receivedAt, ...application });
    return json(200, { ok: true });
  } catch (err) {
    console.error('applications:', err);
    return json(503, { error: 'Your application could not be saved right now. Please try again in a moment.' });
  }
}

export const config = { path: '/api/applications' };
