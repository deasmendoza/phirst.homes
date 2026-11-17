// WHICH HERO THE HOMEPAGE SHOWS
//
//   'scroll'   the new Scroll Expansion hero (components/hero-scroll.tsx)
//   'original' the previous hero, exactly as it was (components/hero.tsx, untouched)
//
// To go back to the previous hero: change 'scroll' to 'original' below and push. Nothing else.
// To compare without changing anything, add ?hero=original or ?hero=scroll to the page address,
// e.g. https://deploy-preview-8--phirst.netlify.app/?hero=original
export type HeroVariant = 'scroll' | 'original';

export const HERO_VARIANT: HeroVariant = 'scroll';

export function pickHero(): HeroVariant {
  const asked = new URLSearchParams(location.search).get('hero');
  return asked === 'original' || asked === 'scroll' ? asked : HERO_VARIANT;
}
