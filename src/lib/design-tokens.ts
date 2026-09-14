'use client';

import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme-store';

/**
 * Bridges the CSS tokens into JavaScript.
 *
 * SVG presentation attributes (what Recharts writes) and Ant Design's theme
 * algorithm both need resolved colours — neither can consume `var(--x)`. So we
 * read the computed value off <html> instead of duplicating the hexes here,
 * keeping src/styles/tokens.css the only place a literal colour exists.
 */
const TOKENS = [
  'accent',
  'accent-hover',
  'accent-pressed',
  'accent-tint',
  'accent-on',
  'danger',
  'danger-tint',
  'danger-border',
  'danger-on',
  'warn',
  'warn-tint',
  'warn-border',
  'ink',
  'ink-secondary',
  'ink-muted',
  'ink-disabled',
  'line',
  'line-strong',
  'line-subtle',
  'surface',
  'surface-sunken',
  'surface-muted',
  'product-gasoline',
  'product-diesel',
  'product-ev-ac',
  'product-ev-dc-fast',
  'product-ev-dc-ultra',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
] as const;

export type TokenName = (typeof TOKENS)[number];
export type DesignTokens = Record<TokenName, string>;

/**
 * Server-render fallback. Values are irrelevant to the painted result — the CSS
 * tokens own that — but charts need *something* before hydration, and these keep
 * the first frame neutral rather than Ant Design's default blue.
 */
const FALLBACK = '#5A6165';

export function readDesignTokens(): DesignTokens {
  const out = {} as DesignTokens;
  if (typeof document === 'undefined') {
    for (const name of TOKENS) out[name] = FALLBACK;
    return out;
  }
  const style = getComputedStyle(document.documentElement);
  for (const name of TOKENS) {
    out[name] = style.getPropertyValue(`--${name}`).trim() || FALLBACK;
  }
  return out;
}

/**
 * Re-reads whenever the theme flips, so charts recolour with the page.
 *
 * `mode` is the cache key rather than an input: readDesignTokens takes no arguments
 * and reads the DOM, so the linter cannot see the dependency. The store sets
 * `data-theme` before it sets `mode`, so by this render the computed values are new.
 */
export function useDesignTokens(): DesignTokens {
  const mode = useThemeStore((s) => s.mode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readDesignTokens(), [mode]);
}

/** Product marks, in the order they appear in a legend. */
export function productSeriesColors(t: DesignTokens) {
  return {
    GASOLINE: t['product-gasoline'],
    DIESEL: t['product-diesel'],
    EV_AC: t['product-ev-ac'],
    EV_DC_FAST: t['product-ev-dc-fast'],
    EV_DC_ULTRA: t['product-ev-dc-ultra'],
  };
}

/** Categorical ramp for non-product charts, in application order. */
export function categoricalSeries(t: DesignTokens): string[] {
  return [t['chart-1'], t['chart-2'], t['chart-3'], t['chart-4'], t['chart-5'], t['chart-6']];
}
