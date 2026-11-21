import { useEffect, useMemo, useState } from 'react';
import { api, STATUSES, type Status } from '@/components/admin/api';
import { BTN, BTN_DANGER, CARD, ConfirmDialog, Icon, INPUT, PageTitle, StatusSelect, when } from '@/components/admin/ui';

// Every submitted application, straight from the database: search, status filter, pages, View and Delete.

export interface AppRow { id: string; receivedAt: string; name: string; email: string; mobile: string; position: string; focusProject: string; status: Status; edited: boolean; deleteAfter: string | null; hasFiles: number }

const PAGE = 10;
const matches = (hay: string[], q: string) => !q || hay.join(' ').toLowerCase().includes(q.toLowerCase());

export function ApplicationsList({ canEdit, canRemove, open }: { canEdit: boolean; canRemove: boolean; open: (id: string) => void }) {
  const [rows, setRows] = useState<AppRow[] | null>(null);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const [doomed, setDoomed] = useState<AppRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ applications: AppRow[] }>('applications').then((r) => setRows(r.applications), (e) => setErr(e.message));
  }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => matches([r.name, r.email, r.mobile], q) && (!st || r.status === st)), [rows, q, st]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages);
  const slice = shown.slice((cur - 1) * PAGE, cur * PAGE);

  const change = async (r: AppRow, status: Status) => {
    setRows((all) => all!.map((x) => (x.id === r.id ? { ...x, status } : x)));
    try { await api(`applications/${encodeURIComponent(r.id)}/status`, 'PUT', { status }); } catch (e) { setErr((e as Error).message); }
  };
  const remove = async () => {
    if (!doomed) return;
    setBusy(true);
    try {
      await api(`applications/${encodeURIComponent(doomed.id)}`, 'DELETE');
      setRows((all) => all!.filter((x) => x.id !== doomed.id));
      setErr('');
      setDoomed(null);
    } catch (e) {
      setErr((e as Error).message);
      setDoomed(null);
    } finally {
      setBusy(false);
    }
  };

  const th = 'px-3 py-3 text-left text-[14px] font-semibold text-gold-soft';
  return (
    <div className="grid gap-5">
      <PageTitle icon="file" title="Applications">Manage and review all Sellers Accreditation applications.</PageTitle>
      {err && <p role="alert" className="m-0 rounded-lg border border-[#e0443a]/60 px-4 py-2 text-[14px] text-[#ff8f86]">{err}</p>}

      <section className={`${CARD} !p-4 sm:!p-5`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-soft"><Icon name="search" size={20} /></span>
            <input className={`${INPUT} !pl-11`} type="search" placeholder="Search: name, e-mail, number…" aria-label="Search applications" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </label>
          <select aria-label="Filter by status" className={`${INPUT} sm:max-w-[200px]`} value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {!rows ? <p className="m-0 py-6 text-white/70">One moment…</p> : shown.length === 0 ? <p className="m-0 py-6 text-white/70">No applications{rows.length ? ' that match' : ' yet'}.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-gold/30">
                  <th className={th}>#</th><th className={th}>Applicant Name</th><th className={th}>Position</th><th className={th}>Contact Number</th>
                  <th className={th}>Email Address</th><th className={th}>Date Submitted</th><th className={th}>Status</th><th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((r, i) => (
                  <tr key={r.id} className="border-b border-white/10 last:border-0">
                    <td className="px-3 py-3.5">{(cur - 1) * PAGE + i + 1}</td>
                    <td className="px-3 py-3.5 font-medium">
                      {r.name}{r.edited && <span className="ml-2 text-[12px] font-normal text-white/50">(edited)</span>}
                      {r.deleteAfter && <span className="mt-0.5 block text-[12px] font-normal text-[#ff8f86]">deletes on {when(r.deleteAfter)}</span>}
                    </td>
                    <td className="px-3 py-3.5">{r.position}</td>
                    <td className="whitespace-nowrap px-3 py-3.5">{r.mobile}</td>
                    <td className="break-all px-3 py-3.5">{r.email}</td>
                    <td className="whitespace-nowrap px-3 py-3.5">{when(r.receivedAt)}</td>
                    <td className="px-3 py-3.5"><StatusSelect value={r.status} onChange={(s) => change(r, s)} disabled={!canEdit} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex gap-2">
                        <button className={`${BTN} !h-9 !px-4`} onClick={() => open(r.id)} aria-label={`View ${r.name}`}><Icon name="eye" size={16} />View</button>
                        {canRemove && <button className={`${BTN_DANGER} !h-9 !px-4`} onClick={() => setDoomed(r)} aria-label={`Delete ${r.name}`}><Icon name="trash" size={16} />Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows && shown.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px]">
            <span className="text-white/85">Showing {(cur - 1) * PAGE + 1}–{Math.min(cur * PAGE, shown.length)} of {shown.length} application{shown.length === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <button className={`${BTN} !h-9 !px-3`} disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Previous page">‹</button>
              <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-gold px-3 font-bold text-[#141414]">{cur}</span>
              {pages > 1 && <span className="text-white/60">of {pages}</span>}
              <button className={`${BTN} !h-9 !px-3`} disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Next page">›</button>
            </div>
          </div>
        )}
      </section>

      {doomed && (
        <ConfirmDialog title="Delete this application?" confirmLabel="Yes, delete" busy={busy} onConfirm={remove} onCancel={() => setDoomed(null)}>
          This permanently deletes the application of <strong>{doomed.name}</strong> and all of their uploaded files (picture, signature and documents). It cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  );
}
