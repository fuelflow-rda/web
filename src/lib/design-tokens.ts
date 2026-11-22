'use client';

import { useThemeStore } from '@/store/theme-store';
import { themedColors, type ThemedColor } from '@/theme/tokens';

/**
 * Design colours for JavaScript consumers.
 *
 * SVG presentation attributes (what Recharts writes) cannot use `var(--x)`, so
 * charts need resolved values. These come from src/theme/tokens.ts, generated
 * from the same design-tokens/tokens.json as the CSS custom properties, so no
 * colour is written twice. Keys are the design token names.
 */
export type DesignTokens = Record<ThemedColor, string>;

/** Colours for the active theme; re-renders when the theme flips. */
export function useDesignTokens(): DesignTokens {
  const mode = useThemeStore((s) => s.mode);
  return themedColors[mode];
}

/** Product marks, in the order they appear in a legend. */
export function productSeriesColors(t: DesignTokens) {
  return {
    GASOLINE: t['product-gasoline'],
    DIESEL: t['product-diesel'],
    EV_AC: t['product-ev-ac'],
    EV_DC_FAST: t['product-ev-dc'],
    EV_DC_ULTRA: t['product-ev-ultra'],
  };
}

/** Categorical series for non-product charts, in the design's fixed order. */
export function categoricalSeries(t: DesignTokens): string[] {
  return [t['chart-1'], t['chart-2'], t['chart-3'], t['chart-4'], t['chart-5'], t['chart-6']];
}
