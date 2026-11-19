import { useEffect, useRef, useState, type FormEvent } from 'react';
import { login } from '@/components/admin/api';

// The staff sign-in box. It pops up when the PHirst logo in the hero is clicked (and is also the
// sign-in form on /admin itself). A wrong password never says which half was wrong.

const INPUT =
  'h-11 w-full rounded-[10px] border border-[#d9b35f]/75 bg-[#040b1a]/80 px-3 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-gold-soft focus:ring-2 focus:ring-gold/35';

export function SignInForm({ onDone }: { onDone: () => void }) {
  const [user, setUser] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(user, pw);
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setPw('');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <label htmlFor="adm-user" className="mb-1 block text-[14px] font-semibold text-white">Username</label>
        <input id="adm-user" className={INPUT} value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" autoCapitalize="off" spellCheck={false} required />
      </div>
      <div>
        <label htmlFor="adm-pass" className="mb-1 block text-[14px] font-semibold text-white">Password</label>
        <input id="adm-pass" type="password" className={INPUT} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
      </div>
      {error && <p role="alert" className="text-[14px] font-semibold text-[#ff9c8f]">{error}</p>}
      <button disabled={busy} className="h-12 rounded-full bg-[linear-gradient(100deg,#c2933a,#ecca7c_42%,#e3bb63_62%,#c79a3f)] text-[15px] font-bold text-[#171c3a] disabled:opacity-60">
        {busy ? 'One moment…' : 'Sign in'}
      </button>
    </form>
  );
}

export function SignInDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(92vw,420px)] rounded-[22px] border border-[#d9a94a]/70 bg-[linear-gradient(180deg,#0b1730,#050b1a)] p-0 text-white shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop:bg-black/70"
    >
      <div className="p-6 sm:p-8">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-gold">PHirst · Team M BigTime</p>
        <h2 className="mt-1 font-serif text-[28px] font-semibold text-gold-soft">Welcome back</h2>
        <p className="mb-5 mt-1 text-[14px] text-white/70">Team members only. Sign in to see bookings and applications.</p>
        <SignInForm onDone={() => (location.href = '/admin')} />
        <button type="button" onClick={() => ref.current?.close()} className="mt-4 w-full text-center text-[13px] text-white/60 underline">Close</button>
      </div>
    </dialog>
  );
}

/** A see-through button laid over the PHirst logo painted into the hero picture. */
export function HeroLogoSignIn() {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; size: number } | null>(null);
  useEffect(() => {
    // The picture is 1920x1080, shown with object-fit: cover anchored 0% 90% (see scroll-expansion-hero.tsx).
    // The logo circle sits at about (158, 905) with a radius of 120 in picture pixels.
    const place = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const s = Math.max(w / 1920, h / 1080);
      const top = (h - 1080 * s) * 0.9;
      setBox({ left: (158 - 120) * s, top: (905 - 120) * s + top, size: 240 * s });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);
  return (
    <>
      {box && (
        <button
          type="button"
          aria-label="Staff sign-in"
          onClick={() => setOpen(true)}
          style={{ left: box.left, top: box.top, width: box.size, height: box.size }}
          className="absolute z-30 cursor-pointer rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-gold-soft"
        />
      )}
      {open && <SignInDialog onClose={() => setOpen(false)} />}
    </>
  );
}
