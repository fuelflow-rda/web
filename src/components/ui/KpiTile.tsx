import type { ReactNode } from 'react';
import Link from 'next/link';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export interface KpiDelta {
  text: string;
  direction: 'up' | 'down' | 'flat';
  /** Whether the change is good news. Up is not always good: think variance. */
  good?: boolean;
}

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  /** Currency before the figure, in Geist: "RWF". */
  prefix?: string;
  /** Unit after the figure, in Geist: "L", "kWh". */
  suffix?: string;
  icon?: LucideIcon;
  delta?: KpiDelta;
  /** Makes the whole tile a link to the detail. */
  href?: string;
  className?: string;
}

/**
 * Leads a dashboard: an overline label, the figure in Geist Mono at 30px with
 * its currency or unit beside it in Geist, and how it moved.
 */
export function KpiTile({ label, value, prefix, suffix, icon: Icon, delta, href, className }: KpiTileProps) {
  const tone = !delta || delta.direction === 'flat' ? 'text-text-muted' : delta.good ? 'text-success' : 'text-danger';
  const Trend = delta?.direction === 'up' ? TrendingUp : delta?.direction === 'down' ? TrendingDown : null;
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="type-overline text-text-muted">{label}</span>
        {Icon ? <Icon size={16} aria-hidden className="text-text-muted" /> : null}
      </div>
      <div className="flex items-baseline gap-1.5">
        {prefix ? <span className="text-14 font-medium text-text-secondary">{prefix}</span> : null}
        <span className="font-mono text-30 leading-none font-medium tracking-n20 text-text">{value}</span>
        {suffix ? <span className="text-14 font-medium text-text-secondary">{suffix}</span> : null}
      </div>
      {delta ? (
        <div className={cx('flex items-center gap-1.5 text-12 font-medium', tone)}>
          {Trend ? <Trend size={14} aria-hidden /> : null}
          <span>{delta.text}</span>
        </div>
      ) : null}
    </>
  );
  const box = cx('flex flex-col gap-3.5 rounded-card border border-border bg-surface p-5', className);
  return href ? (
    <Link href={href} className={cx(box, 'transition-colors hover:border-border-strong', focusRing)}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
