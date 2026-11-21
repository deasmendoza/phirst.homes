import { PROVINCE_ORDER, projectLabel, provinceOf, type Unit } from '@/lib/inventory';
import { TERMS, reservationFee } from '@/lib/compute';

/**
 * The twelve house models in the House Models section, in the order the owner chose.
 * Specs are from PHirst's own model cards (Brenna, Dua, Cartland, Charles, Christie, Corin) and from
 * the model pages already on this site (Alora, Amani, Calista, Unna). A missing number is left out
 * of the text rather than guessed.
 */
export type HouseStatus = 'available' | 'soon' | 'soldout';

export interface House {
  name: string;
  status: HouseStatus;
  /** Start of the unit type in the inventory sheet (e.g. "ALORA" matches ALORA MID, ALORA END). */
  unit?: string;
  /** Townhouses are priced as Mid and End. */
  split?: boolean;
  floor?: number;
  /** Typical lot area in sqm: one number, or [inner/mid, end]. */
  lot?: number | [number, number];
  bedrooms?: number;
  bathrooms?: number;
  carport?: number;
  note?: string;
  /** The 3D model picture shown (and bouncing) in the middle: transparent cut-out. */
  model3d: string;
  /** Pictures for the thumbnails at the lower left, front first: transparent cut-outs of the house. */
  images: string[];
}

// Pictures made by design/house-models/make-cutouts.py:
//   /assets/img/models/3d/  the 3D model of each house (middle of the section, bounces)
//   /assets/img/models/     the renders (thumbnails at the lower left, until real photos are added)
const M = (name: string) => `/assets/img/models/${name}.webp`;
const M3 = (name: string) => `/assets/img/models/3d/${name}.webp`;

// In the order shown on the page.
export const HOUSES: House[] = [
  { name: 'Calista', status: 'available', unit: 'CALISTA', split: true, floor: 40, lot: [44, 60.5], bedrooms: 2, bathrooms: 1, carport: 1, model3d: M3('calista'), images: [M('calista')] },
  { name: 'Amani', status: 'available', unit: 'AMANI', split: true, floor: 36, lot: [40, 55], bedrooms: 2, bathrooms: 1, carport: 1, model3d: M3('amani'), images: [M('amani')] },
  { name: 'Alora', status: 'available', unit: 'ALORA', split: true, floor: 30, lot: [41, 56], bedrooms: 1, bathrooms: 1, carport: 1, note: 'Rowhouse with a loft (provision for 1 bedroom).', model3d: M3('alora'), images: [M('alora')] },
  { name: 'Aurora', status: 'soon', unit: 'AURORA', model3d: M3('aurora'), images: [M('aurora')] },
  { name: 'Unna', status: 'available', unit: 'UNNA', floor: 54, lot: 88, bedrooms: 3, bathrooms: 2, carport: 1, model3d: M3('unna'), images: [M('unna')] },
  { name: 'Dua', status: 'available', unit: 'DUA', floor: 48, lot: 70, bedrooms: 2, bathrooms: 2, carport: 1, note: 'Standalone house with a single shared firewall.', model3d: M3('dua'), images: [M('dua')] },
  { name: 'Brenna', status: 'available', unit: 'BRENNA', floor: 45, lot: 88, bedrooms: 2, bathrooms: 1, carport: 1, note: 'One-storey bungalow, available only in selected projects.', model3d: M3('brenna'), images: [M('brenna')] },
  { name: 'Cartland 54', status: 'available', unit: 'CARTLAND', floor: 54, lot: 88, bedrooms: 3, bathrooms: 2, carport: 1, model3d: M3('cartland-54'), images: [M('cartland-54')] },
  { name: 'Charles 70', status: 'available', unit: 'CHARLES', floor: 70, lot: 99, bedrooms: 3, bathrooms: 2, carport: 2, model3d: M3('charles-70'), images: [M('charles-70')] },
  { name: 'Christie 90', status: 'available', unit: 'CHRISTIE', floor: 90, lot: 110, bedrooms: 3, bathrooms: 3, carport: 2, model3d: M3('christie-90'), images: [M('christie-90')] },
  { name: 'Corin 120', status: 'available', unit: 'CORIN', floor: 120, lot: 132, bedrooms: 3, bathrooms: 3, carport: 2, model3d: M3('corin-120'), images: [M('corin-120')] },
  { name: 'Charles 150', status: 'soldout', floor: 150, lot: 99, bedrooms: 3, bathrooms: 3, carport: 2, note: 'Expanded version of Charles 70 (suggested expansion plan).', model3d: M3('charles-150'), images: [M('charles-150')] },
];

