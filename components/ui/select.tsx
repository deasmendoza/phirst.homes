import { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface Option {
  value: string;
  label: string;
  group?: string;
  /** Small secondary text shown at the right of the option. */
  hint?: string;
  disabled?: boolean;
}

interface Props {
  label: string;
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  /** Replaces the closed field's look (the calculator's dark field is the default). */
  buttonClass?: (state: { open: boolean; selected: boolean }) => string;
}

/** Dropdown styled to the calculator design: dark field, light list, gold highlight. */
export function Select({ label, placeholder, value, options, onChange, disabled, searchable, buttonClass }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    if (searchable) search.current?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active, shown]);

  const pick = (o: Option | undefined) => {
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
    root.current?.querySelector('button')?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      root.current?.querySelector('button')?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(shown.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(shown[active]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  let lastGroup: string | undefined;

  return (
    <div ref={root} className="relative min-w-0" onKeyDown={onKey}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${selected ? selected.label : placeholder}`}
        onClick={() => setOpen((o) => !o)}
        className={
          buttonClass
            ? buttonClass({ open, selected: !!selected })
            : `flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-[#0b1322] px-3.5 text-left text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45 ${
                open ? 'border-gold' : 'border-white/25 hover:border-white/50'
              } ${selected ? 'text-white' : 'text-white/55'}`
        }
      >
        <span className="min-w-0 truncate">{selected ? selected.label : placeholder}</span>
        <svg viewBox="0 0 20 20" className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-lg border border-black/10 bg-[#f7f4ec] text-[#16181d] shadow-2xl shadow-black/60">
          {searchable && (
            <div className="border-b border-black/10 p-2">
              <input
                ref={search}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={`Search ${label.toLowerCase()}…`}
                aria-label={`Search ${label}`}
                className="h-9 w-full rounded-md border border-black/20 bg-white px-3 text-sm outline-none focus:border-[#c98a1a]"
              />
            </div>
          )}
          <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-60 overflow-y-auto pb-1">
            {shown.length === 0 && <li className="px-3.5 py-2 text-sm text-black/55">No match</li>}
            {shown.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              const isSelected = o.value === value;
              return (
                <li key={o.value} role="presentation">
                  {header && <div className="sticky top-0 border-y border-black/10 bg-[#ece6d6] px-3.5 py-1.5 text-[12px] font-bold tracking-wide text-black/70">{header}</div>}
                  <div
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={o.disabled || undefined}
                    data-active={i === active}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => pick(o)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2 text-[15px] ${
                      o.disabled ? 'cursor-not-allowed text-black/40' : `cursor-pointer ${i === active ? 'bg-[#f0d48a]' : isSelected ? 'bg-[#f0d48a]/45' : ''}`
                    } ${isSelected ? 'font-semibold' : ''}`}
                  >
                    <span>{o.label}{o.hint && <span className="ml-2 text-[12px] font-normal text-black/50">{o.hint}</span>}</span>
                    {isSelected && (
                      <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
