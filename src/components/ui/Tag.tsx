import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export interface TagProps {
  /** The mark colour, a token: `var(--product-gasoline)`, `var(--pay-momo)`. */
  color: string;
  children: ReactNode;
  className?: string;
}

/**
 * A product or payment marker. The colour sits in the 8px dot only; the label
 * stays in the text colour, so every tag passes contrast whatever its colour.
 */
export function Tag({ color, children, className }: TagProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip border border-border bg-surface px-2 py-1 font-mono text-11 leading-none font-medium tracking-p50 text-text uppercase',
        className,
      )}
    >
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}
