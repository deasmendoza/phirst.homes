import { CARD, Icon } from '@/components/admin/ui';

// The sample commission computation shown to every agent on the dashboard. The figures are the official sample
// (Calista – End, Baliwag); they are not calculated here, so they must be updated by hand if the sample changes.

const COLS = ['1 SALE', '3 SALES', '5 SALES'];

type Tone = 'gray' | 'light' | 'blue' | 'total';
const ROWS: { label: string; tone: Tone; values: [string, string, string] }[] = [
  { label: '10% Downpayment', tone: 'gray', values: ['317,173.00', '951,519.00', '1,585,865.00'] },
  { label: 'Less: Reservation', tone: 'light', values: ['20,000.00', '60,000.00', '100,000.00'] },
  { label: 'DP net of RF', tone: 'gray', values: ['297,173.00', '891,519.00', '1,485,865.00'] },
  { label: 'DP amortization', tone: 'light', values: ['24,764.42', '74,293.25', '123,822.08'] },
  { label: '1st DP collected (20%)', tone: 'blue', values: ['12,686.92', '38,060.76', '63,434.60'] },
  { label: '5% DP collected (30%)', tone: 'blue', values: ['19,030.38', '57,091.14', '95,151.90'] },
  { label: '10% DP collected (30%)', tone: 'blue', values: ['19,030.38', '57,091.14', '95,151.90'] },
  { label: 'Fully Paid TCP (20%)', tone: 'blue', values: ['12,686.92', '38,060.76', '63,434.60'] },
  { label: 'TOTAL: 2% commission', tone: 'total', values: ['63,434.60', '190,303.80', '317,173.00'] },
];
const IMP: [string, string, string] = ['118,939.88', '356,819.64', '594,699.40'];

const TONE: Record<Tone, string> = {
  gray: 'bg-white/[0.09] text-white',
  light: 'bg-white/[0.04] text-white',
  blue: 'bg-[#0e3a63]/70 text-white',
  total: 'bg-[#f2b63c] font-bold text-[#141414]',
};

export function Commissions() {
  return (
    <section className={CARD} aria-labelledby="commissions-title">
      <h2 id="commissions-title" className="m-0 flex items-center gap-3 font-serif text-[22px] font-semibold">
        <span className="text-gold-soft"><Icon name="chart" size={26} /></span>Sample Computation for Commissions
      </h2>
      <p className="m-0 mt-2 text-[15px] text-white/90">
        <span className="font-semibold text-gold-soft">Payterm:</span> 10% DP in 12 months
        <span className="mx-2 text-white/40">|</span>
        <span className="font-semibold text-gold-soft">Total Selling Price:</span> Php 3,171,730
        <span className="mx-2 text-white/40">|</span>
        <span className="font-semibold text-gold-soft">House Model:</span> Calista – End (Baliwag)
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-[15px]">
          <thead>
            <tr>
              <th scope="col" className="rounded-l-lg bg-white/[0.12] px-3 py-2 text-left text-[13px] font-semibold tracking-wider">DETAILS</th>
              {COLS.map((c, i) => (
                <th key={c} scope="col" className={`bg-white/[0.12] px-3 py-2 text-right text-[13px] font-semibold tracking-wider ${i === COLS.length - 1 ? 'rounded-r-lg' : ''}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className={TONE[r.tone]}>
                <th scope="row" className="rounded-l-lg px-3 py-2 text-left font-medium">{r.label}</th>
                {r.values.map((v, i) => (
                  <td key={i} className={`px-3 py-2 text-right tabular-nums ${i === 2 ? 'rounded-r-lg' : ''}`}>{v}</td>
                ))}
              </tr>
            ))}
            <tr className="bg-gold/20 text-gold-soft">
              <th scope="row" className="rounded-l-lg px-3 py-3 text-left font-bold">IMP RATE: 3.75% COMMS</th>
              {IMP.map((v, i) => (
                <td key={i} className={`px-3 py-3 text-right text-[17px] font-bold tabular-nums ${i === 2 ? 'rounded-r-lg' : ''}`}>{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="m-0 mt-3 flex items-center gap-3 rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-[15px] text-white">
        <span className="text-gold-soft"><Icon name="handshake" size={24} /></span>
        <span><strong className="text-gold-soft">Overseas trip perk:</strong> close 3 house sales and above and earn a trip abroad.</span>
      </p>
    </section>
  );
}
