'use client';

import React, { useEffect } from 'react';
// Must stay on the same version range as antd's own dependency (see package.json),
// so this StyleProvider and antd share one cssinjs context.
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { useThemeStore } from '@/store/theme-store';
import { buildAntdTheme } from '@/theme/antd-theme';

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

  // `layer` wraps Ant Design's runtime styles in `@layer antd`, which globals.css
  // orders below Tailwind's utilities. Tailwind 4 puts utilities in a layer, and
  // unlayered antd styles would otherwise beat every utility set on an antd
  // element or its children.
  return (
    <StyleProvider layer>
      <ConfigProvider theme={buildAntdTheme(mode)}>
        <AuthBootstrap />
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
