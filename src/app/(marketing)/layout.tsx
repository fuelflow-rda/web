import type { ReactNode } from 'react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

/**
 * Frame for the public pages: the landing page and the legal documents, in the
 * design's fonts, which the root layout loads from our own origin. It follows
 * the visitor's theme, like the dashboard: the system's, or the one picked with
 * the header's moon and sun button.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <a
        href="#main"
        className="sr-only rounded-control bg-primary px-4 py-2 text-15 font-semibold text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to main content
      </a>
      <MarketingHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
