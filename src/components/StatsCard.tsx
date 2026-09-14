'use client';

import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  /** Extra line under the main value (e.g. fuel-type breakdown). */
  detail?: React.ReactNode;
  /** When set, formats the main value with at most this many fraction digits. */
  maximumFractionDigits?: number;
  icon: React.ReactNode;
  /**
   * Mark colour for the icon chip — pass a token reference such as
   * `var(--chart-1)`. Decorative only; the number carries the meaning. The accent
   * is deliberately not used here, since it belongs to interactive elements.
   */
  color: string;
  /** Chip backing. Neutral by default so no card competes with a button. */
  tint?: string;
  trend?: number;
}

export default function StatsCard({
  title,
  value,
  prefix,
  suffix,
  detail,
  maximumFractionDigits,
  icon,
  color,
  tint = 'var(--surface-muted)',
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-surface rounded-card border border-line-subtle p-5 transition-colors duration-200 hover:border-line">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-control flex items-center justify-center text-lg"
          style={{ backgroundColor: tint, color }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
              trend >= 0 ? 'text-accent bg-accent-tint' : 'text-danger bg-danger-tint'
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpOutlined style={{ fontSize: 10 }} />
            ) : (
              <ArrowDownOutlined style={{ fontSize: 10 }} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">{title}</p>
      <div className="flex items-baseline gap-1.5">
        {prefix && <span className="text-sm font-medium text-ink-muted">{prefix}</span>}
        <span className="text-2xl font-extrabold text-ink tabular-nums">
          {maximumFractionDigits !== undefined
            ? value.toLocaleString(undefined, {
                maximumFractionDigits: maximumFractionDigits,
                minimumFractionDigits: 0,
              })
            : value.toLocaleString()}
        </span>
        {suffix && <span className="text-sm font-medium text-ink-muted">{suffix}</span>}
      </div>
      {detail ? <div className="mt-2">{detail}</div> : null}
    </div>
  );
}
