// Calculator maths, transcribed from the two official templates (sellers' copies of 7 Nov 2026):
//   OCS-TEMPLATE-PIF  (Pag-IBIG)   and   OCS-TEMPLATE-BANK (Bank / In-House / Cash).
// Nothing here is estimated or invented: every formula mirrors a cell in those sheets
// (the cell is quoted beside it). "net" is the template's P22, Net Contract Price after VAT.

export type Financing = 'pagibig' | 'bank' | 'inhouse' | 'cash';

export interface Line {
  label: string;
  amount: number;
}

export interface Schedule {
  /** Share of the net contract price paid before the balance; null for cash terms. */
  dpPct: number | null;
  spots: Line[];
  monthly: { amount: number; count: number } | null;
  /** Final instalment when it differs from the others (rounded-up terms). */
  last: Line | null;
  extra: Line[];
  total: number;
}

export interface Term {
  id: string;
  label: string;
  /**
   * Discount for paying on time, as a share of the contract price before VAT. The templates list these
   * rates beside the computation (multiplied by 0 there); the owner asked for them to be applied.
   */
  discount?: { label: string; rate: number };
  schedule: (net: number, rf: number, beforeVat: number) => Schedule;
}

export const FINANCING: { id: Financing; label: string }[] = [
  { id: 'pagibig', label: 'Pag-IBIG' },
  { id: 'bank', label: 'Bank' },
  { id: 'inhouse', label: 'In-House' },
  { id: 'cash', label: 'Cash' },
];

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Excel ROUNDUP(x, -3); the pre-round keeps binary noise from bumping an exact thousand.
const roundUpThousand = (x: number) => Math.ceil(Math.round(x * 1e6) / 1e6 / 1000) * 1000;

/** "20% IN 12 MOS": =ROUNDUP(((P22*20%)-P28)/12,-3) for all but the last month, which takes the remainder. */
const installment = (pct: number, months: number) => (net: number, rf: number): Schedule => {
  const amount = roundUpThousand((net * pct - rf) / months);
  return {
    dpPct: pct,
    spots: [],
    monthly: { amount, count: months - 1 },
    last: { label: `${ordinal(months)} Month Downpayment`, amount: net * pct - rf - amount * (months - 1) },
    extra: [],
    total: net * pct,
  };
};

/** Spot 5% (paid with the reservation) then x% in n equal months: =P22*5%-P28, then =(P22*x%)/n. */
const spotThen = (restPct: number, months: number) => (net: number, rf: number): Schedule => ({
  dpPct: 0.05 + restPct,
  spots: [{ label: 'Spot Payment (5%)', amount: net * 0.05 - rf }],
  monthly: { amount: (net * restPct) / months, count: months },
  last: null,
  extra: [],
  total: net * (0.05 + restPct),
});

/** "SPOT 10%": =P22*10%-P28 in one payment. */
const spotOnly = (pct: number) => (net: number, rf: number): Schedule => ({
  dpPct: pct,
  spots: [{ label: `Spot Payment (${pct * 100}%)`, amount: net * pct - rf }],
  monthly: null,
  last: null,
  extra: [],
  total: net * pct,
});

/** The second 5% of a 10% downpayment: =ROUNDUP((P22*5%)/10,-3) for 9 months, the 10th takes the rest. */
const fivePctInTen = (net: number) => {
  const amount = roundUpThousand((net * 0.05) / 10);
  return { monthly: { amount, count: 9 }, last: { label: '10th Month Downpayment', amount: net * 0.05 - amount * 9 } };
};

/** "2.5%; 2.5% IN 1 MO; 5% IN 10 MOS": =(P22*2.5%)-P28, =P22*2.5%, then 5% over 10 months. */
const twoHalvesThenTen = (net: number, rf: number): Schedule => ({
  dpPct: 0.1,
  spots: [
    { label: 'Spot Payment (2.5%)', amount: net * 0.025 - rf },
    { label: '2.5% after 1 month', amount: net * 0.025 },
  ],
  ...fivePctInTen(net),
  extra: [],
  total: net * 0.1,
});

/** "5% IN 2 MOS; 5% IN 10 MOS": =((P22*5%)-P28)/2 twice, then 5% over 10 months. */
const fiveInTwoThenTen = (net: number, rf: number): Schedule => ({
  dpPct: 0.1,
  spots: [
    { label: '1st Month (2.5%)', amount: (net * 0.05 - rf) / 2 },
    { label: '2nd Month (2.5%)', amount: (net * 0.05 - rf) / 2 },
  ],
  ...fivePctInTen(net),
  extra: [],
  total: net * 0.1,
});

