import { reservationFee } from '@/lib/compute';

/**
 * The twelve house models shown in the House Models section, in order of floor area.
 * Specs are from PHirst's own model cards (Brenna, Dua, Cartland, Charles, Christie, Corin) and from
 * the model pages already on this site (Alora, Amani, Calista, Unna). A missing number is omitted
 * from the text rather than guessed.
 */
export type HouseStatus = 'available' | 'soon' | 'unavailable';

export interface House {
  name: string;
  status: HouseStatus;
  /** Floor area in sqm. */
  floor?: number;
  /** Typical lot area in sqm: one number, or [inner/mid, end]. */
  lot?: number | [number, number];
  bedrooms?: number;
  bathrooms?: number;
  carport?: number;
  /** Unit types the reservation fee schedule is looked up by (see reservationFee in lib/compute.ts). */
  feeTypes?: string[];
  /** Shown under the specs. */
  note?: string;
  /** Photos, front first. Replace the placeholders with the real renders. */
  images: string[];
}

// Placeholders: the series renders already in /assets/img/hero. Replace per house.
const P = (n: number) => `/assets/img/hero/model-${n}.webp`;

export const HOUSES: House[] = [
  { name: 'Aurora', status: 'soon', images: [P(3)] },
  { name: 'Alora', status: 'available', floor: 30, lot: [41, 56], bedrooms: 1, bathrooms: 1, feeTypes: ['ALORA MID', 'ALORA END'], note: 'Rowhouse with a loft (provision for 1 bedroom).', images: [P(3)] },
  { name: 'Amani', status: 'available', floor: 36, lot: [40, 55], bedrooms: 2, bathrooms: 1, carport: 1, feeTypes: ['AMANI MID', 'AMANI END'], images: [P(2)] },
  { name: 'Calista', status: 'available', floor: 40, lot: [44, 60.5], bedrooms: 2, bathrooms: 1, carport: 1, feeTypes: ['CALISTA MID', 'CALISTA END'], images: [P(1)] },
  { name: 'Brenna', status: 'available', floor: 45, lot: 88, bedrooms: 2, bathrooms: 1, feeTypes: ['BRENNA'], note: 'One-storey bungalow, available only in selected projects.', images: [P(2)] },
  { name: 'Dua', status: 'available', floor: 48, lot: 70, bedrooms: 2, bathrooms: 2, carport: 1, feeTypes: ['DUA'], note: 'Standalone house with a single shared firewall.', images: [P(1)] },
  { name: 'Unna', status: 'available', floor: 54, lot: 88, bedrooms: 3, bathrooms: 2, carport: 1, feeTypes: ['UNNA'], images: [P(4)] },
  { name: 'Cartland', status: 'available', floor: 54, lot: 88, bedrooms: 3, bathrooms: 2, carport: 1, feeTypes: ['CARTLAND'], images: [P(5)] },
  { name: 'Charles 70', status: 'available', floor: 70, lot: 99, bedrooms: 3, bathrooms: 2, carport: 2, feeTypes: ['CHARLES'], images: [P(5)] },
  { name: 'Christie', status: 'available', floor: 90, lot: 110, bedrooms: 3, bathrooms: 3, carport: 2, feeTypes: ['CHRISTIE'], images: [P(5)] },
  { name: 'Corin', status: 'available', floor: 120, lot: 132, bedrooms: 3, bathrooms: 3, carport: 2, feeTypes: ['CORIN'], images: [P(6)] },
  { name: 'Charles 150', status: 'unavailable', floor: 150, lot: 99, bedrooms: 3, bathrooms: 3, carport: 2, note: 'Expanded version of Charles 70 (suggested expansion plan).', images: [P(5)] },
];

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;
const sqm = (n: number) => `${n} sqm`;
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "₱10,000 – ₱12,500" when Mid and End differ, a single amount otherwise; null when there is no published fee. */
export function feeText(h: House): string | null {
  const fees = (h.feeTypes ?? []).map((t) => reservationFee(t, '')).filter((f): f is number => f != null);
  if (!fees.length) return null;
  const lo = Math.min(...fees);
  const hi = Math.max(...fees);
  return lo === hi ? peso(lo) : `${peso(lo)} – ${peso(hi)}`;
}

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
