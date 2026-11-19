import { useEffect, useRef, useState, type FormEvent } from 'react';

// The application form that opens from "Apply Now!" in Careers. It sends the application to the
// website itself (/api/applications); the position and team are added on the server.

const EMPTY = { fullName: '', mobile: '', email: '', location: '', message: '', website: '' /* hidden trap for robots */ };
type Fields = typeof EMPTY;
type Status = 'idle' | 'sending' | 'sent';

const FIELD =
  'h-11 w-full min-w-0 rounded-[10px] border border-[#d9b35f]/75 bg-[#040b1a]/70 px-3 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:border-gold-soft focus:ring-2 focus:ring-gold/35';
const LABEL = 'mb-1 block text-[14px] font-semibold text-white';
const Star = () => (
  <span className="text-gold" aria-hidden="true">
    {' '}
    *
  </span>
);

export function CareersForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState<Fields>(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => setF((cur) => ({ ...cur, [key]: e.target.value }));

  const close = () => {
    onClose();
    // Start fresh next time, once the thank-you has been seen.
    if (status === 'sent') {
      setStatus('idle');
      setF(EMPTY);
    }
    setError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '');
      setStatus('sent');
      setF(EMPTY);
    } catch (err) {
      setStatus('idle');
      setError((err instanceof Error && err.message) || 'Your application could not be sent right now. Please e-mail careers@phirst.homes instead.');
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="careers-form-title"
      onClose={close}
      onClick={(e) => {
        // A click on the dimmed area around the card closes it.
        if (e.target === dialog.current) close();
      }}
      className="m-auto w-[min(94vw,560px)] max-h-[94dvh] overflow-y-auto rounded-[22px] border-2 border-[#d9a94a] bg-[linear-gradient(180deg,#0b1428,#05080f)] p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.7)] backdrop:bg-black/75"
    >
      <div className="px-5 py-6 sm:px-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#d9a94a]/70 pb-3">
          <div>
            <h3 id="careers-form-title" className="font-serif text-[clamp(26px,3vw,34px)] font-semibold leading-tight text-gold-soft">
              Apply Now
            </h3>
            <p className="mt-1 text-[14px] text-white/80">International Territory Specialist · Team M-BigTime</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close the application form"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[#d9a94a]/70 text-xl leading-none text-white transition hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
          >
            ×
          </button>
        </div>

        {status === 'sent' ? (
          <div role="status" className="grid min-h-[260px] place-items-center py-8 text-center">
            <div>
              <p className="font-serif text-[clamp(26px,3vw,36px)] font-semibold text-gold-soft">Thank you!</p>
              <p className="mx-auto mt-2 max-w-[24em] text-[17px] text-white/90">Your application has been received. We will contact you about the next steps.</p>
              <button type="button" onClick={close} className="mt-6 rounded-full border border-[#d9a94a] px-6 py-2 text-[15px] font-semibold text-white transition hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 grid gap-3.5">
            <div>
              <label htmlFor="ca-name" className={LABEL}>
                Full Name
                <Star />
              </label>
              <input id="ca-name" type="text" required maxLength={120} autoComplete="name" value={f.fullName} onChange={set('fullName')} className={FIELD} />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="ca-mobile" className={LABEL}>
                  Mobile Number
                  <Star />
                </label>
                <input id="ca-mobile" type="tel" required maxLength={40} autoComplete="tel" value={f.mobile} onChange={set('mobile')} className={FIELD} />
              </div>
              <div>
                <label htmlFor="ca-email" className={LABEL}>
                  E-mail
                  <Star />
                </label>
                <input id="ca-email" type="email" required maxLength={160} autoComplete="email" value={f.email} onChange={set('email')} className={FIELD} />
              </div>
            </div>
            <div>
              <label htmlFor="ca-location" className={LABEL}>
                Location (City / Province)
                <Star />
              </label>
              <input id="ca-location" type="text" required maxLength={160} autoComplete="address-level2" value={f.location} onChange={set('location')} className={FIELD} />
            </div>
            <div>
              <label htmlFor="ca-message" className={LABEL}>
                Message
              </label>
              <textarea id="ca-message" rows={3} maxLength={1000} value={f.message} onChange={set('message')} className={`${FIELD} h-auto py-2.5`} />
            </div>

            {/* Robots fill this in; people never see it. */}
            <div className="hidden" aria-hidden="true">
              <label>
                Leave this empty
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
              </label>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-400/60 bg-red-950/50 px-3 py-2 text-[14px] text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[linear-gradient(180deg,#f1dcaa,#e0bf78_55%,#c39a4a)] px-6 text-[17px] font-bold text-[#14100a] shadow-lg shadow-black/40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
