import { useId, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export interface PanelProps {
  title: string;
  /** A short line under the title: "Times in Africa/Kigali". */
  meta?: ReactNode;
  /** At most one: a link such as "View all". */
  action?: { label: string; href: string };
  /** A control in the header, such as Export, instead of or beside the link. */
  extra?: ReactNode;
  children: ReactNode;
  /** Set false for a table or chart that runs to the panel's edges. */
  padded?: boolean;
  className?: string;
}

/** Holds a chart, list or table under a title, with one optional action. */
export function Panel({ title, meta, action, extra, children, padded = true, className }: PanelProps) {
  const titleId = `panel-${useId()}`;
  return (
    <section aria-labelledby={titleId} className={cx('min-w-0 overflow-hidden rounded-card border border-border bg-surface', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={titleId} className="m-0 text-15 font-semibold text-text">
            {title}
          </h2>
          {meta ? <p className="m-0 text-12 text-text-muted">{meta}</p> : null}
        </div>
        {extra}
        {action ? (
          <Link href={action.href} className={cx('inline-flex shrink-0 items-center gap-1 rounded-badge text-13 font-medium text-link no-underline hover:underline', focusRing)}>
            {action.label}
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </header>
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  );
}
