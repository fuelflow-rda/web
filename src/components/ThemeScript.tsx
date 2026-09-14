import React from 'react';

/** Single source of truth for the key — theme-store.ts imports it from here. */
export const THEME_STORAGE_KEY = 'relai_theme';

/**
 * Sets `data-theme` on <html> before first paint, so the page never flashes the
 * wrong theme. Runs as a blocking inline script — it must stay dependency-free
 * and small. The stored preference wins; otherwise we follow the OS.
 */
export function ThemeScript() {
  const js = `(function(){try{
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }catch(e){
    document.documentElement.setAttribute('data-theme','light');
  }})();`;

  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
