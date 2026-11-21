import { useEffect, useMemo, useState } from 'react';
import { api, STATUSES, type Status } from '@/components/admin/api';
import { BTN, BTN_DANGER, BTN_GOLD, CARD, ConfirmDialog, Icon, INPUT, PageTitle, StatusSelect, when } from '@/components/admin/ui';

// Tripping Requests: ONE booking = ONE card, with ONE Copy button and ONE Delete button.

export type Booking = Record<string, string | number> & { id: string; status: Status };

const niceDate = (date: string) => (/^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) : date);
const niceTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) ? `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` : time;
};

/** The whole booking, labels included, in the wording the team pastes into Messenger. */
export function requestText(b: Booking) {
  return [
    `Charged To: ${b.chargedTo}`,
    `Department: ${b.department}`,
    `Div Head: ${b.divHead}`,
    `Gen Manager: ${b.genManager}`,
    `Date Needed: ${niceDate(String(b.date ?? ''))}`,
    `Time Needed: ${niceTime(String(b.time ?? ''))}`,
    `Pick up point: ${b.pickupPoint}`,
    `Itinerary: ${b.itinerary}`,
    `Total Pax: ${b.totalPax}`,
    `Purpose: ${b.purpose}`,
    `Client's Name: ${b.clientName}`,
    `AM: ${b.areaManager}`,
    `Seller's Name: ${b.sellerName}`,
    `Sellers Contact Number: ${b.sellerContact}`,
  ].join('\n');
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="grid grid-cols-[112px_12px_minmax(0,1fr)] gap-x-1 py-[3px] text-[14px] leading-snug">
      <span className="font-semibold text-gold-soft">{label}</span><span>:</span><span className="break-words">{value || <span className="text-white/35">—</span>}</span>
    </div>
  );
}

function BookingCard({ b, canEdit, canRemove, onStatus, onDelete }: { b: Booking; canEdit: boolean; canRemove: boolean; onStatus: (s: Status) => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyText(requestText(b));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <article className={`${CARD} !p-4 sm:!p-5`} aria-label={`Booking of ${b.clientName}`}>
      <div className="grid items-center gap-5 lg:grid-cols-[210px_minmax(0,1fr)_minmax(0,1fr)_150px]">
        <div className="flex gap-4">
          <span className="text-gold-soft"><Icon name="car" size={42} /></span>
          <div className="min-w-0">
            <h2 className="m-0 font-serif text-[22px] font-semibold text-gold-soft">Site Tripping</h2>
            <p className="m-0 text-[13px] text-white/65">Received {when(String(b.receivedAt))}</p>
            <p className="m-0 mt-3 flex items-center gap-2 text-[13px] text-white/75"><Icon name="calendar" size={16} />Date Needed:</p>
            <p className="m-0 pl-6 text-[16px] font-bold">{niceDate(String(b.date))}</p>
            <p className="m-0 mt-2 flex items-center gap-2 text-[13px] text-white/75"><Icon name="clock" size={16} />Time Needed:</p>
            <p className="m-0 pl-6 text-[16px] font-bold">{niceTime(String(b.time))}</p>
          </div>
        </div>
        <div className="border-white/15 lg:border-l lg:pl-5">
          <Field label="Charged To" value={b.chargedTo} />
          <Field label="Department" value={b.department} />
          <Field label="Div Head" value={b.divHead} />
          <Field label="Gen Manager" value={b.genManager} />
          <Field label="Pick up point" value={b.pickupPoint} />
          <Field label="Itinerary" value={b.itinerary} />
        </div>
        <div className="border-white/15 lg:border-l lg:pl-5">
          <Field label="Total Pax" value={b.totalPax} />
          <Field label="Purpose" value={b.purpose} />
          <Field label="Client's Name" value={b.clientName} />
          <Field label="AM" value={b.areaManager} />
          <Field label="Seller's Name" value={b.sellerName} />
          <Field label="Sellers Contact No." value={b.sellerContact} />
        </div>
        <div className="grid gap-2.5">
          <button className={BTN_GOLD} onClick={copy} aria-label={`Copy booking of ${b.clientName}`}><Icon name="copy" size={18} />{copied ? 'Copied!' : 'Copy'}</button>
          {canRemove && <button className={BTN_DANGER} onClick={onDelete} aria-label={`Delete booking of ${b.clientName}`}><Icon name="trash" size={18} />Delete</button>}
          <StatusSelect value={b.status} onChange={onStatus} disabled={!canEdit} />
        </div>
      </div>
      <p className="m-0 mt-3 border-t border-white/10 pt-3 text-[13px] text-white/65">
        Client contact: {b.clientContact}{b.clientEmail ? ` · ${b.clientEmail}` : ''}{b.clientFacebook ? ` · ${b.clientFacebook}` : ''}
        {b.project ? ` · Looking at: ${[b.project, b.houseModel, b.unit].filter(Boolean).join(' / ')}` : ''}
        {b.addedBy ? ' · added by staff' : ''}
      </p>
    </article>
  );
}

