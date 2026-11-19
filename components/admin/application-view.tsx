import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type Status } from '@/components/admin/api';
import { autoTicks, loadPicture, makePdf, type Checklist, type SafApplication } from '@/components/admin/saf-build';
import { PdfPreview } from '@/components/admin/pdf-preview';
import { BTN, BTN_GOLD, CARD, INPUT, StatusSelect, when } from '@/components/admin/ui';

type Answers = Record<string, string | SafApplication['history']>;
interface Detail {
  application: SafApplication & { id: string; files: Record<string, string> };
  files: Record<string, { id: string; type?: string; size?: number } | null>;
  edits: { answers: Answers; photoRemoved: boolean; checklist: Partial<Checklist>; editedBy: string; editedAt: string } | null;
  meta: { status: Status; deleteAfter?: string; savedAt?: string; savedBy?: string };
}

const FIELDS: [string, string, string?][] = [
  ['lastName', 'Last name'], ['firstName', 'First name'], ['middleName', 'Middle name'], ['nickName', 'Nick name'],
  ['birthDate', 'Date of birth (YYYY-MM-DD)'], ['gender', 'Gender'], ['civilStatus', 'Civil status'], ['licenseNo', 'License / Salesperson no.'], ['citizenship', 'Citizenship'],
  ['houseNo', 'House no.'], ['street', 'Street / Village'], ['city', 'Town / City'], ['province', 'Province / ZIP'],
  ['mobile', 'Mobile no.'], ['homePhone', 'Home phone'], ['email', 'E-mail'], ['source', 'Source of recruitment'], ['tin', 'TIN'],
  ['position', 'Position'], ['salesChannel', 'Sales channel'], ['focusProject', 'Focus project'], ['manager', 'Manager'], ['director', 'Director'],
  ['attainment', 'Highest educational attainment'], ['course', 'Course'], ['school', 'School'], ['yearGraduated', 'Year graduated'], ['schoolYears', 'No. of years'],
];
const CHECKS: [keyof Checklist, string][] = [
  ['privacy', 'Data Privacy Consent Form'], ['cor', 'Certificate of Registration (COR; BIR 2303)'], ['or', 'Copy and Original Booklet of Official Receipt (OR)'],
  ['prc', 'Real Estate Salesperson/Broker License ID (PRC)'], ['dhsud', 'DHSUD Certification / DHSUD ID'], ['nbi', 'NBI Clearance or Police Clearance'], ['photo', 'Two (2) pieces 2 x 2 ID picture'],
];
const FILE_LABELS: Record<string, string> = { transcript: 'Transcript of Records', clearance: 'NBI / Police Clearance', savings: 'CBS savings slip', photo: '2x2 picture', signature: 'Signature' };
const KB = (n?: number) => (n ? `${Math.max(1, Math.round(n / 1024))} KB` : '');

