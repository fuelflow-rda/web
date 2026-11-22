import { cx } from '@/lib/cx';

export interface Bar {
  /** Axis label under the bar; null shows a dot, as the design marks odd hours. */
  label: string | null;
  /** Full name for the hidden table and the tooltip: "08:00", "Tue 17 Nov". */
  name: string;
  /** null: no bar at all (an hour still to come). */
  value: number | null;
  /** Drawn in champagne: the current hour, still filling. */
  highlight?: boolean;
}

/** 1,284,500 → "1.3M"; 126,000 → "126k". For axis labels only. */
export function compact(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
}

/** A round top for the axis: 112,000 → 120,000, four equal steps. */
export function niceMax(max: number): number {
  if (max <= 0) return 4;
  const step = max / 4;
  const mag = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((m) => m * mag >= step) ?? 10;
  return nice * mag * 4;
}

/**
 * Vertical bars on a quiet axis, from the "Revenue by hour" panel: primary for
 * completed periods, champagne for the one in progress, the peak labelled.
 */
export function BarChart({ bars, summary, format }: { bars: Bar[]; summary: string; format: (n: number) => string }) {
  const values = bars.map((b) => b.value ?? 0);
  const top = niceMax(Math.max(...values, 0));
  const ticks = [4, 3, 2, 1, 0].map((i) => (top / 4) * i);
  const peak = values.indexOf(Math.max(...values));

  return (
    <figure className="m-0">
      <div role="img" aria-label={summary} className="flex h-59 gap-3">
        <div aria-hidden className="flex shrink-0 flex-col justify-between pb-6 font-mono text-11 text-text-muted">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {compact(t)}
            </span>
          ))}
        </div>
        <div aria-hidden className="flex min-w-0 flex-1 gap-1 sm:gap-2">
          {bars.map((b, i) => {
            const pct = b.value === null ? 0 : Math.max((b.value / top) * 100, b.value > 0 ? 1.5 : 0);
            return (
              <div
                key={b.name}
                className="flex min-w-0 flex-1 flex-col gap-2"
                title={b.value === null ? undefined : `${b.name}: ${format(b.value)}`}
              >
                <div className="relative flex flex-1 flex-col justify-end border-b border-border">
                  {i === peak && b.value ? (
                    <span
                      className="absolute inset-x-0 text-center font-mono text-11 font-semibold text-text-secondary"
                      style={{ bottom: `calc(${pct}% + 4px)` }}
                    >
                      {compact(b.value)}
                    </span>
                  ) : null}
                  {b.value !== null ? (
                    <div
                      className={cx('rounded-t-badge', b.highlight ? 'bg-accent' : 'bg-primary')}
                      style={{ height: `${pct}%` }}
                    />
                  ) : null}
                </div>
                <span className="h-3.5 text-center font-mono text-11 leading-none whitespace-nowrap text-text-muted">
                  {b.label ?? '·'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* sr-only on the wrapper: a table sizes to its content and would ignore it. */}
      <div className="sr-only">
        <table>
          <caption>{summary}</caption>
          <tbody>
            {bars
              .filter((b) => b.value !== null)
              .map((b) => (
                <tr key={b.name}>
                  <th scope="row">{b.name}</th>
                  <td>{format(b.value ?? 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
