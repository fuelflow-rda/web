import type { ReactNode } from 'react';
import { BUSINESS } from '@/lib/business';
import { cx } from '@/lib/cx';
import { container, Overline } from './parts';

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Prose of a legal document, from tokens: Geist at reading size, 70 characters
 * to a line, section headings in Geist semibold, tables with hairlines. Not in
 * the design; restyled from the landing page's type and colours.
 */
const prose = cx(
  'max-w-180 text-17 leading-[1.65] text-text-secondary',
  '[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-24 [&_h2]:leading-[1.3] [&_h2]:font-semibold [&_h2]:tracking-n10 [&_h2]:text-text',
  '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-19 [&_h3]:font-semibold [&_h3]:text-text',
  '[&_p]:my-4 [&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6 [&_li]:my-2',
  '[&_strong]:font-semibold [&_strong]:text-text',
  '[&_a]:font-medium [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:rounded-badge [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-14 [&_code]:text-text',
  // A wide table scrolls on its own on a phone; the text around it does not.
  '[&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-15',
  '[&_th]:border-b [&_th]:border-border-strong [&_th]:py-2.5 [&_th]:pr-4 [&_th]:text-left [&_th]:font-mono [&_th]:text-12 [&_th]:font-medium [&_th]:tracking-p80 [&_th]:text-text-muted [&_th]:uppercase',
  '[&_td]:border-b [&_td]:border-border [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top',
);

/** Shared frame for the legal documents: title, effective date, prose body. */
export function LegalPage({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <article className={cx(container, 'py-16 lg:py-24')}>
      <header className="flex max-w-180 flex-col gap-5 border-b border-border pb-10">
        <Overline>Legal</Overline>
        <h1 className="m-0 font-display text-48 leading-[1.05] font-normal tracking-n10 lg:text-56">{title}</h1>
        <p className="m-0 text-14 text-text-muted">
          Last updated {formatDate(BUSINESS.policiesUpdated)}. Operated by {BUSINESS.legalName}.
        </p>
        <p className="m-0 text-18 leading-[1.55] text-text-secondary">{summary}</p>
      </header>
      <div className={prose}>{children}</div>
    </article>
  );
}
