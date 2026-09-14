#!/usr/bin/env node
/**
 * Verifies every colour pairing in src/styles/tokens.css against WCAG 2.2.
 *
 * The token table is the design system's only source of colour, so this is the one
 * place that can prove the system is readable. It parses the real file rather than a
 * copy, checks both themes, and exits non-zero on a failure so CI can gate on it.
 *
 * Thresholds:
 *   text              4.5:1  (SC 1.4.3)
 *   graphical object  3.0:1  (SC 1.4.11) — chart marks, focus indicators
 *
 * Disabled pairings are reported but not enforced: SC 1.4.3 exempts inactive controls.
 *
 * Usage: node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(root, 'src/styles/tokens.css');

/** Parses `:root { ... }` and `:root[data-theme='dark'] { ... }` into token maps. */
function parseTokens(css) {
  const themes = { light: {}, dark: {} };
  const blocks = [...css.matchAll(/:root(\[data-theme=['"]dark['"]\])?\s*\{([^}]*)\}/g)];
  for (const [, isDark, body] of blocks) {
    const target = isDark ? themes.dark : themes.light;
    for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      target[name] = value.trim();
    }
  }
  // Dark inherits anything it does not restate, exactly as the cascade does.
  themes.dark = { ...themes.light, ...themes.dark };
  return themes;
}

function toRgb(hex) {
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** WCAG relative luminance. */
function luminance(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a === null || b === null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pairings that must hold. `kind` picks the threshold; `exempt` reports without
 * failing, for cases WCAG explicitly excludes.
 */
const PAIRS = [
  // Body and surfaces
  { fg: 'ink', bg: 'surface', kind: 'text', label: 'body text on a card' },
  { fg: 'ink', bg: 'surface-sunken', kind: 'text', label: 'body text on the page' },
  { fg: 'ink', bg: 'surface-muted', kind: 'text', label: 'body text on a subtle fill' },
  { fg: 'ink-secondary', bg: 'surface', kind: 'text', label: 'secondary text' },
  { fg: 'ink-secondary', bg: 'surface-sunken', kind: 'text', label: 'table header text' },
  { fg: 'ink-muted', bg: 'surface', kind: 'text', label: 'muted text' },
  { fg: 'ink-disabled', bg: 'surface-muted', kind: 'text', exempt: true, label: 'disabled control text' },

  // Accent
  { fg: 'accent-on', bg: 'accent', kind: 'text', label: 'label on a filled primary button' },
  { fg: 'accent-on', bg: 'accent-hover', kind: 'text', label: 'label on primary hover' },
  { fg: 'accent-on', bg: 'accent-pressed', kind: 'text', label: 'label on primary pressed' },
  { fg: 'accent', bg: 'accent-tint', kind: 'text', label: 'label on a tinted button' },
  { fg: 'accent', bg: 'accent-tint-hover', kind: 'text', label: 'label on tinted hover' },
  { fg: 'accent', bg: 'surface', kind: 'text', label: 'text button / link' },
  { fg: 'accent', bg: 'surface-sunken', kind: 'text', label: 'link on the page' },

  // Destructive
  { fg: 'danger-on', bg: 'danger', kind: 'text', label: 'label on a filled destructive button' },
  { fg: 'danger', bg: 'surface', kind: 'text', label: 'destructive-quiet label' },
  { fg: 'danger', bg: 'danger-tint', kind: 'text', label: 'destructive on its tint' },
  { fg: 'warn', bg: 'warn-tint', kind: 'text', label: 'warning on its tint' },

  // Hairlines and focus indicators are graphical objects
  // Hairlines between surfaces are decorative structure, not component boundaries,
  // so SC 1.4.11 does not apply — reported to keep them honest, never enforced.
  { fg: 'line', bg: 'surface', kind: 'graphic', exempt: true, label: 'decorative hairline on a card' },
  { fg: 'line-strong', bg: 'surface', kind: 'graphic', exempt: true, label: 'decorative strong hairline' },
  // A form-control border does identify a component, so this one is enforced.
  { fg: 'line-control', bg: 'surface', kind: 'graphic', label: 'input border' },
  { fg: 'line-control', bg: 'surface-sunken', kind: 'graphic', label: 'input border on the page' },
  { fg: 'accent', bg: 'surface', kind: 'graphic', label: 'focus ring solid edge' },
  { fg: 'danger', bg: 'surface', kind: 'graphic', label: 'destructive focus ring edge' },

  // Product marks, on both the card and the page
  ...['gasoline', 'diesel', 'ev-ac', 'ev-dc-fast', 'ev-dc-ultra'].flatMap((p) => [
    { fg: `product-${p}`, bg: 'surface', kind: 'graphic', label: `${p} mark on a card` },
    { fg: `product-${p}`, bg: 'surface-sunken', kind: 'graphic', label: `${p} mark on the page` },
    { fg: `product-${p}`, bg: `product-${p}-tint`, kind: 'text', label: `${p} chip label` },
  ]),

  // Categorical ramp
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    fg: `chart-${n}`,
    bg: 'surface',
    kind: 'graphic',
    label: `chart series ${n}`,
  })),

  // The sidebar keeps its own dark frame in both themes
  { fg: 'sidebar-ink', bg: 'sidebar-bg', kind: 'text', label: 'sidebar label' },
  { fg: 'sidebar-ink-muted', bg: 'sidebar-bg', kind: 'text', label: 'sidebar muted label' },
  { fg: 'accent-on', bg: 'accent', kind: 'text', label: 'selected sidebar item' },
];

const THRESHOLD = { text: 4.5, graphic: 3.0 };

const themes = parseTokens(readFileSync(cssPath, 'utf8'));
let failures = 0;
let exemptWarnings = 0;

for (const themeName of ['light', 'dark']) {
  const tokens = themes[themeName];
  console.log(`\n  ${themeName.toUpperCase()}`);

  for (const pair of PAIRS) {
    const fg = tokens[pair.fg];
    const bg = tokens[pair.bg];

    if (!fg || !bg) {
      console.log(`  ?  ${pair.label} — missing token (--${pair.fg} or --${pair.bg})`);
      failures++;
      continue;
    }

    const ratio = contrast(fg, bg);
    if (ratio === null) {
      // Non-hex (e.g. rgba) cannot be checked without compositing; skip loudly.
      console.log(`  ~  ${pair.label} — not a plain hex, skipped`);
      continue;
    }

    const need = THRESHOLD[pair.kind];
    const pass = ratio >= need;
    const shown = ratio.toFixed(2).padStart(5);

    if (pass) {
      console.log(`  ok ${shown}:1  ${pair.label}`);
    } else if (pair.exempt) {
      console.log(`  !  ${shown}:1  ${pair.label} (needs ${need}:1 — exempt, reported only)`);
      exemptWarnings++;
    } else {
      console.log(`  FAIL ${shown}:1  ${pair.label} (needs ${need}:1) [--${pair.fg} on --${pair.bg}]`);
      failures++;
    }
  }
}

console.log('');
if (exemptWarnings > 0) {
  console.log(`${exemptWarnings} exempt pairing(s) below threshold — allowed, but keep an eye on them.`);
}
if (failures > 0) {
  console.error(`${failures} contrast failure(s).`);
  process.exit(1);
}
console.log('All enforced contrast pairings pass.');
