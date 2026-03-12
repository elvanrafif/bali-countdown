import { useMemo } from 'react';
import { motion } from 'framer-motion';

// ─── Projection from island boundary GeoJSON (relation/2130352, OSM) ─────────
// lon: 114.431564–115.711499  lat: -8.850025–-8.061589
// viewBox 0 0 500 360, padding 20 → usable 460×320
// x = 20 + (lon − 114.431564) / 1.279935 * 460
// y = 20 + (−8.061589 − lat) / 0.788436 * 320

// 538-point simplified coastline (Douglas-Peucker ε=0.001°, ~111m)
const BALI_PATH = `
M 262.1,256.1 L 268.6,259.9 L 275.3,266.8 L 282.6,278.8 L 283.9,282.1 L 285.2,288.6
L 282.9,292.2 L 282.5,294.1 L 281.8,294.3 L 281.8,296.2 L 278.9,296.3 L 279.0,299.5
L 281.8,299.5 L 284.4,302.1 L 285.1,304.2 L 285.0,306.7 L 283.9,310.6 L 282.6,312.4
L 282.0,312.7 L 277.8,311.4 L 275.3,311.6 L 271.6,315.4 L 269.8,315.9 L 269.3,315.5
L 268.0,317.3 L 266.9,317.2 L 266.0,321.1 L 264.2,322.6 L 261.4,324.3 L 260.4,324.0
L 258.7,325.3 L 256.1,325.7 L 254.9,328.2 L 254.4,331.6 L 256.2,335.2 L 264.4,338.2
L 267.8,338.5 L 268.7,339.2 L 270.2,338.6 L 276.7,339.4 L 278.2,338.9 L 284.0,340.0
L 291.5,338.2 L 292.7,337.3 L 296.7,336.1 L 298.9,334.4 L 302.5,333.4 L 305.1,327.7
L 304.9,327.0 L 305.2,327.3 L 305.0,326.9 L 307.5,324.3 L 307.8,322.7 L 309.1,321.0
L 310.1,321.5 L 310.6,320.8 L 310.4,320.1 L 309.6,320.5 L 309.2,320.1 L 309.0,319.3
L 309.6,318.6 L 309.0,319.1 L 308.3,318.8 L 307.1,314.8 L 305.9,313.8 L 303.9,300.8
L 302.4,300.7 L 301.9,302.3 L 302.3,303.6 L 301.2,302.5 L 301.9,303.6 L 301.8,305.8
L 302.5,308.1 L 301.1,310.1 L 302.2,313.4 L 303.4,314.5 L 299.2,313.8 L 296.7,312.0
L 294.7,312.4 L 295.3,311.7 L 293.9,309.9 L 294.1,308.6 L 293.1,306.2 L 291.1,304.5
L 290.9,305.5 L 290.0,305.5 L 290.1,304.6 L 289.2,303.1 L 290.7,298.5 L 292.3,298.4
L 290.6,298.2 L 291.2,295.8 L 292.2,295.6 L 293.4,293.9 L 294.7,294.5 L 294.9,293.0
L 296.0,292.9 L 296.0,292.1 L 296.7,291.8 L 297.8,292.5 L 298.2,291.9 L 297.6,291.1
L 298.0,290.9 L 298.1,291.5 L 298.5,290.9 L 300.3,291.8 L 299.9,292.3 L 300.4,292.5
L 300.1,293.8 L 296.7,294.4 L 296.3,296.1 L 297.4,296.8 L 297.9,294.3 L 299.1,294.6
L 298.4,297.8 L 300.4,298.1 L 299.9,297.4 L 300.5,297.3 L 300.8,293.8 L 303.1,291.7
L 301.0,290.5 L 301.1,289.8 L 303.0,290.3 L 304.8,289.4 L 305.7,290.0 L 305.8,288.7
L 305.2,288.9 L 304.9,288.2 L 306.1,287.1 L 307.5,287.3 L 310.0,286.2 L 312.7,284.2
L 313.5,284.7 L 315.2,284.3 L 319.0,281.9 L 320.3,276.5 L 319.3,271.8 L 319.5,269.8
L 318.4,267.1 L 318.9,265.5 L 318.8,266.4 L 318.0,266.4 L 319.2,262.8 L 321.1,260.4
L 328.6,254.2 L 334.3,247.1 L 340.0,244.0 L 340.3,242.7 L 342.6,240.1 L 348.9,236.1
L 349.9,234.9 L 350.5,232.5 L 352.2,230.7 L 355.5,228.8 L 359.5,228.0 L 368.5,229.4
L 370.9,228.6 L 379.8,228.3 L 380.7,227.2 L 385.2,226.6 L 389.4,221.6 L 391.8,219.8
L 398.7,217.9 L 406.8,214.7 L 407.3,214.0 L 407.1,212.9 L 407.8,212.4 L 406.7,212.0
L 407.4,211.8 L 407.0,211.1 L 408.3,210.4 L 408.8,211.8 L 408.7,210.1 L 409.3,209.8
L 406.6,205.4 L 406.9,203.1 L 411.1,199.8 L 415.3,198.2 L 417.7,198.2 L 420.8,200.3
L 422.9,199.8 L 424.9,200.3 L 427.0,201.8 L 432.8,203.9 L 433.1,204.9 L 437.3,201.8
L 442.1,199.3 L 444.3,200.2 L 443.5,198.9 L 444.3,197.0 L 444.8,197.2 L 444.4,195.8
L 445.9,192.8 L 445.9,191.8 L 448.0,189.0 L 451.1,186.6 L 452.2,182.6 L 455.7,180.3
L 459.1,179.3 L 462.8,176.2 L 465.7,175.5 L 467.3,174.3 L 469.6,171.4 L 471.7,170.4
L 472.0,169.2 L 474.1,166.9 L 474.3,165.4 L 475.9,164.5 L 475.8,162.7 L 477.5,161.5
L 479.8,157.4 L 479.2,155.5 L 480.0,154.7 L 479.4,150.5 L 479.6,148.3 L 476.7,144.8
L 475.3,140.6 L 469.6,137.1 L 469.1,135.8 L 464.9,134.1 L 463.0,132.0 L 461.6,132.4
L 460.2,130.9 L 454.9,130.4 L 452.2,127.5 L 450.4,126.6 L 447.2,119.7 L 446.5,116.8
L 442.9,113.5 L 441.5,110.4 L 440.8,110.4 L 439.4,108.3 L 438.1,108.0 L 433.1,98.6
L 432.6,98.7 L 432.7,98.1 L 424.8,88.9 L 407.0,78.1 L 404.3,73.7 L 400.6,72.0
L 398.2,68.8 L 393.5,67.9 L 389.4,64.2 L 387.2,60.9 L 378.2,57.2 L 373.8,56.8
L 369.9,53.3 L 364.2,50.1 L 360.5,49.7 L 358.7,48.3 L 352.9,47.1 L 348.3,43.3
L 346.3,40.4 L 340.3,40.8 L 335.2,38.1 L 330.0,37.5 L 323.6,34.2 L 319.2,30.7
L 311.9,28.8 L 308.5,28.8 L 298.4,25.1 L 290.7,20.0 L 280.7,21.3 L 271.5,26.8
L 267.5,28.2 L 266.0,28.1 L 258.2,35.8 L 252.0,39.6 L 251.1,41.6 L 247.5,44.5
L 245.9,47.5 L 242.4,51.3 L 241.8,53.3 L 234.2,57.8 L 233.4,59.8 L 232.0,61.5
L 227.8,62.3 L 226.3,65.0 L 224.8,66.2 L 222.1,66.7 L 218.1,68.5 L 212.0,69.2
L 201.2,69.4 L 198.8,68.3 L 193.7,69.6 L 190.7,69.1 L 189.3,71.3 L 187.4,71.7
L 185.5,71.2 L 179.7,74.3 L 176.7,74.7 L 170.8,74.0 L 167.3,72.3 L 166.6,72.6
L 166.6,73.5 L 165.3,73.7 L 163.8,72.2 L 164.2,71.2 L 164.9,71.1 L 163.9,71.0
L 162.4,72.8 L 160.9,73.0 L 159.4,72.0 L 158.5,70.2 L 155.8,70.5 L 153.6,68.8
L 145.1,65.7 L 140.7,65.3 L 135.9,63.5 L 134.1,63.6 L 129.1,60.2 L 122.2,58.3
L 121.7,57.6 L 122.2,56.0 L 121.1,57.8 L 119.9,58.0 L 113.9,53.5 L 109.7,53.5
L 108.9,54.5 L 106.9,54.9 L 104.2,54.1 L 102.9,52.8 L 102.2,53.6 L 101.2,53.5
L 100.2,53.0 L 96.8,48.1 L 96.2,48.4 L 96.3,50.1 L 94.5,51.0 L 92.5,48.1
L 91.2,47.1 L 87.6,46.4 L 87.0,44.9 L 85.9,46.6 L 84.9,46.8 L 85.2,48.1
L 85.8,48.3 L 82.3,49.5 L 82.4,50.7 L 82.0,51.1 L 80.7,51.3 L 80.2,50.2
L 78.6,51.7 L 75.8,47.6 L 77.5,47.9 L 78.1,47.4 L 78.6,45.2 L 77.2,43.9
L 75.3,44.1 L 75.1,43.6 L 73.4,44.2 L 68.6,46.8 L 66.7,48.6 L 66.6,50.3
L 68.7,50.4 L 69.9,51.4 L 69.0,51.7 L 69.2,52.3 L 68.5,51.9 L 67.1,53.2
L 66.7,51.9 L 65.4,50.9 L 65.7,49.1 L 64.4,48.2 L 62.4,49.3 L 60.8,51.4
L 59.3,51.8 L 55.6,56.8 L 52.9,57.8 L 51.2,56.8 L 50.6,55.6 L 51.6,54.1
L 50.5,53.8 L 52.9,51.2 L 52.7,49.3 L 48.4,41.9 L 46.6,40.3 L 45.3,37.5
L 42.5,34.1 L 40.1,33.0 L 37.7,34.1 L 27.1,32.6 L 23.5,33.0 L 21.5,34.5
L 20.7,42.7 L 20.2,43.3 L 23.8,48.2 L 24.9,51.4 L 25.2,54.2 L 24.6,55.3
L 24.6,58.8 L 27.2,60.4 L 29.8,59.9 L 30.1,61.3 L 31.2,61.0 L 32.4,62.2
L 34.0,62.3 L 33.1,62.5 L 33.2,63.8 L 32.5,62.7 L 30.2,64.9 L 29.6,64.7
L 30.1,63.8 L 29.8,62.6 L 26.3,69.2 L 23.4,71.0 L 23.1,70.6 L 23.8,69.9
L 23.8,68.8 L 23.1,68.8 L 22.0,65.9 L 22.6,66.7 L 22.4,65.6 L 24.5,66.6
L 24.9,64.4 L 24.5,63.8 L 23.8,64.8 L 24.4,63.9 L 24.0,63.4 L 23.7,64.3
L 22.8,63.8 L 23.8,63.0 L 22.4,61.6 L 22.6,60.2 L 20.6,62.2 L 20.0,64.8
L 20.5,67.5 L 22.6,70.2 L 26.0,83.9 L 28.0,87.0 L 28.3,88.5 L 33.4,94.7
L 35.1,99.0 L 37.0,101.6 L 38.8,107.1 L 47.0,116.3 L 51.1,119.7 L 52.0,122.2
L 51.1,126.6 L 51.4,128.3 L 52.8,130.3 L 53.8,130.2 L 52.9,130.6 L 52.1,129.8
L 52.3,130.2 L 60.9,136.3 L 61.4,139.2 L 63.2,140.5 L 65.8,144.4 L 68.1,145.9
L 71.0,149.8 L 69.3,151.8 L 70.8,150.1 L 71.8,152.6 L 70.6,152.8 L 69.9,152.1
L 68.9,152.7 L 71.6,153.7 L 74.0,156.5 L 75.9,157.6 L 79.4,158.7 L 82.4,157.2
L 86.0,156.3 L 86.6,156.8 L 84.3,157.9 L 82.1,158.1 L 82.5,158.7 L 88.4,160.3
L 92.8,160.4 L 109.2,156.9 L 117.2,156.0 L 128.5,155.9 L 134.8,157.1 L 152.3,162.7
L 153.8,163.7 L 154.4,165.8 L 158.0,167.5 L 158.8,169.8 L 161.3,171.5 L 165.2,171.8
L 171.1,173.5 L 170.4,172.7 L 170.9,172.6 L 172.1,173.4 L 172.1,173.9 L 180.1,177.5
L 182.0,178.1 L 183.0,177.7 L 200.5,188.3 L 203.5,191.3 L 203.9,191.0 L 205.7,194.9
L 207.7,197.0 L 209.9,197.7 L 210.0,198.8 L 210.3,198.3 L 210.4,198.8 L 214.2,200.4
L 215.8,203.3 L 217.0,203.9 L 217.3,203.5 L 218.3,204.9 L 219.9,205.5 L 219.6,206.4
L 222.5,209.1 L 223.0,211.6 L 223.8,211.7 L 223.5,213.1 L 224.2,212.9 L 225.8,214.6
L 226.2,214.3 L 228.0,215.4 L 229.3,216.9 L 229.1,217.6 L 229.6,217.2 L 234.9,221.7
L 236.6,221.3 L 237.4,222.4 L 237.8,222.1 L 237.4,222.6 L 236.4,221.9 L 236.1,222.5
L 240.6,226.2 L 242.9,229.1 L 245.3,230.3 L 246.0,232.0 L 250.6,236.9 L 254.4,242.6
L 254.3,244.4 L 255.5,246.0 L 255.2,246.6 L 256.0,248.1 L 258.2,251.1 L 258.9,251.3
L 260.0,253.1 L 260.0,254.8 L 260.6,254.6 L 262.1,256.1 Z
`.trim();

