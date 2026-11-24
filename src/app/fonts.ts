import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

/**
 * The three design families. Downloaded at build time and served from our own
 * origin: the browser never contacts Google Fonts (see Privacy in the README).
 *
 * Each sets the CSS variable that src/styles/theme.css reads for `font-sans`,
 * `font-mono` and `font-display`, so the names must stay in step with
 * FONT_VARS in scripts/build-tokens.mjs.
 */
export const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

/** Display only: hero titles, empty states, success moments. Not a variable font. */
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const fontVariables = [geist.variable, geistMono.variable, instrumentSerif.variable].join(' ');
