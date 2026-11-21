// Builds the Sellers Accreditation Form PDF for one application: the same three pages as the
// official form (the form, the Privacy Statement and the Background Check Authorization),
// filled in with the applicant's answers, 2x2 picture, signature and the date.
//
// The pages come from saf-template.pdf: the official form with every answer, picture and
// signature taken out. layout.json holds where each answer goes (measured on the official form,
// no personal data). Fonts and the template are passed in, so this runs in the browser (the
// admin page) and in Node alike.
//
// Admin edits are applied by passing a changed `app`, a different `checklist` or no `photo`.

import { PDFDocument, BlendMode, StandardFonts, rgb, pushGraphicsState, popGraphicsState, moveTo, lineTo, appendBezierCurve, closePath, clip, endPath, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import layoutJson from './layout.json';

export interface SafHistoryRow { year: string; company: string; position: string; address: string }

export interface SafApplication {
  lastName: string; firstName: string; middleName: string; nickName?: string;
  birthDate: string; // YYYY-MM-DD
  gender: string; civilStatus: string; licenseNo?: string; citizenship: string;
  houseNo: string; street: string; city: string; province: string;
  mobile: string; homePhone?: string; email: string; source: string; tin: string;
  position: string; salesChannel: string; focusProject: string; manager: string; director: string;
  attainment: string; course: string; school: string; yearGraduated: string; schoolYears?: string;
  history: SafHistoryRow[];
  /** When the application came in (ISO). The date on the form is this day, in Manila time. */
  receivedAt: string;
  files?: { transcript?: string; clearance?: string; savings?: string; photo?: string; signature?: string };
}

/** The seven boxes of the form's checklist, top to bottom. */
export interface Checklist { privacy: boolean; cor: boolean; or: boolean; prc: boolean; dhsud: boolean; nbi: boolean; photo: boolean }
const CHECK_ORDER: (keyof Checklist)[] = ['privacy', 'cor', 'or', 'prc', 'dhsud', 'nbi', 'photo'];

/** What the checklist shows by itself: privacy consent given, NBI / Police Clearance and 2x2 picture uploaded. */
export function autoChecklist(app: Pick<SafApplication, 'files'>): Checklist {
  return { privacy: true, cor: false, or: false, prc: false, dhsud: false, nbi: !!app.files?.clearance, photo: !!app.files?.photo };
}

interface Cell { cx: number; baseline: number; size: number; x0: number; x1: number; font?: string }
const L = layoutJson as unknown as {
  [key: string]: Cell;
} & {
  history: Record<'year' | 'company' | 'position' | 'address', Cell>[];
  declaration: { printedName: { cx: number; baseline: number; size: number }; date: { cx: number; baseline: number; size: number } };
  checkDate: { cx: number; baseline0: number; baseline6: number; size: number };
  pages: Record<string, { text_kind: 'name' | 'date'; cx: number; x0: number; baseline: number; size: number }[]>;
  signatureRects: Record<string, number[]>;
  photo: { x0: number; y0: number; x1: number; y1: number; radius: number };
  lines: { page: number; x0: number; x1: number; baseline: number; size: number }[];
  boxes: number[][];
  tick: { w: number; h: number; path: (string | number)[][]; offsets: number[][] };
};

export interface BuildInput {
  app: SafApplication;
  /** saf-template.pdf */
  template: Uint8Array;
  /** caudex-latin-400-normal.woff (or .ttf): the font of the answers */
  caudex: Uint8Array;
  /** The 2x2 picture (JPEG or PNG). Leave out for no picture; the admin's X does this. */
  photo?: Uint8Array | null;
  /** The signature (JPEG or PNG, dark ink on white). */
  signature?: Uint8Array | null;
  /** Ticks to change from the automatic ones. */
  checklist?: Partial<Checklist>;
}

const isPng = (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
const isJpg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8;

async function embedPicture(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage> {
  if (isPng(bytes)) return doc.embedPng(bytes);
  if (isJpg(bytes)) return doc.embedJpg(bytes);
  throw new Error('The picture must be a JPG or PNG. Convert WebP pictures first.');
}

// The pages' boxes do not start at 0, so a position measured from the top of the page is turned
// into PDF's bottom-up coordinates from the top edge of the box, not from the page's height.
const topOf = (page: PDFPage) => page.getMediaBox().y + page.getMediaBox().height;

const upper = (s?: string) => (s ?? '').trim().toUpperCase();

/** "JAN 05, 2026", for the day the application came in, in Manila. */
export function formDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

function birthText(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

function ageOn(iso: string, today: Date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  let a = today.getFullYear() - Number(m[1]);
  if (today.getMonth() + 1 < Number(m[2]) || (today.getMonth() + 1 === Number(m[2]) && today.getDate() < Number(m[3]))) a -= 1;
  return a >= 0 && a < 120 ? String(a) : '';
}

export async function buildSafPdf({ app, template, caudex, photo, signature, checklist }: BuildInput): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(caudex, { subset: true });
  const boldItalic = await doc.embedFont(StandardFonts.HelveticaBoldOblique);
  const pages = doc.getPages();
  const date = formDate(app.receivedAt);
  const black = rgb(0, 0, 0);

  // Characters the font does not have would print as blanks: show a ? instead.
  const known = new Set(font.getCharacterSet());
  const safe = (s: string) => [...s].map((c) => (known.has(c.codePointAt(0)!) ? c : '?')).join('');

  /** Centres text on a cell and shrinks it until it fits. */
  const put = (page: PDFPage, text: string, cell: Pick<Cell, 'cx' | 'baseline' | 'size'> & Partial<Cell>, f: PDFFont = font) => {
    if (!text) return;
    const t = f === font ? safe(text) : text;
    let size = cell.size;
    if (cell.x0 !== undefined && cell.x1 !== undefined) {
      const room = cell.x1 - cell.x0 - 8;
      const w = f.widthOfTextAtSize(t, size);
      if (w > room) size = Math.max(5.5, (size * room) / w);
    }
    const w = f.widthOfTextAtSize(t, size);
    // Centred where the official form centres it, but never out of its cell.
    let x = cell.cx - w / 2;
    if (cell.x0 !== undefined && cell.x1 !== undefined) x = Math.max(cell.x0 + 4, Math.min(x, cell.x1 - 4 - w));
    page.drawText(t, { x, y: topOf(page) - cell.baseline, size, font: f, color: black });
  };

  // ---- Page 1: the form
  const p1 = pages[0];
  const full = (k: keyof SafApplication) => upper(app[k] as string);
  const text: Record<string, string> = {
    lastName: full('lastName'), firstName: full('firstName'), middleName: full('middleName'), nickName: full('nickName'),
    birthDate: birthText(app.birthDate), age: ageOn(app.birthDate, new Date(app.receivedAt)),
    gender: full('gender'), civilStatus: full('civilStatus'), licenseNo: full('licenseNo'), citizenship: full('citizenship'),
    address: upper([app.houseNo, app.street, app.city, app.province].filter(Boolean).join(' ')),
    mobile: (app.mobile ?? '').trim(), homePhone: (app.homePhone ?? '').trim(), email: (app.email ?? '').trim(),
    source: full('source'), position: full('position'), tin: full('tin'),
    focusProject: full('focusProject'), manager: full('manager'), director: full('director'),
    attainment: full('attainment'), course: full('course'), school: full('school'), yearGraduated: full('yearGraduated'), schoolYears: full('schoolYears'),
  };
  for (const [key, value] of Object.entries(text)) put(p1, value, L[key]);
  put(p1, upper(app.salesChannel), L.salesChannel, boldItalic);
  (app.history ?? []).slice(0, 3).forEach((row, i) => {
    const cells = L.history[i];
    if (!cells) return;
    put(p1, upper(row.year), cells.year);
    put(p1, upper(row.company), cells.company);
    put(p1, upper(row.position), cells.position);
    put(p1, upper(row.address), cells.address);
  });

  // Checklist: ticks, with the day of submission beside each one.
  const checks = { ...autoChecklist(app), ...(checklist ?? {}) };
  const step = (L.checkDate.baseline6 - L.checkDate.baseline0) / 6;
  const [dx, dy] = [L.tick.offsets[0][0] - L.boxes[0][0], L.tick.offsets[0][1] - L.boxes[0][1]];
  const tickPath = L.tick.path
    .map(([op, ...n]) => `${op} ${(n as number[]).join(' ')}`)
    .join(' ') + ' Z';
  CHECK_ORDER.forEach((key, i) => {
    if (!checks[key]) return;
    const box = L.boxes[i];
    p1.drawSvgPath(tickPath, { x: box[0] + dx, y: topOf(p1) - (box[1] + dy), color: black, borderWidth: 0 });
    put(p1, date, { cx: L.checkDate.cx, baseline: L.checkDate.baseline0 + step * i, size: L.checkDate.size });
  });

  // The declaration: printed name and date, with the signature over the name.
  const printed = upper(`${app.firstName} ${app.lastName}`);
  put(p1, printed, L.declaration.printedName);
  put(p1, date, L.declaration.date);

  // ---- Pages 2 and 3: name, date and signature
  put(pages[1], printed, { ...L.pages['2'].find((p) => p.text_kind === 'name')! });
  put(pages[1], date, { ...L.pages['2'].find((p) => p.text_kind === 'date')! });
  put(pages[2], printed, { ...L.pages['3'].find((p) => p.text_kind === 'name')! });
  put(pages[2], date, { ...L.pages['3'].find((p) => p.text_kind === 'date')! });

  // The ruled lines the name, date and signature sit on.
  for (const ln of L.lines) {
    const page = pages[ln.page - 1];
    const y = topOf(page) - (ln.baseline + ln.size * 0.12);
    page.drawLine({ start: { x: ln.x0, y }, end: { x: ln.x1, y }, thickness: 0.7, color: black });
  }

  if (signature && signature.length) {
    const img = await embedPicture(doc, signature);
    ['1', '2', '3'].forEach((pg, i) => {
      const [x0, y0, x1, y1] = L.signatureRects[pg];
      // a little larger than the official form's box, kept in proportion and sitting on the line
      const boxW = (x1 - x0) * 1.8;
      const boxH = (y1 - y0) * 1.1;
      const s = Math.min(boxW / img.width, boxH / img.height);
      const w = img.width * s;
      const h = img.height * s;
      const page = pages[i];
      // multiply: the white of the signature picture does not cover the line or the name under it
      page.drawImage(img, { x: (x0 + x1) / 2 - w / 2, y: topOf(page) - y1, width: w, height: h, blendMode: BlendMode.Multiply });
    });
  }

  // ---- The 2x2 picture, cut to the rounded frame at the top right of page 1.
  if (photo && photo.length) {
    const img = await embedPicture(doc, photo);
    const f = L.photo;
    const inset = 1.3;
    const x0 = f.x0 + inset, x1 = f.x1 - inset, top = topOf(p1) - (f.y0 + inset), bottom = topOf(p1) - (f.y1 - inset);
    const w = x1 - x0, h = top - bottom, r = f.radius, k = 0.5523 * r;
    p1.pushOperators(
      pushGraphicsState(),
      moveTo(x0 + r, top), lineTo(x1 - r, top), appendBezierCurve(x1 - r + k, top, x1, top - r + k, x1, top - r),
      lineTo(x1, bottom + r), appendBezierCurve(x1, bottom + r - k, x1 - r + k, bottom, x1 - r, bottom),
      lineTo(x0 + r, bottom), appendBezierCurve(x0 + r - k, bottom, x0, bottom + r - k, x0, bottom + r),
      lineTo(x0, top - r), appendBezierCurve(x0, top - r + k, x0 + r - k, top, x0 + r, top),
      closePath(), clip(), endPath(),
    );
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s, dh = img.height * s;
    // fill the frame; if the picture is taller than the frame, keep the top (the face) rather than the middle
    p1.drawImage(img, { x: x0 + (w - dw) / 2, y: top - dh + (dh - h) * 0.15, width: dw, height: dh });
    p1.pushOperators(popGraphicsState());
  }

  doc.setTitle('Sellers Accreditation Form');
  doc.setProducer('PHIRST.HOMES');
  doc.setCreator('PHIRST.HOMES');
  return doc.save();
}
