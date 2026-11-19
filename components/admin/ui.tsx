import type { ReactNode } from 'react';
import { STATUSES, type Status } from '@/components/admin/api';

export const CARD = 'rounded-[18px] border border-[#d9a94a]/50 bg-[linear-gradient(180deg,rgba(9,20,42,0.92),rgba(5,11,26,0.92))] p-4 sm:p-6';
export const INPUT =
  'h-10 w-full min-w-0 rounded-[9px] border border-[#d9b35f]/60 bg-[#040b1a]/70 px-3 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-gold-soft focus:ring-2 focus:ring-gold/35';
export const BTN = 'inline-flex h-10 items-center justify-center rounded-full border border-[#d9b35f]/70 px-5 text-[14px] font-semibold text-white transition hover:bg-gold/15 disabled:opacity-50';
export const BTN_GOLD =
  'inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(100deg,#c2933a,#ecca7c_42%,#e3bb63_62%,#c79a3f)] px-5 text-[14px] font-bold text-[#171c3a] disabled:opacity-50';

/** A date and time as the team reads it: Manila time. */
export const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) : '';

export function StatusSelect({ value, onChange, disabled }: { value: Status; onChange: (s: Status) => void; disabled?: boolean }) {
  const tone = value === 'New' ? 'border-gold text-gold-soft' : value === 'Contacted' ? 'border-sky-300/70 text-sky-200' : 'border-emerald-300/70 text-emerald-200';
  return (
    <select
      aria-label="Status"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`h-9 rounded-full border bg-[#040b1a] px-3 text-[13px] font-bold ${tone}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-white/10 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-[13px] font-semibold uppercase tracking-wide text-gold/90">{label}</dt>
      <dd className="m-0 break-words text-[15px] text-white">{children || <span className="text-white/35">—</span>}</dd>
    </div>
  );
}
