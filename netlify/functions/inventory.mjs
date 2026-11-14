// GET /api/inventory
//
// Reads the PHirst inventory spreadsheet on the server and returns only what the
// calculator needs. This runs on Netlify's servers, so the spreadsheet's address is
// never sent to a visitor's browser. It is, however, written below, so anyone who can
// read this repository can see it. Setting the Netlify environment variable
// INVENTORY_SHEET_ID overrides it.
//
// Fresh data: Netlify's CDN keeps each answer for 10 minutes, then asks Google again.

const DEFAULT_SHEET_ID = '1e5ZXt0tdi27PyH4sVRrhFByLitydHUEW';

// Tabs of the spreadsheet (their names change daily with the date; these ids do not).
const TABS = ['791045622', '1055632924', '1610931865', '418692951'];

// Every sales area is sent by default. To limit it, set the INVENTORY_GEOS environment
// variable to a comma-separated list, e.g. "SOMA1,SOMA3" for Cavite and Batangas only.

const COLUMNS = {
  code: /^UNIT CODE$/,
  geo: /^GEO$/,
  project: /^PROJECT$/,
  phase: /^PHASE$/,
  subPhase: /^SUB PHASE$/,
  batch: /^BATCH$/,
  type: /^UNIT TYPE$/,
  lotArea: /^LOT AREA$/,
  floorArea: /^FLOOR AREA$/,
  tcp: /^TCP$/,
  vat: /^VAT$/,
  tcpExVat: /^TCP W\/O VAT$/,
  turnover: /^ETD$/,
  houseCon: /HOUSECON/,
  status: /INVENTORY/,
  terms: /TERMS/,
};
const NUMERIC = new Set(['lotArea', 'floorArea', 'tcp', 'vat', 'tcpExVat']);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const number = (s) => {
  const n = Number(clean(s).replace(/,/g, ''));
  return Number.isFinite(n) && clean(s) !== '' ? n : null;
};

async function readTab(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetch(url, { redirect: 'follow' });
  const body = await res.text();
  // A sheet that is no longer shared answers with an HTML sign-in page, not CSV.
  if (!res.ok || /^\s*<(!doctype|html)/i.test(body)) throw new Error(`tab ${gid}: not readable (${res.status})`);
  const rows = parseCsv(body);
  const header = (rows.shift() || []).map((h) => clean(h).toUpperCase());
  const index = {};
  for (const [key, pattern] of Object.entries(COLUMNS)) index[key] = header.findIndex((h) => pattern.test(h));
  if (index.code < 0 || index.tcp < 0 || index.project < 0) throw new Error(`tab ${gid}: columns not recognised`);
  return rows
    .map((r) => {
      const unit = {};
      for (const key of Object.keys(COLUMNS)) {
        const raw = index[key] < 0 ? '' : r[index[key]];
        unit[key] = NUMERIC.has(key) ? number(raw) : clean(raw);
      }
      unit.geo = unit.geo.toUpperCase();
      unit.project = unit.project.toUpperCase();
      unit.type = unit.type.toUpperCase();
      unit.status = unit.status.toUpperCase();
      unit.terms = unit.terms.toUpperCase();
      return unit;
    })
    .filter((u) => u.code && u.tcp);
}

// The date PHirst puts in each tab name ("SOMA 3 11.14.2026") is the inventory's "as of" date.
async function readAsOf(sheetId) {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
    const html = await res.text();
    const dates = [...html.matchAll(/name: "[^"]*?(\d{1,2})\.(\d{1,2})\.(\d{4})"/g)].map(
      (m) => `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`,
    );
    return dates.sort().pop() || null;
  } catch {
    return null;
  }
}

const json = (status, data, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'public, max-age=0, must-revalidate',
      ...extra,
    },
  });

export default async function handler() {
  const sheetId = process.env.INVENTORY_SHEET_ID || DEFAULT_SHEET_ID;

  const geos = (process.env.INVENTORY_GEOS || '')
    .split(',')
    .map((g) => g.trim().toUpperCase())
    .filter(Boolean);

  try {
    const [asOf, ...tabs] = await Promise.all([readAsOf(sheetId), ...TABS.map((gid) => readTab(sheetId, gid))]);
    const units = tabs.flat().filter((u) => !geos.length || geos.includes(u.geo));
    if (!units.length) throw new Error('no units found');
    return json(
      200,
      { asOf, fetchedAt: new Date().toISOString(), count: units.length, units },
      { 'netlify-cdn-cache-control': 'public, durable, s-maxage=600, stale-while-revalidate=86400' },
    );
  } catch (err) {
    console.error('inventory:', err);
    return json(502, { error: 'Inventory could not be read right now.' });
  }
}

export const config = { path: '/api/inventory' };