// Itinerary stops — projected from real lat/lon using island boundary projection
// Label offsets (lx, ly) chosen to alternate left/right for close clusters
const STOPS = [
  { id: 'ubud',     label: 'Ubud',       x: 318.6, y: 200.7, lx:  10, ly:   4 }, // right — isolated north
  { id: 'canggu',   label: 'Canggu',     x: 271.0, y: 257.9, lx: -48, ly:  -8 }, // left-above
  { id: 'sanur',    label: 'Sanur',      x: 318.2, y: 274.2, lx:  10, ly:   4 }, // right — far right, no conflict
  { id: 'seminyak', label: 'Seminyak',   x: 280.6, y: 275.4, lx: -55, ly:   4 }, // left
  { id: 'kuta',     label: 'Kuta',       x: 284.9, y: 286.5, lx:  10, ly:   4 }, // right
  { id: 'airport',  label: 'Ngurah Rai', x: 284.1, y: 298.1, lx: -57, ly:  14 }, // left-below — bottommost
];

// Route in trip order (independent of STOPS array order)
const ROUTE_ORDER = ['airport', 'sanur', 'ubud', 'kuta', 'seminyak', 'canggu'];
const ROUTE_D = ROUTE_ORDER.reduce((d, id, i) => {
  const s = STOPS.find(st => st.id === id)!;
  return i === 0 ? `M ${s.x},${s.y}` : `${d} L ${s.x},${s.y}`;
}, '');

