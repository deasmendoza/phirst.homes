import SneakerProductHero, { type SneakerVariant, type SneakerView } from '@/components/ui/sneaker-product-hero';

// TEMPORARY: sneaker placeholder so the layout and motion can be reviewed on the site.
// These are simple drawn shoes (side profile, toe left, transparent), not photos.
// Replace `variants`, `sizes` and the copy with the house models when ready.
function shoe(upper: string, accent: string, stroke: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
<path d="M225 612 C225 640 300 700 430 712 L1250 712 C1320 712 1385 690 1388 640 L1380 600 Z" fill="#f4f4f1" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>
<path d="M240 612 L1378 612" stroke="${stroke}" stroke-width="6" opacity=".5"/>
<path d="M250 606 C245 520 330 482 430 470 L640 440 C700 380 760 330 830 300 L960 268 C1040 250 1125 282 1165 342 C1215 332 1285 362 1332 422 C1372 482 1384 560 1362 606 Z" fill="${upper}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>
<path d="M430 470 C560 520 700 560 860 560 C1010 560 1130 520 1210 420" fill="none" stroke="${accent}" stroke-width="34" stroke-linecap="round" opacity=".9"/>
<path d="M700 410 L790 360 M740 450 L830 396 M790 486 L890 424 M850 508 L950 442" stroke="${stroke}" stroke-width="12" stroke-linecap="round" opacity=".55"/>
<path d="M1165 342 C1180 300 1250 300 1290 340" fill="none" stroke="${stroke}" stroke-width="6" opacity=".6"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const gallery = (side: string): SneakerView[] => [
  { src: side, label: 'Side' },
  { src: side, label: 'Inside', mirror: true },
  { src: side, label: 'Heel', focus: [0.86, 0.42], zoom: 1.7 },
  { src: side, label: 'Laces', focus: [0.47, 0.34], zoom: 1.7 },
];

const ONYX = shoe('#2a2a2e', '#7fd8bd', '#111');
const CLOUD = shoe('#ececec', '#ff9f6e', '#9a9a9a');
const COBALT = shoe('#2f4fd0', '#ffffff', '#16245f');

const variants: SneakerVariant[] = [
  { name: 'Onyx', swatch: '#1d1d1f', tint: '#7fd8bd', src: ONYX, gallery: gallery(ONYX), stock: { '39': 2 } },
  { name: 'Cloud', swatch: '#e4e4e4', tint: '#ff9f6e', src: CLOUD, gallery: gallery(CLOUD) },
  { name: 'Cobalt', swatch: '#2f4fd0', tint: '#5b7cff', src: COBALT, gallery: gallery(COBALT), soldOut: ['36'] },
];

// The component reads these three colours; the site is dark, so they are set for dark here.
const DARK = {
  ['--color-foreground' as string]: '#ffffff',
  ['--color-background' as string]: '#05070d',
  ['--color-muted-foreground' as string]: 'rgba(255,255,255,0.65)',
};

export function HouseModels() {
  return (
    <div id="house-models" className="bg-night">
      <SneakerProductHero variants={variants} defaultVariant={1} style={DARK} />
    </div>
  );
}
