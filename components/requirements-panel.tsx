import { useId, useState, type ReactNode } from 'react';

// Reservation requirements shown in the calculator's right panel until a computation is made.
// Content supplied by the owner (November 2026).

export type RequirementsTab = 'initial' | 'next';

// Muted gold, matching the rest of the site (not a bright yellow).
const TAB_ACTIVE = 'bg-[linear-gradient(180deg,#f1dcaa,#e0bf78_55%,#c39a4a)] text-[#14100a] border-transparent';

const PATHS: Record<string, ReactNode> = {
  clipboard: <><rect x="5" y="4.5" width="14" height="16.5" rx="2" /><path d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7M8.5 10.5l1.2 1.2 2.3-2.4M8.5 15.5l1.2 1.2 2.3-2.4M14 11h2.5M14 16h2.5" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 12.5h6M9 16h6" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M15.5 14.5h2" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 16c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M14 10h4M14 13.5h4" /></>,
  form: <><path d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9" /><path d="M8 8h4M8 12h5M8 16h3M19.5 3.5l1 1-6.5 6.5-1.5.5.5-1.5 6.5-6.5Z" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9.5 17h5" /></>,
  briefcase: <><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17M11 13v1.5h2V13" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5S14.3 18.1 12 20.5C9.7 18.1 8.5 15.3 8.5 12S9.7 5.9 12 3.5Z" /></>,
  check: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="M14 3v5h5V11M9 9h3M9 13h4" /><circle cx="17" cy="17" r="4" /><path d="m15.3 17 1.2 1.2 2.2-2.4" /></>,
};