const EMPTY = { clientName: '', clientContact: '', clientEmail: '', clientFacebook: '', date: '', time: '', pickupPoint: '', itinerary: '', totalPax: '', sellerName: '', sellerContact: '' };
const ADD_FIELDS: [keyof typeof EMPTY, string, string?][] = [
  ['clientName', "Client's name"], ['clientContact', "Client's contact number"], ['clientEmail', "Client's e-mail (optional)", 'email'], ['clientFacebook', "Client's Facebook (optional)"],
  ['date', 'Date needed', 'date'], ['time', 'Time needed', 'time'], ['pickupPoint', 'Pick up point'], ['itinerary', 'Itinerary'], ['totalPax', 'Total pax', 'number'],
  ['sellerName', "Seller's name"], ['sellerContact', 'Sellers contact number'],
];

/** For a booking the staff have to write in themselves. Clients still book on the public website. */
function AddTripping({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [f, setF] = useState({ ...EMPTY, sellerName: 'Michael & Andrea Mendoza' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('bookings', 'POST', f);
      onSaved();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="add-title">
      <form onSubmit={save} className={`${CARD} w-full max-w-[680px]`}>
        <h2 id="add-title" className="m-0 mb-1 font-serif text-[26px] font-semibold text-gold-soft">Add Tripping</h2>
        <p className="m-0 mb-4 text-[14px] text-white/70">For a booking you have to write in yourself. Charged To, Department, Div Head, Gen Manager and AM are filled in for you.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADD_FIELDS.map(([k, label, type]) => (
            <label key={k} className="grid gap-1 text-[13px] font-semibold text-white/85">
              {label}
              <input className={INPUT} type={type ?? 'text'} min={type === 'number' ? 1 : undefined} max={type === 'number' ? 99 : undefined} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        {err && <p role="alert" className="mb-0 mt-3 text-[14px] text-[#ff8f86]">{err}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" className={BTN} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className={BTN_GOLD} disabled={busy}>{busy ? 'Saving…' : 'Save booking'}</button>
        </div>
      </form>
    </div>
  );
}

export function BookingsList({ canEdit, canRemove }: { canEdit: boolean; canRemove: boolean }) {
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const [doomed, setDoomed] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = () => api<{ bookings: Booking[] }>('bookings').then((r) => setRows(r.bookings), (e) => setErr(e.message));
  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => {
    const hay = [r.clientName, r.sellerName, r.itinerary].join(' ').toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!st || r.status === st);
  }), [rows, q, st]);
  const PAGE = 8;
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages);

  const change = async (r: Booking, status: Status) => {
    setRows((all) => all!.map((x) => (x.id === r.id ? { ...x, status } : x)));
    try { await api(`bookings/${encodeURIComponent(r.id)}/status`, 'PUT', { status }); } catch (e) { setErr((e as Error).message); }
  };
  const remove = async () => {
    if (!doomed) return;
    setBusy(true);
    try {
      await api(`bookings/${encodeURIComponent(doomed.id)}`, 'DELETE');
      setRows((all) => all!.filter((x) => x.id !== doomed.id));
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      setDoomed(null);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle icon="calendar" title="Tripping Requests">View, copy, and manage all site tripping bookings.</PageTitle>
        {canEdit && <button className={BTN_GOLD} onClick={() => setAdding(true)}><Icon name="plus" size={18} />Add Tripping</button>}
      </div>
      {err && <p role="alert" className="m-0 rounded-lg border border-[#e0443a]/60 px-4 py-2 text-[14px] text-[#ff8f86]">{err}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-soft"><Icon name="search" size={20} /></span>
          <input className={`${INPUT} !pl-11`} type="search" placeholder="Search by client name, seller, or itinerary…" aria-label="Search bookings" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </label>
        <select aria-label="Filter bookings" className={`${INPUT} sm:max-w-[200px]`} value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }}>
          <option value="">All Bookings</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {!rows ? <p className="m-0 text-white/70">One moment…</p> : shown.length === 0 ? <p className="m-0 text-white/70">No bookings{rows.length ? ' that match' : ' yet'}.</p> : (
        <div className="grid gap-4">
          {shown.slice((cur - 1) * PAGE, cur * PAGE).map((b) => (
            <BookingCard key={b.id} b={b} canEdit={canEdit} canRemove={canRemove} onStatus={(s) => change(b, s)} onDelete={() => setDoomed(b)} />
          ))}
        </div>
      )}

      {rows && shown.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
          <span>Showing {(cur - 1) * PAGE + 1}–{Math.min(cur * PAGE, shown.length)} of {shown.length} tripping request{shown.length === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button className={`${BTN} !h-9 !px-3`} disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Previous page">‹</button>
            <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-gold px-3 font-bold text-[#141414]">{cur}</span>
            {pages > 1 && <span className="text-white/60">of {pages}</span>}
            <button className={`${BTN} !h-9 !px-3`} disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Next page">›</button>
          </div>
        </div>
      )}

      {adding && <AddTripping onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
      {doomed && (
        <ConfirmDialog title="Delete this booking?" confirmLabel="Yes, delete" busy={busy} onConfirm={remove} onCancel={() => setDoomed(null)}>
          This permanently deletes the site tripping booking of <strong>{String(doomed.clientName)}</strong> ({niceDate(String(doomed.date))}). It cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  );
}
