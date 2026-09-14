import React from 'react';
import { Instrument_Sans, Rethink_Sans } from 'next/font/google';
import '@/styles/marketing.css';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

// Both faces are downloaded at build time and served from our own origin, so no
// request ever reaches Google Fonts. See docs/data-and-tracking-audit.md.
const rethink = Rethink_Sans({ subsets: ['latin'], variable: '--font-rethink', display: 'swap' });
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' });

/**
 * Frame for the public pages: landing page and legal documents. Light-only and
 * styled independently of the portal, which keeps its own layouts and theme.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mk-site ${rethink.variable} ${instrument.variable}`}>
      <a href="#main" className="mk-skip-link">
        Skip to main content
      </a>
      <MarketingHeader />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
