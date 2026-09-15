'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Empty, Segmented, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatNumber, formatRWF } from '@/lib/format';

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
  /** Where an hour with sales leads. `dow` is null for the all-days hour bars. */
  hrefFor?: (dow: number | null, hour: number) => string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Hours are labelled every three columns; a label per column would be unreadable. */
const HOUR_LABEL_EVERY = 3;

/**
 * Lightest fill any hour with sales gets, so a single sale never reads as empty. 0.45 is
 * the lowest mix that still clears 2:1 against the card in both themes.
 */
const MIN_FILL = 0.45;

/** Day label, 24 hour columns, day total. */
const GRID_COLUMNS = '2.5rem repeat(24, minmax(0, 1fr)) 4.5rem';

type Totals = { transactions: number; revenue: number };

const pad = (n: number) => String(n).padStart(2, '0');
const hourRange = (h: number) => `${pad(h)}:00–${pad((h + 1) % 24)}:00`;
const salesLabel = (n: number) => `${formatNumber(n)} ${n === 1 ? 'sale' : 'sales'}`;

function fill(intensity: number): string {
  return intensity === 0
    ? 'var(--surface-muted)'
    : `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--surface-muted))`;
}

function TipContent({ totals, when }: { totals: Totals; when: string }) {
  return (
    <div className="text-xs leading-snug">
      <div className="font-semibold">
        {totals.transactions > 0
          ? `${salesLabel(totals.transactions)} · ${formatRWF(totals.revenue)}`
          : 'No sales'}
      </div>
      <div className="opacity-80">{when}</div>
    </div>
  );
}

interface TableRow extends HeatCell {
  key: string;
}

/**
 * Weekday x hour grid of trading activity, in station-local time.
 *
 * This is the one view that answers a staffing question directly: the dark bands are
 * when the forecourt is busy. Intensity is scaled against the busiest cell rather than
 * an absolute, because what matters is the shape of the week, not the magnitude.
 *
 * Cells keep a fixed height so a wide screen stretches the columns, not the card; the
 * old square cells grew to ~75px and turned a few sales into a page of empty grid. The
 * summary, day totals and hour bars say the answer outright, and the table view keeps
 * every value reachable without hovering.
 */
