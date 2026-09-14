import type { Metadata } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ThemeScript } from '@/components/ThemeScript';
import { BUSINESS } from '@/lib/business';

// Downloaded at build time and served from our origin: the browser never
// contacts Google Fonts. See docs/data-and-tracking-audit.md.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      {/* Background comes from the token so it follows the theme. */}
      <body className={`${inter.className} min-h-screen w-full m-0 p-0 overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
