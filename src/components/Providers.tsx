'use client';

import React, { useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { useThemeStore } from '@/store/theme-store';

/**
 * Palette per theme. These mirror src/styles/tokens.css — antd's cssinjs needs real
 * values, it cannot read CSS custom properties. Change a colour in both places.
 */
const palette = {
  light: {
    accent: '#2E5E52',
    accentHover: '#254A41',
    accentPressed: '#1D3B34',
    danger: '#9A3B2E',
    warn: '#9A7B2E',
    ink: '#16191C',
    inkSecondary: '#5A6165',
    inkTertiary: '#8A9094',
    inkDisabled: '#A8AEB2',
    line: '#D8DCDC',
    lineSubtle: '#E8EBEB',
    surface: '#FFFFFF',
    surfaceSunken: '#F7F8F8',
  },
  dark: {
    accent: '#4E9481',
    accentHover: '#5FA894',
    accentPressed: '#3E8A7B',
    danger: '#C4614F',
    warn: '#C9A34E',
    ink: '#F2F4F4',
    inkSecondary: '#B9C0C4',
    inkTertiary: '#8A9094',
    inkDisabled: '#5A6167',
    line: '#2A2F33',
    lineSubtle: '#23282B',
    surface: '#16191C',
    surfaceSunken: '#0E1113',
  },
} as const;

function buildTheme(mode: 'light' | 'dark') {
  const p = palette[mode];
  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: p.accent,
      colorLink: p.accent,
      colorLinkHover: p.accentHover,
      colorError: p.danger,
      colorWarning: p.warn,
      colorSuccess: p.accent,
      colorText: p.ink,
      colorTextSecondary: p.inkSecondary,
      colorTextTertiary: p.inkTertiary,
      colorTextDisabled: p.inkDisabled,
      colorBorder: p.line,
      colorBorderSecondary: p.lineSubtle,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorBgLayout: p.surfaceSunken,
      borderRadius: 8,
      controlHeight: 36,
      fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    },
    components: {
      Button: {
        colorPrimary: p.accent,
        colorPrimaryHover: p.accentHover,
        colorPrimaryActive: p.accentPressed,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        controlHeight: 36,
        borderRadius: 8,
        fontWeight: 600,
      },
      Card: { borderRadiusLG: 14 },
      Table: { borderRadius: 12, headerBg: p.surfaceSunken },
      Select: { borderRadius: 8, controlHeight: 36 },
      Input: { borderRadius: 8, controlHeight: 36 },
      Tag: { borderRadiusSM: 6 },
    },
  };
}

/**
 * Client-side context for the whole app: theme store, antd ConfigProvider and the
 * auth bootstrap. Lives below the root layout so that layout can stay a server
 * component and own the page metadata.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const initialize = useThemeStore((s) => s.initialize);

  // Adopts whatever ThemeScript already painted, then follows the OS if unset.
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ConfigProvider theme={buildTheme(mode)}>
      <AuthBootstrap />
      {children}
    </ConfigProvider>
  );
}
