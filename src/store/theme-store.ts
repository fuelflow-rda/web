import { create } from 'zustand';
import { THEME_STORAGE_KEY } from '@/components/ThemeScript';

export type ThemeMode = 'light' | 'dark';

export { THEME_STORAGE_KEY };

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * The theme the document is already showing. ThemeScript sets `data-theme` before
 * first paint, so reading the attribute avoids a second source of truth — and avoids
 * a hydration mismatch, since the store starts from what the DOM actually has.
 */
function currentTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function apply(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mode);
  // Lets the browser paint form controls, scrollbars and the like to match.
  document.documentElement.style.colorScheme = mode;
}

interface ThemeState {
  mode: ThemeMode;
  /** False until the user picks explicitly; until then we keep following the OS. */
  isExplicit: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  /** Adopts the pre-paint value and starts following the OS when no choice was made. */
  initialize: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isExplicit: false,

  setMode: (mode) => {
    apply(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Private mode or blocked storage: the theme still applies for this session.
    }
    set({ mode, isExplicit: true });
  },

  toggle: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),

  initialize: () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      stored = null;
    }

    const isExplicit = stored === 'light' || stored === 'dark';
    const mode = isExplicit ? (stored as ThemeMode) : currentTheme();
    apply(mode);
    set({ mode, isExplicit });

    if (isExplicit || typeof window === 'undefined') return;

    // No explicit choice yet, so track the OS if it changes mid-session.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (get().isExplicit) return;
      const next: ThemeMode = e.matches ? 'dark' : 'light';
      apply(next);
      set({ mode: next });
    };
    media.addEventListener('change', onChange);
  },
}));

export { systemPrefersDark };
