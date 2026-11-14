// Sample-computation maths, transcribed from the two official templates:
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

/** "SPOT 5%; x% IN n MOS": spot =P22*5%-P28 (split in 2 or 3 for the 60/90-day versions), then =(P22*x%)/n. */
const spotThen = (parts: 1 | 2 | 3, restPct: number, months: number) => (net: number, rf: number): Schedule => {
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

/** "SPOT 20%" (and the bank sheet named "SPOT 10%", whose formula is also =(P22*20%)-P28). */
const spotOnly = (pct: number) => (net: number, rf: number): Schedule => ({
  dpPct: pct,
  spots: [{ label: `Spot Payment (${pct * 100}%)`, amount: net * pct - rf }],
  monthly: null,
  last: null,
  extra: [],
  total: net * pct,
});

const PAGIBIG: Term[] = [
  { id: 'pif-20-12', label: '20% in 12 months', schedule: installment(0.2, 12) },
  { id: 'pif-20-18', label: '20% in 18 months', schedule: installment(0.2, 18) },
  { id: 'pif-s5rs-10-15', label: 'Spot 5% (reservation month) + 10% in 15 months', schedule: spotThen(1, 0.1, 15) },
  { id: 'pif-s5-30-5-13', label: 'Spot 5% in 30 days + 5% in 13 months', schedule: spotThen(1, 0.05, 13) },
  { id: 'pif-s5-60-5-13', label: 'Spot 5% in 60 days + 5% in 13 months', schedule: spotThen(2, 0.05, 13) },
  { id: 'pif-s5-90-5-13', label: 'Spot 5% in 90 days + 5% in 13 months', schedule: spotThen(3, 0.05, 13) },
  { id: 'pif-s20', label: 'Spot 20%', schedule: spotOnly(0.2) },
];

const BANK: Term[] = [
  { id: 'bank-10-12', label: '10% in 12 months', schedule: installment(0.1, 12) },
  { id: 'bank-15-14', label: '15% in 14 months', schedule: installment(0.15, 14) },
  { id: 'bank-15-18', label: '15% in 18 months', schedule: installment(0.15, 18) },
  { id: 'bank-s5rs-10-13', label: 'Spot 5% (reservation month) + 10% in 13 months', schedule: spotThen(1, 0.1, 13) },
  { id: 'bank-s5-30-10-13', label: 'Spot 5% in 30 days + 10% in 13 months', schedule: spotThen(1, 0.1, 13) },
  { id: 'bank-s5-60-10-13', label: 'Spot 5% in 60 days + 10% in 13 months', schedule: spotThen(2, 0.1, 13) },
  { id: 'bank-s5-90-10-13', label: 'Spot 5% in 90 days + 10% in 13 months', schedule: spotThen(3, 0.1, 13) },
  // The template names this sheet "SPOT 10%" while its formula takes 20%; kept as is.
  { id: 'bank-s10', label: 'Spot 10%', schedule: spotOnly(0.2) },
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

const CASH: Term[] = [
  {
    id: 'cash-spot',
    label: 'Spot Cash',
    // P29 =P22-P28-P30, P30 Retention Fee 5000
    schedule: (net, rf) =>
      withTotal(
        { dpPct: null, spots: [{ label: 'Spot Payment', amount: net - rf - 5000 }], monthly: null, last: null, extra: [{ label: 'Retention Fee', amount: 5000 }], total: 0 },
        rf,
      ),
  },
  // P29 =(P22-P28)/24
  { id: 'cash-def-24', label: 'Deferred Cash 24 months', schedule: (net, rf) => withTotal(cashMonthly([], (net - rf) / 24, 24), rf) },
  { id: 'cash-def-36', label: 'Deferred Cash 36 months', schedule: (net, rf) => withTotal(cashMonthly([], (net - rf) / 36, 36), rf) },
  // P29 =P22*5%-P28, P30 =(P22-(P28+P29))/34
  {
    id: 'cash-s5-95-34',
    label: 'Spot 5% + 95% in 34 months',
    schedule: (net, rf) => withTotal(cashMonthly([{ label: 'Spot Payment (5%)', amount: net * 0.05 - rf }], (net - net * 0.05) / 34, 34), rf),
  },
  {
    id: 'cash-s5-95-32',
    label: 'Spot 5% + 95% in 32 months',
    schedule: (net, rf) => withTotal(cashMonthly([{ label: 'Spot Payment (5%)', amount: net * 0.05 - rf }], (net - net * 0.05) / 32, 32), rf),
  },
  // This one sheet uses P18 (price BEFORE VAT): P29 =P18*20%-P28, P30 =(P18*80%)/20
  {
    id: 'cash-s20-80-20',
    label: 'Spot 20% + 80% in 20 months',
    schedule: (_net, rf, beforeVat) =>
      withTotal(cashMonthly([{ label: 'Spot Payment (20%)', amount: beforeVat * 0.2 - rf }], (beforeVat * 0.8) / 20, 20), rf),
  },
  // P29 =P22*20%-P28, P30 =P22*80%/23
  {
    id: 'cash-s20-80-23',
    label: 'Spot 20% + 80% in 23 months',
    schedule: (net, rf) => withTotal(cashMonthly([{ label: 'Spot Payment (20%)', amount: net * 0.2 - rf }], (net * 0.8) / 23, 23), rf),
  },
];

export const TERMS: Record<Financing, Term[]> = { pagibig: PAGIBIG, bank: BANK, inhouse: BANK, cash: CASH };

export const YEARS: Record<Financing, number[]> = {
  pagibig: [30, 25, 20, 15, 10],
  bank: [15, 10, 5],
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
    const amortization = balance * pmt(0.1, months);
    return { rate: 0.1, rateNote: 'Bank 10% (indicative)', amortization, mri: null, total: amortization };
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