/** Bank "SPOT 5%; 5% IN 30 DAYS": =P22*5%-P28, then =P22*5% after 30 days. */
const spotThenSpot30 = (net: number, rf: number): Schedule => ({
  dpPct: 0.1,
  spots: [
    { label: 'Spot Payment (5%)', amount: net * 0.05 - rf },
    { label: '5% within 30 days', amount: net * 0.05 },
  ],
  monthly: null,
  last: null,
  extra: [],
  total: net * 0.1,
});

/** Restored from the earlier calculator: "SPOT 5%; x% IN n MOS", spot =P22*5%-P28 (split in 2 or 3 for the 60/90-day versions), then =(P22*x%)/n. */
const spotSplit = (parts: 1 | 2 | 3, restPct: number, months: number) => (net: number, rf: number): Schedule => {
  const each = (net * 0.05) / parts;
  const spots: Line[] = [];
  for (let i = 0; i < parts; i++) {
    spots.push({ label: parts === 1 ? 'Spot Payment (5%)' : `Spot Payment ${i + 1}`, amount: i === 0 ? each - rf : each });
  }
  return {
    dpPct: 0.05 + restPct,
    spots,
    monthly: { amount: (net * restPct) / months, count: months },
    last: null,
    extra: [],
    total: net * (0.05 + restPct),
  };
};

/*
 * Spot DP discount (templates' Input Sheet, multiplied by 0 there; applied on the owner's
 * instruction): a share of the 5% spot paid with the reservation, 10% of it when the
 * downpayment runs up to 12 months and 8% of it when it runs 13 months or more.
 */
const SPOT_DP_UP_TO_12 = { label: 'Spot DP Discount (10% of the 5% spot)', rate: 0.05 * 0.1 };
const SPOT_DP_13_UP = { label: 'Spot DP Discount (8% of the 5% spot)', rate: 0.05 * 0.08 };

