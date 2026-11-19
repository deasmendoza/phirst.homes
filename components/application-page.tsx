import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { SignaturePad, type SignaturePadHandle } from '@/components/signature-pad';
import { uploadFile, type UploadKind } from '@/lib/upload';

// /application: the Sellers Accreditation Form as a full page, with the Tranche 1 documents and
// the signature. Everything goes to the website itself (/api/applications); the team details
// (position, sales channel, focus project, manager, director) are fixed here and added again on
// the server, so they cannot be changed.

const FIXED: [string, string][] = [
  ['Position', 'International Territory Specialist'],
  ['Sales Channel', 'GST3/DIV1'],
  ['Focus Project', 'SOMA 1'],
  ['Manager', 'Marielle Medina'],
  ['Director', 'Jay Ar Tan Hachenova'],
];

const INPUT =
  'h-11 w-full min-w-0 rounded-[10px] border border-[#d9b35f]/75 bg-[#040b1a]/70 px-3 text-[15px] text-white outline-none transition [color-scheme:dark] placeholder:text-white/35 focus:border-gold-soft focus:ring-2 focus:ring-gold/35 read-only:cursor-default read-only:text-white/75';
const LABEL = 'mb-1 block text-[14px] font-semibold text-white';
const CARD =
  'rounded-[22px] border border-[#d9a94a]/70 bg-[linear-gradient(180deg,rgba(9,20,42,0.92),rgba(5,11,26,0.92))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-7';
const HEADING = 'font-serif text-[clamp(22px,2.2vw,30px)] font-semibold text-gold-soft';

const Star = () => (
  <span className="text-gold" aria-hidden="true">
    {' '}
    *
  </span>
);

function Field({ id, label, required, className = '', children }: { id: string; label: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && <Star />}
      </label>
      {children}
    </div>
  );
}