const sqm = (n: number) => `${n} sqm`;
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The specs as lines of plain text, one per fact. */
export function specLines(h: House): string[] {
  const lines: string[] = [];
  if (h.floor != null) lines.push(`${sqm(h.floor)} Floor area`);
  if (h.lot != null) lines.push(`${Array.isArray(h.lot) ? `${h.lot[0]} – ${h.lot[1]} sqm` : sqm(h.lot)} Typical lot area`);
  if (h.bathrooms != null) lines.push(count(h.bathrooms, 'Bathroom', 'Bathrooms'));
  if (h.bedrooms != null) lines.push(count(h.bedrooms, h.name === 'Alora' ? 'Loft bedroom' : 'Bedroom', h.name === 'Alora' ? 'Loft bedrooms' : 'Bedrooms'));
  if (h.carport != null) lines.push(`${h.carport} Carport`);
  if (h.note) lines.push('', h.note);
  return lines;
}

/** One column of the price table: Mid and End for a townhouse, a single column for every other model. */
export interface PriceColumn {
  label: string;
  /** Lowest TCP among the units of this column. */
  tcp: number;
  /** Reservation fee for that unit; null when the published schedule does not cover it. */
  fee: number | null;
  /** Monthly downpayment of "10% in 12 months" with a bank loan, for that unit. */
  monthly: number | null;
}

export interface HouseStats {
  /** Provinces that have units of this model, in the order the calculator lists them. */
  provinces: string[];
  columns: PriceColumn[];
}

const BANK_10_12 = TERMS.bank.find((t) => t.id === 'bank-10-12')!;

function column(label: string, units: Unit[]): PriceColumn | null {
  if (!units.length) return null;
  const u = units.reduce((a, b) => (b.tcp < a.tcp ? b : a));
  const fee = reservationFee(u.type, u.project);
  // The sheet's TCP already includes VAT, as in the calculator.
  const vatOk = u.vat != null && u.vat > 0 && u.tcpExVat != null && Math.abs(u.tcpExVat + u.vat - u.tcp) < 1;
  const monthly = fee == null ? null : BANK_10_12.schedule(u.tcp, fee, u.tcp - (vatOk ? (u.vat as number) : 0)).monthly?.amount ?? null;
  return { label, tcp: u.tcp, fee, monthly };
}

/** Where a model is sold and what it starts at, from today's inventory (the same data as the calculator). */
export function houseStats(h: House, units: Unit[]): HouseStats | null {
  if (!h.unit) return null;
  const mine = units.filter((u) => u.type.toUpperCase().startsWith(h.unit as string) && u.tcp > 0);
  if (!mine.length) return null;
  const provinces = [...new Set(mine.map((u) => provinceOf(u.project)))].sort((a, b) => PROVINCE_ORDER.indexOf(a) - PROVINCE_ORDER.indexOf(b));
  const columns = (h.split
    ? [column('Mid', mine.filter((u) => /\bMID$/.test(u.type.toUpperCase()))), column('End', mine.filter((u) => /END/.test(u.type.toUpperCase())))]
    : [column('', mine)]
  ).filter((c): c is PriceColumn => c != null);
  return { provinces: provinces.map((p) => (p === 'Other' ? projectLabel(mine[0].project) : p)), columns };
}
