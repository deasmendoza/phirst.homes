// Background of the calculator section: faint numbers, symbols and the formulas the
// calculator itself uses, drawn as watermarks. Purely decorative.

const GOLD = '#d9c08a';
const GREY = '#aab2c2';

// [text, x, y, size, rotation, opacity, colour, italic]
type Mark = [string, number, number, number, number, number, string, boolean?];

const MARKS: Mark[] = [
  // large digits
  ['7', 96, 250, 150, -12, 0.123, GOLD],
  ['3', 1450, 300, 170, 10, 0.105, GREY],
  ['0', 760, 900, 190, -6, 0.088, GOLD],
  ['5', 1180, 150, 110, 14, 0.105, GOLD],
  ['2', 420, 840, 120, 8, 0.096, GREY],
  ['9', 1500, 780, 130, -10, 0.105, GOLD],
  ['8', 620, 130, 90, -8, 0.088, GREY],
  ['4', 230, 640, 100, 12, 0.088, GREY],
  ['1', 980, 420, 120, 6, 0.079, GREY],
  ['6', 1290, 560, 100, -14, 0.088, GOLD],
  // peso and percent
  ['₱', 300, 150, 130, 8, 0.149, GOLD],
  ['₱', 1340, 900, 150, -8, 0.131, GOLD],
  ['₱', 880, 190, 80, -10, 0.105, GREY],
  ['%', 1080, 760, 140, 10, 0.131, GOLD],
  ['%', 520, 430, 100, -12, 0.105, GREY],
  ['%', 1540, 110, 90, 6, 0.114, GOLD],
  ['₱', 90, 880, 90, -6, 0.105, GREY],
  // operators
  ['×', 700, 560, 90, 0, 0.096, GREY],
  ['÷', 1400, 470, 80, 0, 0.096, GOLD],
  ['+', 150, 430, 80, 0, 0.088, GOLD],
  ['=', 1150, 950, 90, 0, 0.088, GREY],
  ['−', 930, 640, 90, 0, 0.088, GOLD],
  // the calculator's own formulas
  ['MA = P × r ÷ (1 − (1 + r)⁻ⁿ)', 560, 300, 34, -4, 0.175, GOLD, true],
  ['DP = TCP × 20%', 110, 540, 30, 5, 0.158, GREY, true],
  ['Balance = TCP − DP', 1140, 400, 30, -5, 0.158, GOLD, true],
  ['r = 6.25% ÷ 12', 1230, 690, 28, 6, 0.158, GREY, true],
  ['n = 30 × 12', 330, 960, 28, -4, 0.158, GOLD, true],
  ['TCP + VAT 12%', 960, 80, 26, 4, 0.149, GREY, true],
  ['₱ / month', 640, 740, 30, -6, 0.158, GOLD, true],
  ['× 12 months', 1420, 620, 24, -8, 0.14, GREY, true],
  ['80%', 800, 440, 44, 8, 0.123, GOLD],
  ['10%', 60, 720, 40, -8, 0.114, GREY],
  ['15%', 1020, 560, 36, -4, 0.105, GREY],
  ['6.25%', 380, 300, 40, 10, 0.123, GOLD],
  ['360', 1320, 230, 44, -6, 0.105, GREY],
  ['0.00', 480, 640, 40, 4, 0.105, GOLD],
];

const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '+'];

function Keypad({ x, y, size, rotate, opacity }: { x: number; y: number; size: number; rotate: number; opacity: number }) {
  const gap = size * 0.16;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity} stroke={GOLD} fill="none" strokeWidth="1.4">
      {KEYS.map((k, i) => {
        const cx = (i % 4) * (size + gap);
        const cy = Math.floor(i / 4) * (size + gap);
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={size} height={size} rx={size * 0.18} />
            <text x={cx + size / 2} y={cy + size * 0.68} fontSize={size * 0.5} textAnchor="middle" fill={GOLD} stroke="none">
              {k}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function CalculatorBackdrop() {
  return (
    <div className="print-hide pointer-events-none absolute inset-0 -z-10 " aria-hidden="true">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full" fontFamily="Georgia, 'Times New Roman', serif">
        <Keypad x={1090} y={90} size={54} rotate={8} opacity={0.13} />
        <Keypad x={40} y={300} size={44} rotate={-10} opacity={0.1} />
        {MARKS.map(([text, x, y, size, rot, opacity, colour, italic], i) => (
          <text
            key={i}
            x={x}
            y={y}
            fontSize={size}
            fill={colour}
            opacity={opacity}
            fontStyle={italic ? 'italic' : undefined}
            fontWeight={italic ? 400 : 700}
            transform={`rotate(${rot} ${x} ${y})`}
          >
            {text}
          </text>
        ))}
      </svg>
      {/* Soft dark veil: keeps the marks as watermarks and blends into the sections above and below */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(5,7,13,0),rgba(5,7,13,0.4)_85%)]" />
    </div>
  );
}
