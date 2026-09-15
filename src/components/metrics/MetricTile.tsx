'use client';

import React from 'react';
import Link from 'next/link';

interface MetricTileProps {
  /** Where the tile leads; the whole tile becomes the link. */
  href?: string;
  /** Screen-reader text for the link's destination, e.g. "View transactions". */
  linkLabel?: string;
  label: string;
  value: string;
  /** Percentage change vs the previous period. null means no usable baseline. */
  delta?: number | null;
  /** One number per bucket, oldest first. */
  spark?: number[];
  /** Secondary line under the value, e.g. a breakdown. */
  detail?: React.ReactNode;
  /** Colour for the sparkline. Defaults to the muted ink so tiles stay quiet. */
  accent?: string;
  /** A rise is normally good; set false where it is not (e.g. flagged sales). */
  riseIsGood?: boolean;
}

/**
 * Renders the sparkline as a single SVG path on a 0..1 normalised scale.
 *
 * The line is deliberately unlabelled and unaxised — it is there to show shape, not
 * to be read for values. The number above it carries the magnitude.
 */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;

  const w = 100;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    // SVG y grows downward, so invert.
    const y = h - ((p - min) / span) * (h - 2) - 1;
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-7 mt-3 block"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function MetricTile({
  label,
  value,
  delta,
  spark,
  detail,
  accent = 'var(--ink-muted)',
  riseIsGood = true,
  href,
  linkLabel,
}: MetricTileProps) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const rising = hasDelta && delta! > 0;
  const flat = hasDelta && delta === 0;
  const good = rising === riseIsGood;

  const tile = (
    <div
      className={`bg-surface border border-line-subtle rounded-card p-4 flex flex-col justify-between h-full ${
        href ? 'transition-colors group-hover:border-line-strong' : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {label}
          </span>
          {hasDelta && (
            <span
              className="text-[11px] font-semibold tabular-nums shrink-0"
              style={{ color: flat ? 'var(--ink-muted)' : good ? 'var(--accent)' : 'var(--danger)' }}
              title="Compared with the previous period of equal length"
            >
              {rising ? '▲' : flat ? '—' : '▼'} {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
        </div>

        <div className="text-[26px] leading-tight font-bold text-ink tabular-nums mt-1">
          {value}
        </div>

        {detail && <div className="text-xs text-ink-muted mt-1 leading-relaxed">{detail}</div>}
      </div>

      {spark && spark.length > 1 && <Sparkline points={spark} color={accent} />}
      {href && linkLabel && <span className="sr-only">{linkLabel}</span>}
    </div>
  );

  if (!href) return tile;

  return (
    <Link
      href={href}
      className="group block h-full rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {tile}
    </Link>
  );
}