function Glyph({ name, className = 'size-6' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

const Gold = ({ children }: { children: ReactNode }) => <strong className="font-bold text-[#e7cf9b]">{children}</strong>;

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-1 space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[#e0bf78]" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="text-[14px] font-bold text-white">{title}</h5>
      <div className="text-white/80">{children}</div>
    </div>
  );
}

const SECTIONS: { icon: string; title: string; summary: string; body: ReactNode }[] = [
  {
    icon: 'id',
    title: 'Five Proofs',
    summary: 'Identification, Civil Status, Billing, Income, and Down Payment.',
    body: (
      <div className="space-y-3">
        <Sub title="A. Proof of Identification">
          <Bullets items={['Required for Principal Buyer, Spouse, and Co-Buyer.', 'Two copies of Primary IDs OR one Primary ID plus two Secondary IDs.', 'Include three specimen signatures.']} />
        </Sub>
        <Sub title="B. Proof of Civil Status">
          <Bullets items={['Single: CENOMAR.', 'Married: Marriage Certificate.', 'Widow/Widower: Death Certificate of Spouse.', 'Legally Separated/Annulled: Certificate of Finality of Court Decision.']} />
        </Sub>
        <Sub title="C. Proof of Billing">
          <Bullets
            items={[
              'Latest three-month Utility Bill or Barangay Certification/Clearance.',
              "Must match the Philippine mailing address in the Buyer's Information Sheet.",
              'Include Sketch Map.',
              "If owned by a third party, provide Authorization Letter or Contract of Lease and owner's valid ID.",
            ]}
          />
        </Sub>
        <Sub title="D. Proof of Income">
          <p className="mt-1">Refer to the detailed income requirements in Section 4.</p>
        </Sub>
        <Sub title="E. Proof of Down Payment">
          <Bullets items={['Post-Dated Checks (PDCs) or Auto-Debit Arrangement (ADA) Enrollment Form.', 'First Down Payment must be paid in cash when using ADA.']} />
        </Sub>
      </div>
    ),
  },
  {
    icon: 'doc',
    title: 'Reservation Forms & CPA',
    summary: "CPA and annexes, Buyer's Guide, and Data Privacy Consent Form.",
    body: (
      <Bullets
        items={[
          'Conditional Purchase Agreement (CPA) and Annexes.',
          "Buyer's Information Sheet.",
          'Computation Sheet.',
          'House Specifications List.',
          "PHirst Buyer's Guide.",
          'Data Privacy Consent Form.',
        ]}
      />
    ),
  },
  {
    icon: 'file',
    title: 'Additional Documents',
    summary: 'BIR Form 1904, Deed of Absolute Sale (DOAS), and SPA (if applicable).',
    body: <Bullets items={['BIR Form 1904.', 'Deed of Absolute Sale (DOAS).', 'Special Power of Attorney (SPA), if applicable.']} />,
  },
  {
    icon: 'briefcase',
    title: 'Proof of Income by Buyer Type',
    summary: 'Requirements for Employed, OFW, Self-Employed, and Professionals.',
    body: (
      <div className="grid gap-3 sm:grid-cols-2">
        <Sub title="Locally Employed">
          <Bullets
            items={[
              'Certificate of Employment with Tenure and Compensation (COEC).',
              "Latest full three months' payslips.",
              'Latest ITR or BIR Form 2316.',
              'Payroll Bank Statement.',
            ]}
          />
        </Sub>
        <Sub title="OFW / Immigrant">
          <Bullets
            items={[
              'Latest valid Job Contract / Crew Contract / COEC.',
              "Latest full three months' payslips.",
              'Proof of Remittance / Bank Statements (latest six months).',
              'Documents must be English-translated.',
            ]}
          />
        </Sub>
        <Sub title="Self-Employed / Business Owner">
          <Bullets
            items={[
              'DTI or SEC Certificate of Business Registration.',
              'Audited Financial Statements with ITR for the last two years.',
              'Bank Statements or Passbook for the last six months.',
            ]}
          />
        </Sub>
        <Sub title="Professionals">
          <Bullets items={['Certified True Copy of ITR.', 'PRC ID.', 'Vouchers / Official Receipts (last six months).', 'Bank Statements (last six months).']} />
        </Sub>
      </div>
    ),
  },
  {
    icon: 'globe',
    title: 'Special Requirements',
    summary: 'For buyers based abroad, dual citizens, and other special requests.',
    body: (
      <Bullets
        items={[
          'Irrevocable SPA for buyers based or working abroad.',
          'Philippine notarization: six copies.',
          'International consularization: five copies.',
          'Hague Apostille countries: five copies.',
          'Dual Citizens / Former Filipinos: Oath of Allegiance / Affidavit of Citizenship.',
          'Special requests, when applicable: RCI, RSA, and RDU with supporting documents.',
        ]}
      />
    ),
  },
];

const INITIAL: { icon: string; title: string; text: string }[] = [
  { icon: 'wallet', title: 'Reservation Fee', text: 'Pay the applicable reservation fee based on your selected project and house model.' },
  { icon: 'id', title: 'Two (2) Valid IDs', text: 'Submit two valid identification documents.' },
  { icon: 'form', title: 'Holding Information', text: 'Complete the required Holding Information form.' },
];

function Initial() {
  return (
    <div className="flex flex-1 flex-col justify-evenly gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8">
        <div className="lg:border-r lg:border-white/15 lg:pr-8">
          <Glyph name="clipboard" className="size-14 text-[#e0bf78]" />
          <h3 className="mt-3 font-serif text-[clamp(24px,2vw,32px)] font-semibold leading-tight text-white">
            Initial Requirements <span className="block text-[#e7cf9b]">for Reservation</span>
          </h3>
          <p className="mt-2 text-[15px] text-white/80">What you need to prepare to hold and reserve your PHirst home.</p>
        </div>
        <ol className="divide-y divide-white/12">
          {INITIAL.map((r, i) => (
            <li key={r.title} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#e0bf78]/45 bg-[#e0bf78]/10 text-[#e7cf9b]">
                <Glyph name={r.icon} />
              </span>
              <div>
                <h4 className="text-[18px] font-bold leading-snug text-white">
                  {i + 1}. {r.title}
                </h4>
                <p className="text-[14px] text-white/80">{r.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 rounded-xl border border-[#e0bf78]/60 bg-[#0a1120]/80 px-5 py-4 sm:grid-cols-[auto_1fr] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex items-center gap-4 sm:border-white/15 lg:border-r lg:pr-6">
          <Glyph name="clock" className="size-11 text-[#e0bf78]" />
          <div>
            <div className="text-[16px] font-bold text-[#e7cf9b]">Holding Stage</div>
            <div className="text-[14px] text-white/80">Secure your chosen unit for</div>
            <div className="text-[28px] font-extrabold leading-tight text-[#e7cf9b]">48 Hours</div>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Glyph name="calendar" className="mt-0.5 size-10 text-[#e0bf78]" />
          <div>
            <div className="text-[16px] font-bold text-[#e7cf9b]">Important Reminder</div>
            <p className="text-[14px] leading-relaxed text-white/85">
              Submit the complete reservation requirements within <Gold>20 calendar days</Gold> after payment of the Reservation Fee to avoid penalties or
              cancellation without further notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Next() {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  return (
    <div className="flex flex-1 flex-col lg:min-h-0">
      {/* On desktop the list scrolls inside the panel, so opening a section never changes the panel's size */}
      <div className="mb-4 space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-color:rgba(224,191,120,0.55)_transparent] lg:[scrollbar-width:thin]">
        {SECTIONS.map((s, i) => {
          const isOpen = open === i;
          return (
            <div key={s.title} className={`rounded-xl border bg-[#0a1120]/80 transition-colors ${isOpen ? 'border-[#e0bf78]/70' : 'border-white/20'}`}>
              <h4>
                <button
                  type="button"
                  id={`${id}-h${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-p${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7cf9b]"
                >
                  <Glyph name={s.icon} className="size-7 text-[#e0bf78]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold leading-snug text-white">
                      {i + 1}. {s.title}
                    </span>
                    <span className="block text-[13px] leading-snug text-white/70">{s.summary}</span>
                  </span>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className={`size-4 shrink-0 text-white/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                    <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </h4>
              {isOpen && (
                <div id={`${id}-p${i}`} role="region" aria-labelledby={`${id}-h${i}`} className="border-t border-white/10 px-4 pb-4 pt-3 text-[14px] leading-relaxed sm:pl-[60px]">
                  {s.body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-start gap-4 rounded-xl border border-[#e0bf78]/60 bg-[#e0bf78]/[0.07] px-5 py-3">
        <Glyph name="calendar" className="mt-0.5 size-8 text-[#e0bf78]" />
        <p className="text-[14px] leading-relaxed text-white/85">
          <span className="font-bold text-[#e7cf9b]">Important Reminder:</span> Submit the complete reservation requirements within <Gold>20 calendar days</Gold>{' '}
          after payment of the Reservation Fee to avoid penalties or cancellation without further notice.
        </p>
      </div>
    </div>
  );
}

export function RequirementsPanel({ tab, onTab }: { tab: RequirementsTab; onTab: (t: RequirementsTab) => void }) {
  const id = useId();
  const tabs: [RequirementsTab, string, string][] = [
    ['initial', 'Initial Requirements', 'clipboard'],
    ['next', 'Next Requirements', 'doc'],
  ];
  // On desktop the panel takes the height of the form beside it and keeps it on both tabs:
  // it is laid over its cell, so its own content never stretches the row.
  return (
    <div className="flex h-full flex-col lg:relative lg:min-h-[460px] lg:flex-1">
    <div className="flex h-full flex-col lg:absolute lg:inset-0">
      <div role="tablist" aria-label="Reservation requirements" className="grid grid-cols-2 gap-2 border-b border-[#e0bf78]/40 pb-3">
        {tabs.map(([key, label, icon]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`${id}-tab-${key}`}
              aria-selected={active}
              aria-controls={`${id}-panel`}
              onClick={() => onTab(key)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const other = key === 'initial' ? 'next' : 'initial';
                  onTab(other);
                  document.getElementById(`${id}-tab-${other}`)?.focus();
                }
              }}
              tabIndex={active ? 0 : -1}
              className={`flex h-12 items-center justify-center gap-2.5 rounded-xl border text-[15px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7cf9b] sm:text-[17px] ${
                active ? TAB_ACTIVE : 'border-white/30 text-white hover:border-[#e0bf78]/70'
              }`}
            >
              <Glyph name={icon} className="size-5" />
              {label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} className="flex flex-1 flex-col pt-5 lg:min-h-0 lg:overflow-y-auto lg:[scrollbar-color:rgba(224,191,120,0.55)_transparent] lg:[scrollbar-width:thin]">
        {tab === 'initial' ? <Initial /> : <Next />}
      </div>
    </div>
    </div>
  );
}