// Plane animation follows route order
const ROUTE_STOPS = ROUTE_ORDER.map(id => STOPS.find(s => s.id === id)!);

const PEAKS = [
  { cx: 359.1, cy: 92.0,  rings: [28, 18, 10] }, // Mount Batur
  { cx: 407.0, cy: 134.1, rings: [18, 10] },      // Mount Agung
];

export function HeroMap() {
  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    cx: ((i * 179 + 17) % 480) + 12,
    cy: ((i * 113 + 31) % 320) + 12,
    r:  i % 3 === 0 ? 1.1 : i % 3 === 1 ? 0.65 : 0.35,
    op: 0.12 + (i % 5) * 0.06,
  })), []);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
      <svg
        viewBox="0 0 500 360"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
        aria-label="Bali itinerary map"
      >
        <defs>
          <radialGradient id="island-grad" cx="55%" cy="45%" r="55%">
            <stop offset="0%"   stopColor="#0d2a45" />
            <stop offset="100%" stopColor="#061520" />
          </radialGradient>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-md">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Stars */}
        {stars.map(s => (
          <circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.op} />
        ))}

        {/* Island fill */}
        <motion.path
          d={BALI_PATH}
          fill="url(#island-grad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Topographic contour rings */}
        {PEAKS.map((peak, pi) =>
          peak.rings.map((r, ri) => (
            <motion.circle
              key={`${pi}-${ri}`}
              cx={peak.cx} cy={peak.cy} r={r}
              fill="none" stroke="#0077B6" strokeWidth={0.7}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.09 + ri * 0.05 }}
              transition={{ delay: 2.6 + ri * 0.12, duration: 0.8 }}
            />
          ))
        )}

        {/* Island outline — draws itself in */}
        <motion.path
          d={BALI_PATH}
          fill="none"
          stroke="#0077B6"
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Outer glow */}
        <motion.path
          d={BALI_PATH}
          fill="none"
          stroke="#00B4D8"
          strokeWidth={5}
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.07 }}
          transition={{ delay: 3, duration: 1.2 }}
        />

        {/* Route dashed line */}
        <motion.path
          d={ROUTE_D}
          fill="none"
          stroke="#90E0EF"
          strokeWidth={1.3}
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.65 }}
          transition={{ duration: 2.2, ease: 'easeInOut', delay: 3.2 }}
        />

        {/* Location stops */}
        {STOPS.map((stop, i) => (
          <g key={stop.id}>
            <motion.circle
              cx={stop.x} cy={stop.y}
              fill="none" stroke="#00B4D8" strokeWidth={1}
              initial={{ r: 5, opacity: 0 }}
              animate={{ r: [5, 18], opacity: [0.55, 0] }}
              transition={{ delay: 4.2 + i * 0.35, duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }}
            />
            <motion.circle
              cx={stop.x} cy={stop.y}
              fill={i === 0 ? '#90E0EF' : '#0077B6'}
              filter="url(#glow-sm)"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: 4.5, opacity: 1 }}
              transition={{ delay: 3.6 + i * 0.22, type: 'spring', stiffness: 280, damping: 18 }}
            />
            <motion.text
              x={stop.x + stop.lx}
              y={stop.y + stop.ly}
              fontSize={7.5}
              fill="white"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              letterSpacing="0.04em"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ delay: 3.9 + i * 0.22, duration: 0.5 }}
            >
              {stop.label}
            </motion.text>
          </g>
        ))}

        {/* Animated plane — follows route order */}
        <motion.circle
          r={4.5} fill="white" filter="url(#glow-md)"
          initial={{ cx: ROUTE_STOPS[0].x, cy: ROUTE_STOPS[0].y, opacity: 0 }}
          animate={{
            cx: ROUTE_STOPS.map(s => s.x),
            cy: ROUTE_STOPS.map(s => s.y),
            opacity: [0, 1, 1, 1, 1, 0],
          }}
          transition={{ duration: 14, times: [0, 0.08, 0.3, 0.55, 0.80, 1.0], repeat: Infinity, repeatDelay: 3, delay: 6, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}
