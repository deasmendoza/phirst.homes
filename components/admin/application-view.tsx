import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type Status } from '@/components/admin/api';
import { autoTicks, loadPicture, makePdf, type Checklist, type SafApplication } from '@/components/admin/saf-build';
import { PdfPreview } from '@/components/admin/pdf-preview';
import { BTN, BTN_DANGER, BTN_GOLD, CARD, ConfirmDialog, Icon, INPUT, StatusSelect, when, type IconName } from '@/components/admin/ui';

type Answers = Record<string, string | SafApplication['history']>;
interface Detail {
  application: SafApplication & { id: string; files: Record<string, string> };
  files: Record<string, { id: string; type?: string; size?: number } | null>;
  edits: { answers: Answers; photoRemoved: boolean; checklist: Partial<Checklist>; editedBy: string; editedAt: string; log?: { by: string; at: string }[] } | null;
  meta: { status: Status; statusAt?: string; statusBy?: string; deleteAfter?: string; savedAt?: string; savedBy?: string };
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

  if (error) return <div className={CARD}><button className={BTN} onClick={onBack}><Icon name="back" size={16} />Applications</button><p className="mt-4 text-[#ff8f86]">{error}</p></div>;
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
  }).finally(() => setConfirmDelete(false));
  const download = () => {
    if (!pdf) return;
    const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAF-${merged.lastName}-${merged.firstName}.pdf`.replace(/[^\w.-]+/g, '_');
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const fullName = `${merged.firstName} ${merged.lastName}`.trim();
  const m = merged as unknown as Record<string, string>;
  const cardTitle = (icon: IconName, text: string) => (
    <h3 className="m-0 mb-3 flex items-center gap-3 font-serif text-[22px] font-semibold text-gold-soft"><Icon name={icon} size={26} />{text}</h3>
  );

  // What has happened to this application, oldest first. Only things that were really recorded.
  const activity: { at: string; text: string }[] = [{ at: d.application.receivedAt, text: 'Application Submitted' }];
  for (const e of d.edits?.log ?? []) activity.push({ at: e.at, text: `Answers edited by ${e.by}` });
  if (d.meta.statusAt) activity.push({ at: d.meta.statusAt, text: `Status changed to ${d.meta.status}${d.meta.statusBy ? ` by ${d.meta.statusBy}` : ''}` });
  if (d.meta.savedAt) activity.push({ at: d.meta.savedAt, text: `Marked as saved on computer${d.meta.savedBy ? ` by ${d.meta.savedBy}` : ''}` });
  activity.sort((a, b) => a.at.localeCompare(b.at));

  const details: [string, string][] = [
    ['Full Name', fullName], ['Mobile Number', m.mobile], ['Email Address', m.email], ['Position', m.position],
    ['Manager', m.manager], ['Sales Channel', m.salesChannel], ['Date Submitted', when(d.application.receivedAt)],
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button className={BTN} onClick={onBack}><Icon name="back" size={16} />Applications</button>
        <h1 className="m-0 font-serif text-[clamp(26px,3vw,38px)] font-semibold text-gold-soft">{fullName}</h1>
        <StatusSelect value={d.meta.status} onChange={setStatus} disabled={busy || !canEdit} />
        <span className="text-[14px] text-white/85 sm:border-l sm:border-white/25 sm:pl-4">Received: {when(d.application.receivedAt)}</span>
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          <button className={BTN_GOLD} onClick={download} disabled={!pdf}><Icon name="download" size={18} />Download PDF</button>
          {canRemove && <button className={BTN_DANGER} onClick={() => setConfirmDelete(true)} disabled={busy}><Icon name="trash" size={18} />Delete Application</button>}
        </div>
      </div>

      <p className="m-0 flex items-center gap-3 rounded-xl border border-[#d9a94a]/45 bg-black/50 px-4 py-3 text-[14px]">
        <span className="text-gold-soft"><Icon name="info" size={22} /></span>
        Applications submitted through the PHIRST public website automatically appear in this admin system.
      </p>
      {note && <p role="status" className="m-0 rounded-lg border border-[#d9a94a]/50 bg-gold/10 px-4 py-2 text-[14px] text-gold-soft">{note}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className={CARD} aria-label="Seller Accreditation Form">
          {cardTitle('file', 'Seller Accreditation Form')}
          {!pdf ? <p className="py-10 text-center text-white/60">Making the PDF…</p> : (
            <PdfPreview pdf={pdf} hasPhoto={!!d.application.files.photo && canEdit} photoRemoved={photoRemoved} onTogglePhoto={() => { setPhotoRemoved((v) => !v); setDirty(true); }} />
          )}
          <p className="mb-0 mt-3 text-[13px] text-white/60">The red × on the 2x2 frame removes the picture from the PDF (it can be put back). Save the edits to keep the change.</p>
        </section>

        <div className="grid gap-5">
          <section className={CARD}>
            {cardTitle('user', 'Applicant Details')}
            <dl className="m-0 grid gap-y-2 text-[15px]">
              {details.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[150px_14px_minmax(0,1fr)]"><dt>{k}</dt><dd className="m-0">:</dd><dd className="m-0 break-words">{v || <span className="text-white/35">—</span>}</dd></div>
              ))}
            </dl>
          </section>

          <section className={CARD}>
            {cardTitle('paperclip', 'Uploaded Files')}
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {Object.keys(FILE_LABELS).map((k) => {
                const f = d.files[k];
                return (
                  <li key={k} className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2.5 text-[15px] last:border-0">
                    <span className="mr-auto">{FILE_LABELS[k]}{f && <span className="ml-3 text-[13px] text-white/55">{KB(f.size)}</span>}</span>
                    {f ? (
                      <>
                        <a className="inline-flex items-center gap-2 rounded-full border border-[#d9b35f]/60 px-4 py-1.5 text-[13px] font-semibold text-gold-soft no-underline hover:bg-gold/10" href={`/api/admin/files/${f.id}`} target="_blank" rel="noopener noreferrer"><Icon name="eye" size={15} />Open</a>
                        <a className="inline-flex items-center gap-2 rounded-full border border-[#d9b35f]/60 px-4 py-1.5 text-[13px] font-semibold text-gold-soft no-underline hover:bg-gold/10" href={`/api/admin/files/${f.id}?download=1`}><Icon name="download" size={15} />Download</a>
                      </>
                    ) : <span className="text-[13px] text-white/45">{d.application.files[k] ? 'file is gone' : 'not uploaded'}</span>}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={CARD}>
            {cardTitle('check', 'Checklist of Requirements')}
            <p className="m-0 mb-2 text-[13px] text-white/60">Ticked automatically from what was uploaded and answered{canEdit ? '; you can change them' : ''}.</p>
            {effective && CHECKS.map(([k, label]) => (
              <label key={k} className="flex items-start gap-3 py-1.5 text-[15px]">
                <input type="checkbox" className="mt-1 size-[18px] accent-[#d9a94a]" checked={effective[k]} disabled={!canEdit} onChange={() => toggleCheck(k)} />
                {label}
              </label>
            ))}
          </section>

          <section className={CARD}>
            {cardTitle('clock', 'Application Activity')}
            <ul className="m-0 grid list-none gap-2.5 p-0 text-[14px]">
              {activity.map((a, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3 border-b border-white/10 pb-2.5 last:border-0">
                  <span className="size-2 shrink-0 rounded-full bg-gold-soft" />
                  <span className="mr-auto">{a.text}</span>
                  <span className="text-white/65">{when(a.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className={CARD}>
        {cardTitle('file', 'Saved on my computer')}
        {d.meta.deleteAfter ? (
          <>
            <p className="mt-0 text-[14px]">This application (and its files) will be deleted on <strong>{when(d.meta.deleteAfter)}</strong>.</p>
            <button className={BTN} disabled={busy || !canEdit} onClick={() => saved(false)}>Cancel the deletion</button>
          </>
        ) : (
          <>
            <p className="mt-0 text-[14px] text-white/80">Download the PDF and the files first. When you press the button, this application is deleted from the server after 3 days.</p>
            <button className={BTN} disabled={busy || !canEdit} onClick={() => saved(true)}>I saved it on my computer</button>
          </>
        )}
      </section>

      <section className={CARD}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="m-0 mr-auto font-serif text-[22px] font-semibold text-gold-soft">Answers (editable)</h3>
          {d.edits && <span className="text-[13px] text-white/65">Edited by {d.edits.editedBy} · {when(d.edits.editedAt)}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map(([k, label]) => (
            <label key={k} className="grid gap-1 text-[13px] font-semibold text-white/85">
              {label}
              <input className={INPUT} value={m[k] ?? ''} disabled={!canEdit} onChange={(e) => set(k, e.target.value)} />
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

      {confirmDelete && (
        <ConfirmDialog title="Delete this application?" confirmLabel="Yes, delete" busy={busy} onConfirm={remove} onCancel={() => setConfirmDelete(false)}>
          This permanently deletes the application of <strong>{fullName}</strong> and all of their uploaded files (including the signature and picture). It cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  );
}