// OCS-TEMPLATE-PIF, seller's copy of 7 Nov 2026.
const PAGIBIG: Term[] = [
  { id: 'pif-10-12', label: '10% in 12 months', schedule: installment(0.1, 12) },
  { id: 'pif-20-12', label: '20% in 12 months', schedule: installment(0.2, 12) },
  { id: 'pif-20-18', label: '20% in 18 months', schedule: installment(0.2, 18) },
  { id: 'pif-15-14', label: '15% in 14 months', schedule: installment(0.15, 14) },
  { id: 'pif-10-15', label: '10% in 15 months', schedule: installment(0.1, 15) },
  { id: 'pif-15-16', label: '15% in 16 months', schedule: installment(0.15, 16) },
  { id: 'pif-15-18', label: '15% in 18 months', schedule: installment(0.15, 18) },
  { id: 'pif-25-25-5-10', label: '2.5% spot + 2.5% in 1 month + 5% in 10 months', schedule: twoHalvesThenTen },
  { id: 'pif-5in2-5in10', label: '5% in 2 months + 5% in 10 months', schedule: fiveInTwoThenTen },
  { id: 'pif-s5-5-4', label: 'Spot 5% + 5% in 4 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 4) },
  { id: 'pif-s5-5-6', label: 'Spot 5% + 5% in 6 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 6) },
  { id: 'pif-s5-5-10', label: 'Spot 5% + 5% in 10 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 10) },
  { id: 'pif-s5-5-12', label: 'Spot 5% + 5% in 12 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 12) },
  { id: 'pif-s5-10-18', label: 'Spot 5% + 10% in 18 months', discount: SPOT_DP_13_UP, schedule: spotThen(0.1, 18) },
  { id: 'pif-s5rs-10-15', label: 'Spot 5% (reservation month) + 10% in 15 months', discount: SPOT_DP_13_UP, schedule: spotSplit(1, 0.1, 15) },
  { id: 'pif-s5-30-5-13', label: 'Spot 5% in 30 days + 5% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(1, 0.05, 13) },
  { id: 'pif-s5-60-5-13', label: 'Spot 5% in 60 days + 5% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(2, 0.05, 13) },
  { id: 'pif-s5-90-5-13', label: 'Spot 5% in 90 days + 5% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(3, 0.05, 13) },
  { id: 'pif-s10', label: 'Spot 10%', schedule: spotOnly(0.1) },
  { id: 'pif-s20', label: 'Spot 20%', schedule: spotOnly(0.2) },
];

// OCS-TEMPLATE-BANK, seller's copy of 7 Nov 2026 (also used for In-House).
const BANK: Term[] = [
  { id: 'bank-10-12', label: '10% in 12 months', schedule: installment(0.1, 12) },
  { id: 'bank-10-14', label: '10% in 14 months', schedule: installment(0.1, 14) },
  { id: 'bank-10-16', label: '10% in 16 months', schedule: installment(0.1, 16) },
  { id: 'bank-15-14', label: '15% in 14 months', schedule: installment(0.15, 14) },
  { id: 'bank-15-18', label: '15% in 18 months', schedule: installment(0.15, 18) },
  { id: 'bank-25-25-5-10', label: '2.5% spot + 2.5% in 1 month + 5% in 10 months', schedule: twoHalvesThenTen },
  { id: 'bank-5in2-5in10', label: '5% in 2 months + 5% in 10 months', schedule: fiveInTwoThenTen },
  { id: 'bank-s5-5-2', label: 'Spot 5% + 5% in 2 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 2) },
  { id: 'bank-s5-5-6', label: 'Spot 5% + 5% in 6 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 6) },
  { id: 'bank-s5-5-10', label: 'Spot 5% + 5% in 10 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 10) },
  { id: 'bank-s5-5-12', label: 'Spot 5% + 5% in 12 months', discount: SPOT_DP_UP_TO_12, schedule: spotThen(0.05, 12) },
  { id: 'bank-s5-5-30d', label: 'Spot 5% + 5% in 30 days', discount: SPOT_DP_UP_TO_12, schedule: spotThenSpot30 },
  { id: 'bank-s5rs-10-13', label: 'Spot 5% (reservation month) + 10% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(1, 0.1, 13) },
  { id: 'bank-s5-30-10-13', label: 'Spot 5% in 30 days + 10% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(1, 0.1, 13) },
  { id: 'bank-s5-60-10-13', label: 'Spot 5% in 60 days + 10% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(2, 0.1, 13) },
  { id: 'bank-s5-90-10-13', label: 'Spot 5% in 90 days + 10% in 13 months', discount: SPOT_DP_13_UP, schedule: spotSplit(3, 0.1, 13) },
  { id: 'bank-s10', label: 'Spot 10%', schedule: spotOnly(0.1) },
];

const cashMonthly = (spots: Line[], amount: number, count: number, extra: Line[] = []): Schedule => ({
  dpPct: null,
  spots,
  monthly: { amount, count },
  last: null,
  extra,
  total: 0, // filled in below
});
const withTotal = (s: Schedule, rf: number): Schedule => ({
  ...s,
  total:
    rf +
    s.spots.reduce((a, l) => a + l.amount, 0) +
    (s.monthly ? s.monthly.amount * s.monthly.count : 0) +
    s.extra.reduce((a, l) => a + l.amount, 0),
});

// P29 =P22-P28-P30, P30 Retention Fee 5000
const spotCash = (net: number, rf: number) =>
  withTotal({ dpPct: null, spots: [{ label: 'Spot Payment', amount: net - rf - 5000 }], monthly: null, last: null, extra: [{ label: 'Retention Fee', amount: 5000 }], total: 0 }, rf);

const CASH: Term[] = [
  { id: 'cash-spot-rs', label: 'Spot Cash (within the reservation month)', discount: { label: 'Spot Cash Discount (7%)', rate: 0.07 }, schedule: spotCash },
  { id: 'cash-spot-30', label: 'Spot Cash (within 30 days)', discount: { label: 'Spot Cash Discount (6%)', rate: 0.06 }, schedule: spotCash },
  // P29 =(P22-P28)/24 and /34
  { id: 'cash-def-24', label: 'Deferred Cash 24 months', schedule: (net, rf) => withTotal(cashMonthly([], (net - rf) / 24, 24), rf) },
  { id: 'cash-def-34', label: 'Deferred Cash 34 months', schedule: (net, rf) => withTotal(cashMonthly([], (net - rf) / 34, 34), rf) },
  // P29 =P22*5%-P28, P30 =(P22*95%)/23
  {
    id: 'cash-s5-95-23',
    label: 'Spot 5% + 95% in 23 months',
    schedule: (net, rf) => withTotal(cashMonthly([{ label: 'Spot Payment (5%)', amount: net * 0.05 - rf }], (net * 0.95) / 23, 23), rf),
  },
];

export const TERMS: Record<Financing, Term[]> = { pagibig: PAGIBIG, bank: BANK, inhouse: BANK, cash: CASH };

export const YEARS: Record<Financing, number[]> = {
  pagibig: [30, 25, 20, 15, 10], // the template shows 20, 15, 10; 30 and 25 kept on the owner's instruction (Pag-IBIG allows up to 30)
  bank: [20, 15, 10, 5],
  inhouse: [10, 5],
  cash: [],
};

/** Excel PMT(rate/12, months, -1): monthly payment per peso borrowed. */
const pmt = (annualRate: number, months: number) => {
  const r = annualRate / 12;
  return r / (1 - Math.pow(1 + r, -months));
};

export interface Loan {
  rate: number;
  rateNote: string;
  amortization: number;
  /** In-House only: =P22*7.5% spread over the term. */
  mri: number | null;
  total: number;
}

export function loan(financing: Financing, balance: number, net: number, years: number): Loan | null {
  const months = years * 12;
  if (financing === 'pagibig') {
    const amortization = balance * pmt(0.0625, months);
    return { rate: 0.0625, rateNote: 'Pag-IBIG 6.25% (fixed for 3 years)', amortization, mri: null, total: amortization };
  }
  if (financing === 'bank') {
    const amortization = balance * pmt(0.0775, months);
    return { rate: 0.0775, rateNote: 'Bank 7.75% (indicative)', amortization, mri: null, total: amortization };
  }
  if (financing === 'inhouse') {
    const rate = years === 10 ? 0.16 : 0.14; // =PMT(16%/12,12*10,-1) / =PMT(14%/12,12*5,-1)
    const amortization = balance * pmt(rate, months);
    const mri = (net * 0.075) / months;
    return { rate, rateNote: `In-House ${rate * 100}%`, amortization, mri, total: amortization + mri };
  }
  return null;
}

/**
 * Reservation fees effective August 2026. Returns null when the published schedule does
 * not cover the unit, in which case no computation is shown rather than a guessed one.
 */
export function reservationFee(unitType: string, project: string): number | null {
  const t = unitType.toUpperCase();
  if (/^ALORA MID|^AURORA MID/.test(t)) return 10000;
  if (/^ALORA END|^AURORA END/.test(t)) return 12500;
  if (/^CALISTA MID|^AMANI MID/.test(t)) return 15000;
  if (/^CALISTA END|^AMANI END|^LOT ONLY/.test(t)) return 20000;
  if (/^BRENNA/.test(t)) return 25000;
  // The increase for Gensan Dua is deferred to January 2027 and its current fee is not in the memo.
  if (/^DUA/.test(t)) return /GENSAN/i.test(project) ? null : 25000;
  if (/^UNNA|^CARTLAND|^CHARLES|^CHRISTIE/.test(t)) return 30000;
  if (/^CORIN/.test(t)) return 50000;
  return null;
}

/**
 * Pag-IBIG is not offered for these models (owner's instruction, November 2026):
 * their prices are beyond what Pag-IBIG lends.
 */
export const pagibigAvailable = (unitType: string) => !/^(UNNA|DUA|BRENNA|CARTLAND|CHARLES|CHRISTIE|CORIN)\b/.test(unitType.toUpperCase());

/** Payment terms offered for a financing type. */
export function termsFor(financing: Financing): Term[] {
  return TERMS[financing];
}

/** Units priced at or above this (before VAT) carry 12% VAT (owner's instruction, Nov 2026). */
export const VAT_THRESHOLD = 3_600_000;
export const VAT_RATE = 0.12;

/**
 * VAT is worked out here, not taken from the inventory: 12% of the price before VAT when that
 * price is ₱3.6M or more, otherwise none. The price before VAT is the inventory's "TCP w/o VAT"
 * (its TCP minus any VAT it lists).
 */
export function vatFor(priceBeforeVat: number): number {
  return priceBeforeVat >= VAT_THRESHOLD ? priceBeforeVat * VAT_RATE : 0;
}

export interface Price {
  /** Contract price before VAT, before any discount (the template's TCP). */
  tcp: number;
  discount: number;
  /** VAT after the discount. */
  vat: number;
  /** Price before VAT, after the discount (the template's P18). */
  beforeVat: number;
  /** Net contract price after discount and VAT (the template's P22). */
  net: number;
}

/**
 * The discount comes off the price before VAT. VAT then shrinks by the same share: in the
 * template the processing fee is discounted by the total discount % and VAT is 12% of what
 * remains, which works out to VAT x (1 - discount / TCP).
 */
export function price(tcp: number, term?: Term): Price {
  const vat = vatFor(tcp);
  const discount = term?.discount ? tcp * term.discount.rate : 0;
  const share = tcp > 0 ? discount / tcp : 0;
  const vatAfter = vat * (1 - share);
  const beforeVat = tcp - discount;
  return { tcp, discount, vat: vatAfter, beforeVat, net: beforeVat + vatAfter };
}
