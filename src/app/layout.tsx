import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { fontVariables } from './fonts';
import { Providers } from '@/components/Providers';
import { ThemeScript } from '@/components/ThemeScript';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.siteUrl),
  title: {
    default: BUSINESS.productName,
    template: `%s | ${BUSINESS.productName}`,
  },
  description: 'Relai fuel and EV charging station management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: ThemeScript sets data-theme and color-scheme on <html>
    // before React hydrates, so the server markup differs here by design.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      {/* Font and background come from tokens (globals.css), so they follow the theme. */}
      <body className="min-h-screen w-full m-0 p-0 overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
