import type { KpiDelta } from '@/components/ui';
import { formatMeter, pointLabel } from '@/lib/product-types';
import type { StationToday } from './data';
import { clock, reportDay } from './panels';

/** Rwanda keeps UTC+2 all year: a station's day starts at 22:00 UTC the evening before. */
const KIGALI_MS = 2 * 3600_000;
export function kigaliDayStart(at: number): number {
  const local = new Date(at + KIGALI_MS);
  local.setUTCHours(0, 0, 0, 0);
  return local.getTime() - KIGALI_MS;
}
export const ymd = (ms: number) => new Date(ms + KIGALI_MS).toISOString().slice(0, 10);

export function ago(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  return m === 1 ? 'a minute ago' : `${m} minutes ago`;
}

export function delta(change: number | null | undefined, label: string): KpiDelta | undefined {
  if (change === null || change === undefined) return undefined;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  return { text: `${Math.abs(change).toLocaleString('en-US')}% ${label}`, direction, good: change > 0 };
}

/** The review banner: what last night's reconciliation found that nobody has decided on. */
export function reviewBanner(r: StationToday['reconciliation']) {
  if (!r || r.reviewedAt || r.unresolved === 0) return null;
  const open = r.items.filter((i) => !i.resolution);
  const day = reportDay(r.date).split(' ')[0];
  const parts = open.slice(0, 2).map((i) => {
    const label = pointLabel(i.pumpNumber, i.productType);
    if (i.reason === 'readings_missing') return `${label} has no closing meter reading`;
    const d = i.volumeDifference ?? 0;
    return `${label} is ${formatMeter(Math.abs(d), i.unit)} ${d < 0 ? 'short against' : 'over'} recorded sales`;
  });
  const more = open.length > 2 ? `, and ${open.length - 2} more` : '';
  return {
    title: `${open.length} ${open.length === 1 ? 'discrepancy' : 'discrepancies'} from ${day} ${open.length === 1 ? 'needs' : 'need'} review`,
    body: `${parts.join('; ')}${more}.${r.generatedAt ? ` Reconciliation ran at ${clock(r.generatedAt)}.` : ''}`,
    date: r.date,
  };
}

