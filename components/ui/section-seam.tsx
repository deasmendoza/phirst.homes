/**
 * A barely-there glow placed at the top of a section, so the eye notices the page is moving
 * on to the next part without a visible divider line. The page background stays uniform.
 */
export function SectionSeam() {
  return (
    <div aria-hidden="true" className="print-hide pointer-events-none absolute inset-x-0 top-0 -z-10 h-40">
      {/* soft wash fading downward from the edge */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(242,182,60,0.13),transparent_72%)]" />
      {/* a hairline that fades out at both ends, so it reads as light and not as a rule */}
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(242,182,60,0.4)_30%,rgba(255,215,122,0.55)_50%,rgba(242,182,60,0.4)_70%,transparent)]" />
    </div>
  );
}