function Select({ id, value, onChange, options, required }: { id: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <div className="relative">
      <select id={id} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} appearance-none pr-9 ${value ? '' : 'text-white/45'}`}>
        <option value="" disabled>
          Select
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="text-black">
            {o}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const EMPTY = {
  lastName: '', firstName: '', middleName: '', nickName: '',
  birthDate: '', gender: '', civilStatus: '', licenseNo: '', citizenship: '',
  houseNo: '', street: '', city: '', province: '',
  mobile: '', homePhone: '', email: '', source: '', tin: '',
  attainment: '', course: '', school: '', yearGraduated: '', schoolYears: '',
  website: '', // hidden trap for robots
};
type Fields = typeof EMPTY;

interface HistoryRow { year: string; company: string; position: string; address: string }
const BLANK_ROW: HistoryRow = { year: '', company: '', position: '', address: '' };

interface Upload { status: 'idle' | 'uploading' | 'done' | 'error'; id?: string; name?: string; size?: number; error?: string }
const NO_UPLOAD: Upload = { status: 'idle' };

const fileSize = (n = 0) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

function FileField({ id, label, note, accept, state, onPick, onRemove }: { id: string; label: string; note?: string; accept: string; state: Upload; onPick: (f: File) => void; onRemove: () => void }) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/15 bg-white/[0.03] p-3.5">
      <p className="text-[15px] font-semibold text-white">{label}</p>
      {note && <p className="mt-0.5 text-[13px] leading-snug text-gold-soft">{note}</p>}
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <label htmlFor={id} className="cursor-pointer rounded-full border border-[#d9a94a] px-4 py-1.5 text-[14px] font-semibold text-white transition hover:bg-gold/15 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold-soft">
          {state.status === 'done' ? 'Choose another file' : 'Choose file'}
          <input
            id={id}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onPick(f);
            }}
          />
        </label>
        {state.status === 'uploading' && <span className="text-[14px] text-white/75">Uploading…</span>}
        {state.status === 'done' && (
          <span className="flex min-w-0 items-center gap-2 text-[14px] text-white/90">
            <span aria-hidden="true" className="text-gold">✓</span>
            <span className="min-w-0 truncate">{state.name}</span>
            <span className="shrink-0 text-white/55">{fileSize(state.size)}</span>
            <button type="button" onClick={onRemove} className="shrink-0 text-white/70 underline-offset-2 hover:text-white hover:underline">
              Remove
            </button>
          </span>
        )}
        {state.status === 'idle' && <span className="text-[13px] text-white/50">JPG, PNG, WebP or PDF · up to 4 MB</span>}
      </div>
      {state.status === 'error' && (
        <p role="alert" className="mt-2 text-[14px] text-red-200">
          {state.error}
        </p>
      )}
    </div>
  );
}

const IMAGES = 'image/jpeg,image/png,image/webp';
const IMAGES_AND_PDF = `${IMAGES},application/pdf`;

export function ApplicationPage() {
  const [v, setV] = useState<Fields>(EMPTY);
  const [history, setHistory] = useState<HistoryRow[]>([{ ...BLANK_ROW }]);
  const [uploads, setUploads] = useState<Record<UploadKind, Upload>>({
    transcript: NO_UPLOAD, clearance: NO_UPLOAD, savings: NO_UPLOAD, photo: NO_UPLOAD, signature: NO_UPLOAD,
  });
  const [consents, setConsents] = useState({ privacy: false, background: false, declaration: false });
  const [sigEmpty, setSigEmpty] = useState(true);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const pad = useRef<SignaturePadHandle>(null);
  const errorBox = useRef<HTMLParagraphElement>(null);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => setV((cur) => ({ ...cur, [key]: e.target.value }));
  const setField = (key: keyof Fields) => (value: string) => setV((cur) => ({ ...cur, [key]: value }));

  const today = useMemo(() => {
    const d = new Date();
    return { iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, text: d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) };
  }, []);

  const age = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.birthDate)) return '';
    const [y, m, d] = v.birthDate.split('-').map(Number);
    const now = new Date();
    let a = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a -= 1;
    return a >= 0 && a < 120 ? String(a) : '';
  }, [v.birthDate]);

  const printedName = `${v.firstName} ${v.lastName}`.trim();

  const pick = (kind: UploadKind) => async (file: File) => {
    setUploads((u) => ({ ...u, [kind]: { status: 'uploading', name: file.name } }));
    try {
      const id = await uploadFile(file, kind);
      setUploads((u) => ({ ...u, [kind]: { status: 'done', id, name: file.name, size: file.size } }));
    } catch (err) {
      setUploads((u) => ({ ...u, [kind]: { status: 'error', error: err instanceof Error ? err.message : 'The upload did not go through.' } }));
    }
  };
  const remove = (kind: UploadKind) => () => setUploads((u) => ({ ...u, [kind]: NO_UPLOAD }));

  const fail = (message: string) => {
    setError(message);
    setStatus('idle');
    requestAnimationFrame(() => errorBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (Object.values(uploads).some((u) => u.status === 'uploading')) return fail('Please wait for your uploads to finish.');
    if (!consents.privacy || !consents.background || !consents.declaration) return fail('Please tick the three boxes under Consent and Signature.');
    const drawn = !!pad.current && !pad.current.isEmpty();
    if (!drawn && uploads.signature.status !== 'done') return fail('Please sign the form: draw your signature, or upload a picture of it.');

    setError('');
    setStatus('sending');
    try {
      // A drawn signature is uploaded now; otherwise the signature picture already uploaded is used.
      let signature = uploads.signature.id ?? '';
      if (drawn) {
        const blob = await pad.current!.toBlob();
        if (!blob) throw new Error('Your signature could not be read. Please draw it again.');
        signature = await uploadFile(blob, 'signature', 'signature.png');
      }
      const files: Record<string, string> = { signature };
      for (const k of ['transcript', 'clearance', 'savings', 'photo'] as const) {
        const id = uploads[k].id;
        if (uploads[k].status === 'done' && id) files[k] = id;
      }
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...v, history, files, consents }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '');
      setStatus('sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      fail((err instanceof Error && err.message) || 'Your application could not be sent right now. Please try again in a moment.');
    }
  };

  const updateRow = (i: number, key: keyof HistoryRow) => (e: { target: { value: string } }) =>
    setHistory((rows) => rows.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-10 sm:px-8 lg:pt-[110px]">
      <header className="text-center">
        <p className="text-[12px] font-semibold tracking-[0.44em] text-white/75">CAREERS AT PHIRST HOMES</p>
        <h1 className="mt-2 font-serif text-[clamp(34px,4.4vw,64px)] font-semibold leading-[1.05] text-white">
          Sellers Accreditation <em className="text-[#e7cf9b]">Form</em>
        </h1>
        <p className="mx-auto mt-3 max-w-[40em] text-[clamp(15px,1.2vw,18px)] text-white/85">
          Fill in the form, upload your Tranche 1 documents and sign it right here. Fields marked <span className="text-gold">*</span> are required.
        </p>
      </header>

      {status === 'sent' ? (
        <div role="status" className={`${CARD} mt-10 text-center`}>
          <p className="font-serif text-[clamp(28px,3vw,42px)] font-semibold text-gold-soft">Thank you!</p>
          <p className="mx-auto mt-2 max-w-[28em] text-[18px] text-white/90">Your application has been received. We will contact you about the next steps.</p>
          <a href="/" className="mt-6 inline-flex h-12 items-center rounded-lg bg-[linear-gradient(180deg,#f1dcaa,#e0bf78_55%,#c39a4a)] px-7 text-[17px] font-bold text-[#14100a] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Back to the homepage
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 grid gap-6">
          {/* Fixed team details */}
          <dl className="grid gap-x-8 gap-y-3 rounded-[18px] border border-[#e7cf9b]/45 bg-white/[0.03] px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
            {FIXED.map(([k, val]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-[0.22em] text-white/60">{k.toUpperCase()}</dt>
                <dd className="text-[15px] font-bold leading-snug text-white">{val}</dd>
              </div>
            ))}
          </dl>

          {/* Personal data */}
          <section className={CARD} aria-labelledby="app-personal">
            <h2 id="app-personal" className={HEADING}>Personal Data</h2>
            <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="a-last" label="Last Name" required><input id="a-last" required maxLength={80} autoComplete="family-name" value={v.lastName} onChange={set('lastName')} className={INPUT} /></Field>
              <Field id="a-first" label="First Name" required><input id="a-first" required maxLength={80} autoComplete="given-name" value={v.firstName} onChange={set('firstName')} className={INPUT} /></Field>
              <Field id="a-middle" label="Middle Name" required><input id="a-middle" required maxLength={80} autoComplete="additional-name" value={v.middleName} onChange={set('middleName')} className={INPUT} /></Field>
              <Field id="a-nick" label="Nick Name"><input id="a-nick" maxLength={40} autoComplete="nickname" value={v.nickName} onChange={set('nickName')} className={INPUT} /></Field>

              <Field id="a-birth" label="Date of Birth" required><input id="a-birth" type="date" required max={today.iso} autoComplete="bday" value={v.birthDate} onChange={set('birthDate')} className={INPUT} /></Field>
              <Field id="a-age" label="Age"><input id="a-age" readOnly tabIndex={-1} value={age} placeholder="Filled in from your birth date" className={INPUT} /></Field>
              <Field id="a-gender" label="Gender" required><Select id="a-gender" required value={v.gender} onChange={setField('gender')} options={['Female', 'Male']} /></Field>
              <Field id="a-civil" label="Civil Status" required><Select id="a-civil" required value={v.civilStatus} onChange={setField('civilStatus')} options={['Single', 'Married', 'Widowed', 'Separated']} /></Field>

              <Field id="a-license" label="License / Salesperson No."><input id="a-license" maxLength={40} value={v.licenseNo} onChange={set('licenseNo')} className={INPUT} /></Field>
              <Field id="a-citizen" label="Citizenship" required>
                <input id="a-citizen" required maxLength={60} list="a-citizen-list" value={v.citizenship} onChange={set('citizenship')} className={INPUT} />
                <datalist id="a-citizen-list"><option value="Filipino" /></datalist>
              </Field>
              <Field id="a-tin" label="Tax Identification Number (TIN)" required className="sm:col-span-2"><input id="a-tin" required maxLength={30} inputMode="numeric" value={v.tin} onChange={set('tin')} className={INPUT} /></Field>
            </div>

            <p className="mb-2 mt-5 text-[14px] font-semibold text-white">Home Address<Star /></p>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="a-house" label="House No." required><input id="a-house" required maxLength={60} autoComplete="address-line1" value={v.houseNo} onChange={set('houseNo')} className={INPUT} /></Field>
              <Field id="a-street" label="Street / Village" required><input id="a-street" required maxLength={120} autoComplete="address-line2" value={v.street} onChange={set('street')} className={INPUT} /></Field>
              <Field id="a-city" label="Town / City" required><input id="a-city" required maxLength={80} autoComplete="address-level2" value={v.city} onChange={set('city')} className={INPUT} /></Field>
              <Field id="a-province" label="Province / ZIP" required><input id="a-province" required maxLength={80} autoComplete="address-level1" value={v.province} onChange={set('province')} className={INPUT} /></Field>
            </div>

            <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field id="a-mobile" label="Mobile No." required><input id="a-mobile" type="tel" required maxLength={40} autoComplete="tel" value={v.mobile} onChange={set('mobile')} className={INPUT} /></Field>
              <Field id="a-home" label="Home Phone No."><input id="a-home" type="tel" maxLength={40} value={v.homePhone} onChange={set('homePhone')} className={INPUT} /></Field>
              <Field id="a-email" label="E-mail Address" required className="sm:col-span-2 lg:col-span-1"><input id="a-email" type="email" required maxLength={160} autoComplete="email" value={v.email} onChange={set('email')} className={INPUT} /></Field>
              <Field id="a-source" label="Source of Recruitment" required>
                <input id="a-source" required maxLength={60} list="a-source-list" placeholder="e.g. Facebook" value={v.source} onChange={set('source')} className={INPUT} />
                <datalist id="a-source-list"><option value="Facebook" /><option value="Referral" /><option value="Website" /></datalist>
              </Field>
            </div>
          </section>

          {/* Education */}
          <section className={CARD} aria-labelledby="app-education">
            <h2 id="app-education" className={HEADING}>Educational Background</h2>
            <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="a-attain" label="Highest Educational Attainment" required className="lg:col-span-2">
                <Select id="a-attain" required value={v.attainment} onChange={setField('attainment')} options={['High School Graduate', 'Vocational / Technical', 'Some College', 'College Graduate', 'Post-graduate']} />
              </Field>
              <Field id="a-course" label="Course" required className="lg:col-span-2"><input id="a-course" required maxLength={100} value={v.course} onChange={set('course')} className={INPUT} /></Field>
              <Field id="a-school" label="School" required className="lg:col-span-2"><input id="a-school" required maxLength={120} value={v.school} onChange={set('school')} className={INPUT} /></Field>
              <Field id="a-grad" label="Year Graduated" required><input id="a-grad" required maxLength={20} placeholder="or N/A" value={v.yearGraduated} onChange={set('yearGraduated')} className={INPUT} /></Field>
              <Field id="a-years" label="No. of Years"><input id="a-years" type="number" min={0} max={60} inputMode="numeric" value={v.schoolYears} onChange={set('schoolYears')} className={INPUT} /></Field>
            </div>
          </section>

          {/* Accreditation history */}
          <section className={CARD} aria-labelledby="app-history">
            <h2 id="app-history" className={HEADING}>Real Estate Developer Accreditation History</h2>
            <p className="mt-1 text-[14px] text-white/70">Leave this empty if you have none.</p>
            <div className="mt-4 grid gap-4">
              {history.map((row, i) => (
                <div key={i} className="grid gap-x-4 gap-y-3 rounded-[14px] border border-white/15 bg-white/[0.03] p-3.5 sm:grid-cols-2 lg:grid-cols-[0.5fr_1.2fr_1.2fr_1fr_auto]">
                  <Field id={`h-year-${i}`} label="Year"><input id={`h-year-${i}`} maxLength={10} inputMode="numeric" value={row.year} onChange={updateRow(i, 'year')} className={INPUT} /></Field>
                  <Field id={`h-co-${i}`} label="Company"><input id={`h-co-${i}`} maxLength={100} value={row.company} onChange={updateRow(i, 'company')} className={INPUT} /></Field>
                  <Field id={`h-pos-${i}`} label="Position"><input id={`h-pos-${i}`} maxLength={100} value={row.position} onChange={updateRow(i, 'position')} className={INPUT} /></Field>
                  <Field id={`h-addr-${i}`} label="Address"><input id={`h-addr-${i}`} maxLength={120} value={row.address} onChange={updateRow(i, 'address')} className={INPUT} /></Field>
                  {history.length > 1 && (
                    <button type="button" onClick={() => setHistory((rows) => rows.filter((_, j) => j !== i))} className="self-end pb-2.5 text-[14px] text-white/70 underline-offset-2 hover:text-white hover:underline">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {history.length < 5 && (
              <button type="button" onClick={() => setHistory((rows) => [...rows, { ...BLANK_ROW }])} className="mt-3 rounded-full border border-[#d9a94a] px-4 py-1.5 text-[14px] font-semibold text-white transition hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft">
                + Add another
              </button>
            )}
          </section>

          {/* Tranche 1 uploads */}
          <section className={CARD} aria-labelledby="app-docs">
            <h2 id="app-docs" className={HEADING}>Initial Documentary Requirements</h2>
            <p className="mt-1 text-[14px] text-white/70">Tranche 1. You can upload them now or send them later.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FileField id="u-transcript" label="Transcript of Records (TOR) / Certificate of Grades" note="At least 72 units" accept={IMAGES_AND_PDF} state={uploads.transcript} onPick={pick('transcript')} onRemove={remove('transcript')} />
              <FileField id="u-clearance" label="NBI Clearance / Police Clearance" accept={IMAGES_AND_PDF} state={uploads.clearance} onPick={pick('clearance')} onRemove={remove('clearance')} />
              <FileField id="u-savings" label="CBS Savings Account" note="Open and enroll a CBS Savings Account. The physical slips from the bank are required." accept={IMAGES_AND_PDF} state={uploads.savings} onPick={pick('savings')} onRemove={remove('savings')} />
              <FileField id="u-photo" label="2×2 ID Picture" accept={IMAGES} state={uploads.photo} onPick={pick('photo')} onRemove={remove('photo')} />
            </div>
          </section>

          {/* Consent and signature */}
          <section className={CARD} aria-labelledby="app-sign">
            <h2 id="app-sign" className={HEADING}>Consent and Signature</h2>
            <div className="mt-4 grid gap-3.5">
              {(
                [
                  ['privacy', 'I have read and understood the PHirst Park Homes Sales Career Privacy Statement and I agree to all of its terms.'],
                  ['background', 'I authorize PHIRST PARK HOMES INC. to conduct a background check: employment verification, education verification and derogatory records.'],
                  ['declaration', 'I confirm that all the information in this Sellers Accreditation Form is true and correct. I authorize PHirst to validate its accuracy and completeness, and I acknowledge that I have no employer-employee relationship with PHirst.'],
                ] as const
              ).map(([key, text]) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-white/95">
                  <input type="checkbox" checked={consents[key]} onChange={(e) => setConsents((c) => ({ ...c, [key]: e.target.checked }))} className="mt-1 size-5 shrink-0 accent-[#f2b63c]" />
                  <span>{text}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-x-8 gap-y-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className={LABEL}>Signature<Star /></p>
                <SignaturePad ref={pad} label="Draw your signature in this box" onChange={setSigEmpty} />
                <div className="mt-3">
                  <FileField id="u-signature" label="Or upload a picture of your signature" accept={IMAGES} state={uploads.signature} onPick={pick('signature')} onRemove={remove('signature')} />
                  {!sigEmpty && uploads.signature.status === 'done' && <p className="mt-1.5 text-[13px] text-white/60">The signature you drew is the one that will be used.</p>}
                </div>
              </div>
              <div className="grid content-start gap-4">
                <Field id="a-printed" label="Printed Name"><input id="a-printed" readOnly tabIndex={-1} value={printedName} placeholder="Filled in from your name above" className={INPUT} /></Field>
                <Field id="a-date" label="Date"><input id="a-date" readOnly tabIndex={-1} value={today.text} className={INPUT} /></Field>
              </div>
            </div>
          </section>

          {/* Robots fill this in; people never see it. */}
          <div className="hidden" aria-hidden="true">
            <label>
              Leave this empty
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} />
            </label>
          </div>

          {error && (
            <p ref={errorBox} role="alert" className="rounded-lg border border-red-400/60 bg-red-950/50 px-4 py-3 text-[15px] text-red-100">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex h-14 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#f1dcaa,#e0bf78_55%,#c39a4a)] px-10 text-[19px] font-bold text-[#14100a] shadow-[0_10px_30px_rgba(231,207,155,0.22)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Submit Application'}
            </button>
            <a href="/careers" className="text-[15px] text-white/75 underline-offset-2 hover:text-white hover:underline">
              Back to Careers
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
