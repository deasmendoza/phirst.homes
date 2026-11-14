export interface Unit {
  code: string;
  geo: string;
  project: string;
  phase: string;
  subPhase: string;
  batch: string;
  type: string;
  lotArea: number | null;
  floorArea: number | null;
  tcp: number;
  vat: number | null;
  tcpExVat: number | null;
  turnover: string;
  houseCon: string;
  status: string;
  terms: string;
}

export interface Inventory {
  asOf: string | null;
  units: Unit[];
}

export async function loadInventory(signal?: AbortSignal): Promise<Inventory> {
  const res = await fetch('/api/inventory', { signal });
  if (!res.ok) throw new Error(`inventory ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.units)) throw new Error('inventory malformed');
  return { asOf: data.asOf ?? null, units: data.units };
}

// Where each project is, for grouping the dropdown. Cavite and Batangas (the team's focus) come first.
const PROVINCES: [string, RegExp][] = [
  ['Cavite', /NAIC|GEN TRI|TANZA/],
  ['Batangas', /LIPA|STO\. ?TOMAS|BATULAO|BATANGAS/],
  ['Laguna', /CALAUAN|SIGHTS BAY|SAN PABLO|CALAMBA/],
  ['Quezon', /TAYABAS/],
  ['Bulacan', /BALIWAG|PANDI/],
  ['Nueva Ecija', /GAPAN/],
  ['Pampanga', /MAGALANG/],
  ['Bataan', /HERMOSA|BALANGA/],
  ['Negros Occidental', /BACOLOD/],
  ['Iloilo', /ILOILO/],
  ['South Cotabato', /GENSAN/],
  ['Davao del Sur', /DIGOS/],
];
export const PROVINCE_ORDER = [...PROVINCES.map(([p]) => p), 'Other'];

export const provinceOf = (project: string) => PROVINCES.find(([, re]) => re.test(project))?.[0] ?? 'Other';

export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|[\s./-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\bVol\.(\d)([a-z])/gi, (_m, d: string, ch: string) => `Vol.${d}${ch.toUpperCase()}`)
    .replace(/\bExp\b/, 'Expansion');

export function projectLabel(project: string) {
  const name = titleCase(project);
  const province = provinceOf(project);
  return province === 'Other' || name.toLowerCase().includes(province.toLowerCase()) ? name : `${name}, ${province}`;
}

const BLOCK_LOT = /^B0*(\d+)L0*(\d+)$/i;

export function blockLot(code: string) {
  const m = BLOCK_LOT.exec(code);
  return m ? `Block ${m[1]} Lot ${m[2]}` : code;
}

export const phaseLabel = (u: Unit) => (u.phase ? `Phase ${u.phase}${u.subPhase}` : '');

export const unitKey = (u: Unit) => [u.project, u.phase, u.subPhase, u.code].join('|');

export function sortUnits(units: Unit[]) {
  const n = (u: Unit) => {
    const m = BLOCK_LOT.exec(u.code);
    return m ? [Number(m[1]), Number(m[2])] : [1e9, 1e9];
  };
  return [...units].sort((a, b) => {
    const pa = `${a.phase}${a.subPhase}`;
    const pb = `${b.phase}${b.subPhase}`;
    if (pa !== pb) return pa.localeCompare(pb, undefined, { numeric: true });
    const [ab, al] = n(a);
    const [bb, bl] = n(b);
    return ab - bb || al - bl || a.code.localeCompare(b.code);
  });
}

/** Night render used for the unit header; only the four featured series have one. */
export function seriesImage(type: string) {
  const m = /^(UNNA|CALISTA|AMANI|ALORA)/.exec(type.toUpperCase());
  return m ? `/assets/img/hero/${m[1].toLowerCase()}.webp` : null;
}
