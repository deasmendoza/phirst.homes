// Try the admin on your own computer, without Netlify.
//   npm run build
//   node tools/admin-dev-server.mjs          then open http://localhost:8765/admin
//
// Netlify Blobs does not exist here, so a small in-memory stand-in is used and filled with MADE-UP
// applicants and bookings (nothing real). Everything is forgotten when you stop the server.
// Sign in with  admin / manager / agent  and the password  dev-only-1234  (only on this computer).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { memStore } from './mem-blobs.mjs';
import { _setStoreFactory } from '../netlify/lib/store.mjs';
import { hashPassword } from '../netlify/lib/crypto.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8765);
const PASSWORD = 'dev-only-1234';

process.env.PHIRST_SESSION_SECRET = crypto.randomBytes(32).toString('base64url');
const hash = await hashPassword(PASSWORD);
for (const u of ['ADMIN', 'MANAGER', 'AGENT']) process.env[`PHIRST_PASSWORD_${u}`] = hash;
_setStoreFactory((name) => memStore(name));

const { default: adminHandler } = await import('../netlify/functions/admin.mjs');
const { store } = await import('../netlify/lib/store.mjs');

// ---- made-up data
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * (w * 4 + 1) + 1 + x * 4;
    const [r, g, b, a] = pixel(x, y);
    raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const fakePhoto = () => png(200, 200, (x, y) => ((x - 100) ** 2 + (y - 80) ** 2 < 2500 ? [226, 178, 140, 255] : y > 150 ? [30, 60, 120, 255] : [200, 215, 235, 255]));
const fakeSignature = () => png(400, 120, (x, y) => (Math.abs(y - (60 + 35 * Math.sin(x / 22))) < 2.5 && x > 20 && x < 380 ? [20, 20, 60, 255] : [255, 255, 255, 255]));
async function fakePdf(title) { const d = await PDFDocument.create(); d.addPage([300, 200]).drawText(title, { x: 20, y: 100 }); return Buffer.from(await d.save()); }

async function putFile(kind, bytes, type) {
  const id = crypto.randomUUID();
  await store('application-files').set(id, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), { metadata: { kind, type, size: bytes.length, name: 'made-up', receivedAt: new Date().toISOString() } });
  return id;
}
const people = [
  ['Dela Cruz', 'Juan', 'Santos', 'SOMA 1', 'Quezon City'],
  ['Reyes', 'Maria', 'Garcia', 'SOMA 2', 'Makati City'],
  ['Villanueva', 'Pedro', 'Lim', 'SOMA 3', 'Pasig City'],
];
for (const [i, [lastName, firstName, middleName, focusProject, city]] of people.entries()) {
  const receivedAt = new Date(Date.now() - i * 86400000 * 1.5).toISOString();
  const id = `${receivedAt}-${crypto.randomUUID().slice(0, 8)}`;
  const files = { signature: await putFile('signature', fakeSignature(), 'image/png') };
  if (i !== 2) files.photo = await putFile('photo', fakePhoto(), 'image/png');
  if (i === 0) { files.transcript = await putFile('transcript', await fakePdf('MADE-UP transcript'), 'application/pdf'); files.clearance = await putFile('clearance', await fakePdf('MADE-UP NBI clearance'), 'application/pdf'); }
  await store('applications').setJSON(id, {
    id, receivedAt, lastName, firstName, middleName, nickName: firstName.slice(0, 3), birthDate: '1995-04-12', age: 31, gender: 'Female', civilStatus: 'Single', licenseNo: '',
    citizenship: 'Filipino', houseNo: '12', street: 'Sampaguita St.', city, province: 'Metro Manila 1100', mobile: '0917 000 0000', homePhone: '', email: `${firstName.toLowerCase()}@example.com`,
    source: 'Facebook', focusProject, tin: '000-000-000-000', attainment: 'College Graduate', course: 'BS Business Administration', school: 'Made-Up University', yearGraduated: '2017', schoolYears: '4',
    history: i === 1 ? [{ year: '2021', company: 'Sample Realty', position: 'Agent', address: 'Taguig City' }] : [],
    files, consents: { privacy: true, background: true, declaration: true }, printedName: `${firstName} ${lastName}`,
    position: 'International Territory Specialist', team: 'Team M-BigTime', salesChannel: 'GST3/DIV1', manager: 'Marielle Medina', director: 'Jay Ar Tan Hachenova',
  });
}
for (const [i, name] of ['Ana Bautista', 'Carlo Mendoza'].entries()) {
  const receivedAt = new Date(Date.now() - i * 3600000 * 5).toISOString();
  const id = `${receivedAt}-${crypto.randomUUID().slice(0, 8)}`;
  await store('bookings').setJSON(id, {
    id, receivedAt, date: '2026-12-05', time: '09:30', pickupPoint: 'SM North EDSA', itinerary: 'SOMA 1 and SOMA 2', totalPax: 3 + i, purpose: 'Site Tripping',
    clientName: name, clientContact: '0917 111 2222', clientEmail: i ? '' : 'ana@example.com', clientFacebook: i ? 'facebook.com/made.up' : '', project: 'SOMA 1', houseModel: 'Aurora', unit: 'Lot 12',
    chargedTo: 'PPHI', department: 'GST3/DIV1', divHead: 'MCV', genManager: 'ACO', areaManager: 'Marielle Medina', sellerName: 'Michael & Andrea Mendoza', sellerContact: '0917-651-0110',
  });
}

// ---- web server: the built site (dist/) plus the admin functions
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/admin/')) {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
    const response = await adminHandler(new Request(url, { method: req.method, headers: req.headers, body }), { deploy: { context: 'dev' } });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    return res.end(Buffer.from(await response.arrayBuffer()));
  }
  let file = path.join(root, 'dist', path.normalize(url.pathname));
  if (!file.startsWith(path.join(root, 'dist'))) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'dist', 'index.html');
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Admin test server: http://localhost:${PORT}/admin  (users admin / manager / agent, password ${PASSWORD})`));
