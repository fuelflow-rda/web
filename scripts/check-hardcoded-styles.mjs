#!/usr/bin/env node
/**
 * Fails when feature code paints with a value that is not a design token.
 *
 * Everything the UI uses for colour, type and spacing comes from
 * design-tokens/tokens.json (via CSS custom properties, Tailwind theme
 * utilities, or src/theme/tokens.ts). This flags what bypasses them:
 *
 *   colour    a hex, rgb() or hsl() literal; a Tailwind default palette class
 *             (text-gray-500, bg-white)
 *   type      text-[13px], leading-[..], tracking-[..]; a Tailwind default size
 *             (text-sm, text-2xl); an inline fontSize, lineHeight or letterSpacing number
 *   spacing   p-[7px], gap-[..], m-[..] and the like; an inline padding, margin
 *             or gap number
 *   radius    rounded-[..]; an inline borderRadius number
 *   legacy    a pre-redesign token name (text-ink, border-line), which no longer
 *             resolves and so silently paints nothing
 *
 * Pages built before the redesign still have such values. Their counts are
 * recorded in scripts/hardcoded-styles-baseline.json and may only go down: a
 * file not in the baseline must be clean, and no file may gain a violation.
 *
 * Usage:
 *   node scripts/check-hardcoded-styles.mjs           check
 *   node scripts/check-hardcoded-styles.mjs --update  record lower counts
 *   node scripts/check-hardcoded-styles.mjs --list <file>  show a file's violations
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(root, 'scripts/hardcoded-styles-baseline.json');
const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const LIST = args.includes('--list') ? args[args.indexOf('--list') + 1] : null;

/**
 * Not feature code: the generated token files, src/theme (where the design
 * system maps its values onto antd), and tests.
 */
const SKIP = [/^src\/styles\/tokens\.css$/, /^src\/styles\/theme\.css$/, /^src\/theme\//, /\.test\.tsx?$/];

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const UTIL = 'bg|text|border|ring|fill|stroke|outline|divide|from|to|via|decoration|placeholder|caret|accent|shadow';
const SPACE = 'p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left';

const RULES = [
  { id: 'colour', re: /(?<=['"`(\s:,\[])#[0-9a-fA-F]{3,8}(?![\w-])/g, skipLine: /href=|#region|#endregion/ },
  { id: 'colour', re: /\b(?:rgba?|hsla?)\(/g },
  { id: 'colour', re: new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*(?:${UTIL})-(?:(?:${PALETTE})-\\d{2,3}|white|black)(?![\\w-])`, 'g') },
  { id: 'type', re: /(?<![\w-])(?:[a-z0-9-]+:)*(?:text|leading|tracking)-\[[\d.]+(?:px|rem|em)\]/g },
  { id: 'type', re: /(?<![\w-])(?:[a-z0-9-]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g },
  { id: 'type', re: /\b(?:fontSize|lineHeight|letterSpacing)\s*:\s*['"]?-?[\d.]+(?:px|rem|em)?['"]?(?=\s*[,}])/g },
  { id: 'spacing', re: new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*-?(?:${SPACE})-\\[[\\d.]+(?:px|rem|em)\\]`, 'g') },
  { id: 'spacing', re: /\b(?:padding|margin|gap)(?:Top|Right|Bottom|Left|Inline|Block|X|Y)?\s*:\s*['"]?-?[\d.]+(?:px|rem)?['"]?(?=\s*[,}])/g },
  { id: 'radius', re: /(?<![\w-])(?:[a-z0-9-]+:)*rounded(?:-[trbl]{1,2})?-\[[\d.]+(?:px|rem)\]/g },
  { id: 'radius', re: /\bborderRadius\s*:\s*['"]?[\d.]+(?:px)?['"]?(?=\s*[,}])/g },
  { id: 'legacy', re: new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*(?:${UTIL})-(?:ink|line|warn|surface-sunken|sidebar-ink)(?:-[a-z]+)?(?![\\w-])`, 'g') },
  { id: 'legacy', re: /var\(--(?:ink|line|warn|surface-sunken|sidebar-ink|accent-(?:on|tint|hover|pressed|ring))(?:-[a-z-]+)?\)/g },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function scan(file) {
  const found = [];
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.skipLine && rule.skipLine.test(line)) continue;
      for (const m of line.matchAll(rule.re)) found.push({ rule: rule.id, line: i + 1, text: m[0] });
    }
  });
  return found;
}

const files = walk(join(root, 'src'))
  .map((f) => relative(root, f))
  .filter((f) => /\.(tsx?|css)$/.test(f) && !SKIP.some((re) => re.test(f)))
  .sort();

if (LIST) {
  for (const v of scan(join(root, LIST))) console.log(`${LIST}:${v.line}  ${v.rule.padEnd(8)} ${v.text}`);
  process.exit(0);
}

const current = {};
for (const f of files) {
  const counts = {};
  for (const v of scan(join(root, f))) counts[v.rule] = (counts[v.rule] ?? 0) + 1;
  if (Object.keys(counts).length) current[f] = counts;
}

let baseline = {};
let hasBaseline = true;
try {
  baseline = JSON.parse(readFileSync(BASELINE, 'utf8')).files;
} catch {
  hasBaseline = false;
}

const regressions = [];
const improvements = [];
for (const [file, counts] of Object.entries(current)) {
  for (const [rule, n] of Object.entries(counts)) {
    const allowed = baseline[file]?.[rule] ?? 0;
    if (n > allowed) regressions.push(`${file}: ${rule} ${allowed} -> ${n}`);
    if (n < allowed) improvements.push(file);
  }
}
for (const [file, counts] of Object.entries(baseline)) {
  for (const rule of Object.keys(counts)) if (!current[file]?.[rule]) improvements.push(file);
}

const total = (o) => Object.values(o).reduce((s, c) => s + Object.values(c).reduce((a, b) => a + b, 0), 0);

if (UPDATE) {
  // The first run records the starting point; after that, counts may only fall.
  if (hasBaseline && regressions.length) {
    console.error(`Not updating: new violations.\n  ${regressions.join('\n  ')}`);
    process.exit(1);
  }
  const doc = {
    $description:
      'Hardcoded style values in pages built before the redesign. Counts may only go down; regenerate with `node scripts/check-hardcoded-styles.mjs --update` after removing some.',
    files: current,
  };
  writeFileSync(BASELINE, JSON.stringify(doc, null, 2) + '\n');
  console.log(`baseline: ${total(current)} values in ${Object.keys(current).length} files`);
  process.exit(0);
}

if (regressions.length) {
  console.error('Hardcoded style values (use a design token instead; see design-tokens/tokens.json):');
  for (const r of regressions) console.error(`  ${r}`);
  console.error('List a file\'s values with: node scripts/check-hardcoded-styles.mjs --list <file>');
  process.exit(1);
}
const better = [...new Set(improvements)];
console.log(
  `styles: no new hardcoded values (${total(current)} left in ${Object.keys(current).length} pre-redesign files)` +
    (better.length ? `; ${better.length} file(s) improved, run with --update to record it` : ''),
);
