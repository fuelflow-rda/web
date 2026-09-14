'use client';

import React, { useMemo } from 'react';
import { Empty, Tooltip } from 'antd';

export interface HeatCell {
  /** 0 = Sunday, matching Postgres EXTRACT(DOW). */
  dow: number;
  hour: number;
  revenue: number;
  transactions: number;
}

interface ActivityHeatmapProps {
  data: HeatCell[];
  /** What the cell intensity encodes. */
  metric?: 'transactions' | 'revenue';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Hours are labelled every three columns; a label per column would be unreadable. */
const HOUR_LABEL_EVERY = 3;

/**
 * Weekday x hour grid of trading activity, in station-local time.
 *
 * This is the one view that answers a staffing question directly: the dark bands are
 * when the forecourt is busy. Intensity is scaled against the busiest cell rather than
 * an absolute, because what matters is the shape of the week, not the magnitude.
 */
export default function ActivityHeatmap({ data, metric = 'transactions' }: ActivityHeatmapProps) {
  const { grid, max } = useMemo(() => {
    const g = new Map<string, HeatCell>();
    let m = 0;
    for (const cell of data) {
      g.set(`${cell.dow}-${cell.hour}`, cell);
      const v = metric === 'revenue' ? cell.revenue : cell.transactions;
      if (v > m) m = v;
    }
    return { grid: g, max: m };
  }, [data, metric]);

  if (!data.length || max === 0) {
    return (
      <div className="h-56 flex items-center justify-center">
        <Empty description={<span className="text-ink-muted">No activity in this period</span>} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Hour ruler */}
        <div className="flex items-center gap-[3px] pl-10 mb-1">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center">
              {h % HOUR_LABEL_EVERY === 0 && (
                <span className="text-[10px] text-ink-muted tabular-nums">
                  {String(h).padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>

        {DAYS.map((dayName, dow) => (
          <div key={dow} className="flex items-center gap-[3px] mb-[3px]">
            <div className="w-10 shrink-0 text-[11px] font-medium text-ink-muted">{dayName}</div>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = grid.get(`${dow}-${hour}`);
              const value = cell ? (metric === 'revenue' ? cell.revenue : cell.transactions) : 0;
              // Square-root keeps quiet-but-not-empty hours visible; a linear ramp
              // makes everything but the peaks look identically blank.
              const intensity = value > 0 ? Math.sqrt(value / max) : 0;

              return (
                <Tooltip
                  key={hour}
                  title={
                    <span className="text-xs">
                      {dayName} {String(hour).padStart(2, '0')}:00 — {cell?.transactions ?? 0} sales
                    </span>
                  }
                >
                  <div
                    className="flex-1 rounded-[3px] transition-colors"
                    style={{
                      aspectRatio: '1',
                      minWidth: 12,
                      background:
                        intensity === 0
                          ? 'var(--surface-muted)'
                          : `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--surface-muted))`,
                    }}
                  />
                </Tooltip>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 pr-1">
          <span className="text-[10px] text-ink-muted">Quiet</span>
          {[0, 0.25, 0.5, 0.75, 1].map((step) => (
            <div
              key={step}
              className="w-5 h-2.5 rounded-[3px]"
              style={{
                background:
                  step === 0
                    ? 'var(--surface-muted)'
                    : `color-mix(in srgb, var(--accent) ${Math.round(step * 100)}%, var(--surface-muted))`,
              }}
            />
          ))}
          <span className="text-[10px] text-ink-muted">Busy</span>
        </div>
      </div>
    </div>
  );
}
