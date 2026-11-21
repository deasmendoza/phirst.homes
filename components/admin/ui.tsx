import { useEffect, useRef, type ReactNode } from 'react';
import { STATUSES, type Status } from '@/components/admin/api';

// Black, gold and white only (red is kept for Delete, so it is never mistaken for anything else).
export const CARD = 'rounded-[18px] border border-[#d9a94a]/45 bg-[linear-gradient(180deg,#0e0e0e,#060606)] p-4 shadow-[0_0_0_1px_rgba(255,215,122,0.04),0_10px_30px_rgba(0,0,0,0.5)] sm:p-6';
export const INPUT =
  'h-11 w-full min-w-0 rounded-[10px] border border-[#d9b35f]/55 bg-black/60 px-3 text-[14px] text-white outline-none placeholder:text-white/40 focus:border-gold-soft focus:ring-2 focus:ring-gold/35 disabled:opacity-60';
export const BTN = 'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9b35f]/70 px-5 text-[14px] font-semibold text-white transition hover:bg-gold/15 disabled:opacity-50';
export const BTN_GOLD =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#c2933a,#ecca7c_42%,#e3bb63_62%,#c79a3f)] px-5 text-[14px] font-bold text-[#141414] transition hover:brightness-110 disabled:opacity-50';
export const BTN_DANGER =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e0443a]/80 bg-[#e0443a]/10 px-5 text-[14px] font-semibold text-[#ff8f86] transition hover:bg-[#e0443a]/25 disabled:opacity-50';
export const BTN_DANGER_SOLID = 'inline-flex h-10 items-center justify-center rounded-full bg-[#c4302a] px-5 text-[14px] font-bold text-white transition hover:brightness-110 disabled:opacity-50';

/** A date and time as the team reads it: Manila time. */
export const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) : '';

export function StatusSelect({ value, onChange, disabled }: { value: Status; onChange: (s: Status) => void; disabled?: boolean }) {
  const tone = value === 'New' ? 'border-gold text-gold-soft' : value === 'Contacted' ? 'border-white/80 text-white' : 'border-gold/40 bg-gold/15 text-gold-soft';
  return (
    <select
      aria-label="Status"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`h-9 rounded-full border bg-black px-3 text-[13px] font-bold ${tone}`}
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

/** The page title block used at the top of every admin page. */
export function PageTitle({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-gold-soft"><Icon name={icon} size={44} /></span>
      <div>
        <h1 className="m-0 font-serif text-[clamp(28px,3.2vw,40px)] font-semibold leading-tight text-gold-soft">{title}</h1>
        {children && <p className="m-0 mt-1 text-[15px] text-white/80">{children}</p>}
      </div>
    </div>
  );
}

/** A question the person must answer before anything permanent happens. Esc and Cancel both leave everything as it was. */
export function ConfirmDialog({ title, children, confirmLabel, busy, onConfirm, onCancel }: { title: string; children: ReactNode; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={`${CARD} w-full max-w-[460px] border-[#e0443a]/60`}>
        <h2 id="confirm-title" className="m-0 mb-3 font-serif text-[24px] font-semibold text-[#ff8f86]">{title}</h2>
        <div className="mb-5 text-[15px] leading-relaxed text-white/85">{children}</div>
        <div className="flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} className={BTN} disabled={busy} onClick={onCancel}>Cancel</button>
          <button className={BTN_DANGER_SOLID} disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export type IconName = 'dashboard' | 'file' | 'calendar' | 'users' | 'bell' | 'gear' | 'logout' | 'search' | 'eye' | 'trash' | 'copy' | 'plus' | 'download' | 'car' | 'check' | 'chart' | 'clock' | 'paperclip' | 'user' | 'info' | 'back' | 'home' | 'handshake';

const PATHS: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="3" width="4" height="18" rx="1" /><rect x="17" y="8" width="4" height="13" rx="1" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="12" cy="15" r="1.2" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.2c2.6.3 4.5 2.5 4.5 5.3" /></>,
  bell: <><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" /></>,
  logout: <><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" /><path d="M16 8l4 4-4 4M20 12H9" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>,
  eye: <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  car: <><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v3H3zM7 12h10" /><circle cx="7.5" cy="17.5" r="0.6" /><circle cx="16.5" cy="17.5" r="0.6" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  chart: <><path d="M12 3v9h9" /><path d="M20.5 15A9 9 0 1 1 9 3.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  paperclip: <path d="M20 11.5l-8 8a5 5 0 0 1-7-7l9-9a3.4 3.4 0 0 1 5 5l-9 9a1.8 1.8 0 0 1-2.5-2.5l8-8" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  handshake: <><path d="M2 12l4-4 5 2 4-2 4 4-8 8-9-8z" /><path d="M9 15l2 2" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {PATHS[name]}
    </svg>
  );
}