export function ApplicationView({ id, canEdit, canRemove, onBack, onChanged }: { id: string; canEdit: boolean; canRemove: boolean; onBack: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [overrides, setOverrides] = useState<Partial<Checklist>>({});
  const [dirty, setDirty] = useState(false);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [auto, setAuto] = useState<Checklist | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pics = useRef<{ photo: Uint8Array | null; signature: Uint8Array | null }>({ photo: null, signature: null });
  const [picsReady, setPicsReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<Detail>(`applications/${encodeURIComponent(id)}`);
      setD(r);
      setAnswers(r.edits?.answers ?? {});
      setPhotoRemoved(!!r.edits?.photoRemoved);
      setOverrides(r.edits?.checklist ?? {});
      setDirty(false);
      pics.current = { photo: await loadPicture(r.application.files.photo), signature: await loadPicture(r.application.files.signature) };
      setPicsReady(true);
      setAuto(await autoTicks(r.application));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  const merged = useMemo(() => (d ? ({ ...d.application, ...answers } as SafApplication) : null), [d, answers]);
  const effective = useMemo(() => (auto ? { ...auto, ...overrides } : null), [auto, overrides]);

  // The PDF is rebuilt a moment after every change.
  useEffect(() => {
    if (!merged || !picsReady) return;
    let dead = false;
    const t = setTimeout(() => {
      makePdf({ app: merged, photo: photoRemoved ? null : pics.current.photo, signature: pics.current.signature, checklist: overrides })
        .then((b) => !dead && setPdf(b))
        .catch(() => !dead && setNote('The PDF could not be made. Check the answers and try again.'));
    }, 450);
    return () => {
      dead = true;
      clearTimeout(t);
    };
  }, [merged, photoRemoved, overrides, picsReady]);

  if (error) return <div className={CARD}><button className={BTN} onClick={onBack}>← Back</button><p className="mt-4 text-[#ffb4a8]">{error}</p></div>;
  if (!d || !merged) return <p className="text-white/70">One moment…</p>;

  const set = (k: string, v: string) => { setAnswers((a) => ({ ...a, [k]: v })); setDirty(true); };
  const history = merged.history ?? [];
  const setHistory = (i: number, k: string, v: string) => {
    const rows = [0, 1, 2].map((n) => ({ ...{ year: '', company: '', position: '', address: '' }, ...(history[n] ?? {}) }));
    rows[i] = { ...rows[i], [k]: v };
    setAnswers((a) => ({ ...a, history: rows }));
    setDirty(true);
  };
  const toggleCheck = (k: keyof Checklist) => {
    if (!effective || !auto) return;
    const want = !effective[k];
    setOverrides((o) => {
      const n = { ...o };
      if (want === auto[k]) delete n[k]; else n[k] = want;
      return n;
    });
    setDirty(true);
  };

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true);
    setNote('');
    try {
      await fn();
      if (ok) setNote(ok);
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = () => run(async () => {
    await api(`applications/${encodeURIComponent(id)}/edits`, 'PUT', { answers: { ...answers }, photoRemoved, checklist: overrides });
    await load();
    onChanged();
  }, 'Edits saved. The original submission was not changed.');
  const revert = () => run(async () => {
    await api(`applications/${encodeURIComponent(id)}/edits`, 'DELETE');
    await load();
    onChanged();
  }, 'Restored to the original.');
  const setStatus = (status: Status) => run(async () => {
    const r = await api<{ meta: Detail['meta'] }>(`applications/${encodeURIComponent(id)}/status`, 'PUT', { status });
    setD({ ...d, meta: r.meta });
    onChanged();
  });
  const saved = (flag: boolean) => run(async () => {
    const r = await api<{ meta: Detail['meta'] }>(`applications/${encodeURIComponent(id)}/saved`, 'PUT', { saved: flag });
    setD({ ...d, meta: r.meta });
    onChanged();
  });
  const remove = () => run(async () => {
    await api(`applications/${encodeURIComponent(id)}`, 'DELETE');
    onChanged();
    onBack();
  });
  const download = () => {
    if (!pdf) return;
    const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAF-${merged.lastName}-${merged.firstName}.pdf`.replace(/[^\w.-]+/g, '_');
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const fullName = `${merged.firstName} ${merged.lastName}`;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button className={BTN} onClick={onBack}>← Applications</button>
        <h2 className="m-0 font-serif text-[26px] font-semibold text-gold-soft">{fullName}</h2>
        <StatusSelect value={d.meta.status} onChange={setStatus} disabled={busy || !canEdit} />
        <span className="text-[13px] text-white/60">Received: {when(d.application.receivedAt)}</span>
      </div>
      {note && <p role="status" className="rounded-lg border border-[#d9a94a]/50 bg-gold/10 px-4 py-2 text-[14px] text-gold-soft">{note}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className={CARD} aria-label="Sellers Accreditation Form">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="m-0 mr-auto font-serif text-[20px] font-semibold text-gold-soft">Sellers Accreditation Form (PDF)</h3>
            <button className={BTN_GOLD} onClick={download} disabled={!pdf}>Download PDF</button>
          </div>
          {!pdf ? <p className="py-10 text-center text-white/60">Making the PDF…</p> : (
            <PdfPreview pdf={pdf} hasPhoto={!!d.application.files.photo && canEdit} photoRemoved={photoRemoved} onTogglePhoto={() => { setPhotoRemoved((v) => !v); setDirty(true); }} />
          )}
          <p className="mt-3 text-[13px] text-white/55">The red × on the 2x2 frame removes the picture from the PDF (it can be put back). Save the edits to keep the change.</p>
        </section>

        <div className="grid gap-5">
          <section className={CARD}>
            <h3 className="m-0 mb-3 font-serif text-[20px] font-semibold text-gold-soft">Uploaded files</h3>
            <ul className="m-0 grid list-none gap-2 p-0">
              {Object.keys(FILE_LABELS).map((k) => {
                const f = d.files[k];
                return (
                  <li key={k} className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2 text-[14px]">
                    <span className="mr-auto">{FILE_LABELS[k]}{f && <span className="ml-2 text-white/50">{KB(f.size)}</span>}</span>
                    {f ? (
                      <>
                        <a className="rounded-full border border-[#d9b35f]/60 px-3 py-1 text-gold-soft no-underline" href={`/api/admin/files/${f.id}`} target="_blank" rel="noopener noreferrer">Open</a>
                        <a className="rounded-full border border-[#d9b35f]/60 px-3 py-1 text-gold-soft no-underline" href={`/api/admin/files/${f.id}?download=1`}>Download</a>
                      </>
                    ) : <span className="text-white/40">{d.application.files[k] ? 'file is gone' : 'not uploaded'}</span>}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={CARD}>
            <h3 className="m-0 mb-1 font-serif text-[20px] font-semibold text-gold-soft">Checklist of Requirements</h3>
            <p className="m-0 mb-3 text-[13px] text-white/55">Ticks are automatic; you can change them.</p>
            {effective && CHECKS.map(([k, label]) => (
              <label key={k} className="flex items-start gap-3 py-1.5 text-[14px]">
                <input type="checkbox" className="mt-1 size-4 accent-[#d9a94a]" checked={effective[k]} disabled={!canEdit} onChange={() => toggleCheck(k)} />
                {label}
              </label>
            ))}
          </section>

          <section className={CARD}>
            <h3 className="m-0 mb-1 font-serif text-[20px] font-semibold text-gold-soft">Saved on my computer</h3>
            {d.meta.deleteAfter ? (
              <>
                <p className="text-[14px]">This application (and its files) will be deleted on <strong>{when(d.meta.deleteAfter)}</strong>.</p>
                <button className={BTN} disabled={busy || !canEdit} onClick={() => saved(false)}>Cancel the deletion</button>
              </>
            ) : (
              <>
                <p className="text-[14px] text-white/75">Download the PDF and the files first. When you press the button, this application is deleted from the server after 3 days.</p>
                <button className={BTN} disabled={busy || !canEdit} onClick={() => saved(true)}>I saved it on my computer</button>
              </>
            )}
          </section>
        </div>
      </div>

      <section className={CARD}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="m-0 mr-auto font-serif text-[20px] font-semibold text-gold-soft">Answers (editable)</h3>
          {d.edits && <span className="text-[13px] text-white/60">Edited by {d.edits.editedBy} · {when(d.edits.editedAt)}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map(([k, label]) => (
            <label key={k} className="grid gap-1 text-[13px] font-semibold text-white/80">
              {label}
              <input className={INPUT} value={(merged as unknown as Record<string, string>)[k] ?? ''} disabled={!canEdit} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
        </div>
        <h4 className="mb-2 mt-5 text-[14px] font-bold uppercase tracking-wide text-gold">Accreditation history</h4>
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[90px_1fr_1fr_1.4fr]">
              {(['year', 'company', 'position', 'address'] as const).map((k) => (
                <input key={k} aria-label={`${k} ${i + 1}`} placeholder={k} className={INPUT} disabled={!canEdit} value={history[i]?.[k] ?? ''} onChange={(e) => setHistory(i, k, e.target.value)} />
              ))}
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={BTN_GOLD} disabled={busy || !dirty} onClick={save}>Save edits</button>
            <button className={BTN} disabled={busy || (!d.edits && !dirty)} onClick={revert}>Restore original</button>
          </div>
        )}
      </section>

      {canRemove && (
        <section className={`${CARD} border-[#b3261e]/60`}>
          <h3 className="m-0 mb-2 font-serif text-[20px] font-semibold text-[#ffb4a8]">Delete application</h3>
          {!confirmDelete ? (
            <button className={BTN} onClick={() => setConfirmDelete(true)}>Delete…</button>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-[14px]">Are you sure? This permanently deletes the application of <strong>{fullName}</strong> and all their uploaded files (including the signature and picture). It cannot be undone.</p>
              <div className="flex gap-3">
                <button className="inline-flex h-10 items-center rounded-full bg-[#b3261e] px-5 text-[14px] font-bold text-white disabled:opacity-50" disabled={busy} onClick={remove}>Yes, delete</button>
                <button className={BTN} onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