export default function ActivityHeatmap({ data, metric = 'transactions', hrefFor }: ActivityHeatmapProps) {
  const [view, setView] = useState<'Chart' | 'Table'>('Chart');

  const stats = useMemo(() => {
    const valueOf = (t: Totals) => (metric === 'revenue' ? t.revenue : t.transactions);
    const grid = new Map<string, HeatCell>();
    const days: Totals[] = DAYS.map(() => ({ transactions: 0, revenue: 0 }));
    const hours: Totals[] = HOURS.map(() => ({ transactions: 0, revenue: 0 }));
    let max = 0;
    let busiest: HeatCell | null = null;

    for (const cell of data) {
      grid.set(`${cell.dow}-${cell.hour}`, cell);
      days[cell.dow].transactions += cell.transactions;
      days[cell.dow].revenue += cell.revenue;
      hours[cell.hour].transactions += cell.transactions;
      hours[cell.hour].revenue += cell.revenue;
      const v = valueOf(cell);
      if (v > max) {
        max = v;
        busiest = cell;
      }
    }

    const argMax = (list: Totals[]) =>
      list.reduce((best, t, i) => (valueOf(t) > valueOf(list[best]) ? i : best), 0);

    return {
      grid,
      days,
      hours,
      max,
      busiest,
      busiestDay: argMax(days),
      busiestHour: argMax(hours),
      hourMax: Math.max(...hours.map(valueOf)),
      valueOf,
    };
  }, [data, metric]);

  const { grid, days, hours, max, busiest, busiestDay, busiestHour, hourMax, valueOf } = stats;

  if (!data.length || max === 0 || !busiest) {
    return (
      <div className="h-56 flex items-center justify-center">
        <Empty description={<span className="text-ink-muted">No activity in this period</span>} />
      </div>
    );
  }

  // Square-root keeps quiet-but-not-empty hours visible; a linear ramp makes everything
  // but the peaks look identically blank.
  const intensityOf = (v: number) => (v > 0 ? MIN_FILL + (1 - MIN_FILL) * Math.sqrt(v / max) : 0);

  const summary = [
    {
      label: 'Busiest hour',
      value: `${DAYS[busiest.dow]} ${hourRange(busiest.hour)}`,
      detail: `${salesLabel(busiest.transactions)} · ${formatRWF(busiest.revenue)}`,
    },
    {
      label: 'Busiest day',
      value: DAYS_LONG[busiestDay],
      detail: `${salesLabel(days[busiestDay].transactions)} · ${formatRWF(days[busiestDay].revenue)}`,
    },
    {
      label: 'Busiest time of day',
      value: hourRange(busiestHour),
      detail: `${salesLabel(hours[busiestHour].transactions)} across all days`,
    },
  ];

  const rows: TableRow[] = data
    .filter((c) => c.transactions > 0)
    .map((c) => ({ ...c, key: `${c.dow}-${c.hour}` }));

  const columns: ColumnsType<TableRow> = [
    {
      title: 'When',
      key: 'when',
      // The table is the keyboard route into these links; the grid cells skip Tab.
      render: (_, r) =>
        hrefFor ? (
          <Link href={hrefFor(r.dow, r.hour)} className="text-accent hover:underline">
            {DAYS[r.dow]} {hourRange(r.hour)}
          </Link>
        ) : (
          `${DAYS[r.dow]} ${hourRange(r.hour)}`
        ),
      sorter: (a, b) => a.dow * 24 + a.hour - (b.dow * 24 + b.hour),
    },
    {
      title: 'Sales',
      dataIndex: 'transactions',
      align: 'right',
      render: (v: number) => <span className="tabular-nums">{formatNumber(v)}</span>,
      sorter: (a, b) => a.transactions - b.transactions,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      align: 'right',
      render: (v: number) => <span className="tabular-nums">{formatRWF(v)}</span>,
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  const unit = metric === 'revenue' ? 'RWF' : 'sales';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3 m-0">
          {summary.map((s) => (
            <div key={s.label}>
              <dt className="text-[11px] text-ink-muted">{s.label}</dt>
              <dd className="m-0 text-sm font-semibold text-ink">{s.value}</dd>
              <dd className="m-0 text-xs text-ink-secondary">{s.detail}</dd>
            </div>
          ))}
        </dl>
        <Segmented
          size="small"
          options={['Chart', 'Table']}
          value={view}
          onChange={(v) => setView(v as 'Chart' | 'Table')}
          aria-label="Show activity as chart or table"
        />
      </div>

      {view === 'Table' ? (
        <Table
          columns={columns}
          dataSource={rows}
          size="small"
          pagination={rows.length > 10 ? { pageSize: 10, size: 'small' } : false}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <div
              className="min-w-[640px] grid gap-[2px] items-center"
              style={{ gridTemplateColumns: GRID_COLUMNS }}
              role="img"
              aria-label={`Sales by weekday and hour. Busiest hour ${DAYS_LONG[busiest.dow]} ${hourRange(busiest.hour)} with ${salesLabel(busiest.transactions)}. Switch to the table for every value.`}
            >
              {/* Hour ruler */}
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-[10px] text-ink-muted tabular-nums pb-1">
                  {h % HOUR_LABEL_EVERY === 0 ? pad(h) : ''}
                </div>
              ))}
              <div className="text-[10px] text-ink-muted text-right pb-1">Total</div>

              {DAYS.map((dayName, dow) => (
                <React.Fragment key={dow}>
                  <div className="text-[11px] font-medium text-ink-muted">{dayName}</div>
                  {HOURS.map((hour) => {
                    const cell = grid.get(`${dow}-${hour}`);
                    const totals = cell ?? { transactions: 0, revenue: 0 };
                    return (
                      <Tooltip
                        key={hour}
                        mouseEnterDelay={0.05}
                        title={<TipContent totals={totals} when={`${DAYS_LONG[dow]} ${hourRange(hour)}`} />}
                      >
                        {hrefFor && totals.transactions > 0 ? (
                          // Out of the Tab order: 168 stops would bury the rest of the page.
                          <Link
                            href={hrefFor(dow, hour)}
                            tabIndex={-1}
                            aria-label={`${DAYS_LONG[dow]} ${hourRange(hour)} transactions`}
                            className="block h-5 rounded-[3px] cursor-pointer hover:outline hover:outline-2 hover:outline-ink"
                            style={{ background: fill(intensityOf(valueOf(totals))) }}
                          />
                        ) : (
                          <div
                            className="h-5 rounded-[3px]"
                            style={{ background: fill(intensityOf(valueOf(totals))) }}
                          />
                        )}
                      </Tooltip>
                    );
                  })}
                  <div
                    className={`text-[11px] text-right tabular-nums ${
                      days[dow].transactions > 0 ? 'text-ink-secondary' : 'text-ink-disabled'
                    }`}
                  >
                    {days[dow].transactions > 0 ? salesLabel(days[dow].transactions) : '–'}
                  </div>
                </React.Fragment>
              ))}

              {/* Hour totals across the week: when to staff, whatever the day. */}
              <div className="text-[11px] font-medium text-ink-muted self-end">All</div>
              {HOURS.map((hour) => {
                const v = valueOf(hours[hour]);
                return (
                  <Tooltip
                    key={hour}
                    mouseEnterDelay={0.05}
                    title={<TipContent totals={hours[hour]} when={`All days ${hourRange(hour)}`} />}
                  >
                    {hrefFor && v > 0 ? (
                      <Link
                        href={hrefFor(null, hour)}
                        tabIndex={-1}
                        aria-label={`All days ${hourRange(hour)} transactions`}
                        className="h-8 flex items-end pt-1 group"
                      >
                        <div
                          className="w-full rounded-t-[3px] group-hover:opacity-80"
                          style={{
                            height: `${Math.max(8, (v / hourMax) * 100)}%`,
                            background: 'var(--accent)',
                          }}
                        />
                      </Link>
                    ) : (
                      <div className="h-8 flex items-end pt-1">
                        <div
                          className="w-full rounded-t-[3px]"
                          style={{
                            height: v > 0 ? `${Math.max(8, (v / hourMax) * 100)}%` : 1,
                            background: v > 0 ? 'var(--accent)' : 'var(--line)',
                          }}
                        />
                      </div>
                    )}
                  </Tooltip>
                );
              })}
              <div />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 pr-1">
            <span className="text-[10px] text-ink-muted">Fewer</span>
            {[0, 1 / 3, 2 / 3, 1].map((step) => (
              <div
                key={step}
                className="w-5 h-2.5 rounded-[3px]"
                style={{ background: fill(MIN_FILL + (1 - MIN_FILL) * step) }}
              />
            ))}
            <span className="text-[10px] text-ink-muted">More</span>
            <span className="text-[10px] text-ink-muted tabular-nums">
              · 1–{formatNumber(max)} {unit} per hour
            </span>
          </div>
        </>
      )}
    </div>
  );
}
