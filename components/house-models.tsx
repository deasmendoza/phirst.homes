import { SectionSeam } from '@/components/ui/section-seam';
import SneakerProductHero, { type SneakerVariant } from '@/components/ui/sneaker-product-hero';
import { HOUSES, feeText, specLines, type House } from '@/lib/house-models';

// The component reads these three colours; the site is dark, so they are set for dark here.
// Brand gold is the tint and the accent for every house.
const GOLD = '#f2b63c';
const THEME = {
  ['--color-foreground' as string]: '#ffffff',
  ['--color-background' as string]: '#05070d',
  ['--color-muted-foreground' as string]: 'rgba(255,255,255,0.7)',
};

function toVariant(h: House): SneakerVariant {
  const base = { name: h.name, swatch: GOLD, tint: GOLD, src: h.images[0], gallery: h.images.map((src, i) => ({ src, label: i === 0 ? 'Front' : `Photo ${i + 1}` })), eyebrow: `Meet ${h.name}` };

  if (h.status === 'soon') {
    return { ...base, title: 'Coming Soon', description: 'Details will be announced soon.', cta: { label: 'Coming Soon' } };
  }
  if (h.status === 'unavailable') {
    return { ...base, title: 'Not Available', description: specLines(h).join('\n'), cta: { label: 'Not Available' } };
  }
  const fee = feeText(h);
  return {
    ...base,
    title: fee ? `Reservation Fee\n${fee}` : 'Reservation Fee\nPlease inquire',
    description: specLines(h).join('\n'),
    cta: { label: 'Book a Viewing', href: `/book-a-viewing?model=${encodeURIComponent(h.name)}` },
  };
}

const variants = HOUSES.map(toVariant);

export function HouseModels() {
  return (
    <div id="house-models" className="relative isolate">
      <SectionSeam />
      <SneakerProductHero
        mode="listing"
        variants={variants}
        defaultVariant={variants.findIndex((v) => v.name === 'Calista')}
        accent={GOLD}
        accentText="#171c3a"
        wordSize={5.5}
        style={THEME}
      />
    </div>
  );
}
