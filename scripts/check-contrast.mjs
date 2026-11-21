#!/usr/bin/env node
/**
 * Checks every colour pairing the design uses, in both themes, against WCAG 2.2.
 *
 * Reads design-tokens/tokens.json, the single source of colour for web and
 * mobile, so it proves the system rather than one app's copy of it. Exits
 * non-zero on any failure so CI can gate on it.
 *
 * Thresholds:
 *   text              4.5:1  (SC 1.4.3)
 *   large text        3.0:1  (SC 1.4.3, 24px and up, or 19px bold)
 *   graphical object  3.0:1  (SC 1.4.11): chart marks, focus rings, control borders
 *
 * Usage: node scripts/check-contrast.mjs [--verbose]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'design-tokens/tokens.json'), 'utf8'));
const VERBOSE = process.argv.includes('--verbose');

const TEXT = 4.5;
const LARGE = 3;
const GRAPHIC = 3;

function luminance(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const themed = Object.fromEntries(Object.entries(tokens.color.themed).filter(([k]) => !k.startsWith('$')));
const fixed = Object.fromEntries(Object.entries(tokens.color.fixed).filter(([k]) => !k.startsWith('$')));
const value = (name, mode) => (name in themed ? themed[name][mode] : fixed[name]);

const SURFACES = ['bg', 'surface', 'surface-muted'];
const on = (fgs, bgs, min, why) => fgs.flatMap((fg) => bgs.map((bg) => ({ fg, bg, min, why })));

/** Pairings that appear in the design, themed (checked in light and dark). */
const THEMED_PAIRS = [
  ...on(['text', 'text-secondary', 'text-muted'], SURFACES, TEXT, 'body text'),
  ...on(['on-primary'], ['primary', 'primary-hover'], TEXT, 'primary button label'),
  ...on(['link', 'accent-text'], ['bg', 'surface'], TEXT, 'link and gold text'),
  ...on(['success'], ['success-tint', 'surface'], TEXT, 'status text'),
  ...on(['warning'], ['warning-tint', 'surface'], TEXT, 'status text'),
  ...on(['danger'], ['danger-tint', 'surface'], TEXT, 'status text'),
  ...on(['info'], ['info-tint', 'surface'], TEXT, 'status text'),
  ...on(['text-secondary'], ['success-tint', 'warning-tint', 'danger-tint', 'info-tint'], TEXT, 'banner body'),
  ...on(['focus'], ['bg', 'surface'], GRAPHIC, 'focus ring'),
  ...on(['border-strong'], ['bg', 'surface'], GRAPHIC, 'control boundary'),
  ...on(['primary'], ['surface'], GRAPHIC, 'selected outline'),
  ...on(
    ['product-gasoline', 'product-diesel', 'product-ev-ac', 'product-ev-dc', 'product-ev-ultra', 'pay-cash', 'pay-card', 'pay-momo'],
    ['bg', 'surface'],
    GRAPHIC,
    'product and payment marks',
  ),
  ...on(['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'], ['bg', 'surface'], GRAPHIC, 'chart series'),
  ...on(['chart-seq-9'], ['surface'], GRAPHIC, 'intensity ramp, strongest step'),
];

/** Pairings on the fixed surfaces (the Night sidebar, the Forest band). */
const FIXED_PAIRS = [
  ...on(['sidebar-text', 'sidebar-text-secondary', 'sidebar-text-muted'], ['sidebar-bg', 'sidebar-surface'], TEXT, 'sidebar text'),
  ...on(['sidebar-text'], ['sidebar-selected', 'sidebar-line'], TEXT, 'selected item, count badge'),
  ...on(['sidebar-indicator'], ['sidebar-bg', 'sidebar-selected'], GRAPHIC, 'selection bar'),
  ...on(['inverse-text', 'inverse-text-secondary', 'inverse-text-muted', 'inverse-accent'], ['inverse-bg'], TEXT, 'inverse band text'),
  ...on(['inverse-danger'], ['inverse-bg'], LARGE, 'inverse band figure (large)'),
];

let failures = 0;
let checked = 0;
const report = (mode, { fg, bg, min, why }) => {
  const f = value(fg, mode);
  const b = value(bg, mode);
  if (!f || !b) {
    failures++;
    console.error(`  missing token: ${fg} or ${bg}`);
    return;
  }
  const r = ratio(f, b);
  checked++;
  const ok = r >= min;
  if (!ok) failures++;
  if (!ok || VERBOSE) {
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${mode.padEnd(5)} ${fg.padEnd(24)} on ${bg.padEnd(16)} ${r.toFixed(2).padStart(5)}:1  (needs ${min}, ${why})`);
  }
};
for (const mode of ['light', 'dark']) for (const p of THEMED_PAIRS) report(mode, p);
for (const p of FIXED_PAIRS) report('light', p);

if (failures) {
  console.error(`contrast: ${failures} of ${checked} pairings fail`);
  process.exit(1);
}
console.log(`contrast: all ${checked} pairings pass (light and dark)`);
