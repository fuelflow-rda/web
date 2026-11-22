import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** The page's actions, right-aligned: a range switch, an export button. */
  actions?: ReactNode;
  className?: string;
}

/** The title and actions at the top of a page. The title is the page's h1. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-6', className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="m-0 type-h1 text-text">{title}</h1>
        {description ? <p className="m-0 text-14 text-text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
