/**
 * Deep links between dashboard views. The dashboard links into Transactions, Pumps and
 * Attendants with the slice it was showing, and those pages read the same keys back
 * with the parsers below, so the two ends cannot drift.
 */

export type PaymentFilter = 'CASH' | 'CARD' | 'MOMO';

export interface TransactionsLink {
  /** Inclusive calendar days, YYYY-MM-DD. */
  from?: string;
  to?: string;
  pump?: string;
  attendant?: string;
  product?: string;
  payment?: PaymentFilter;
  flag?: 'flagged' | 'unflagged';
  /** Weekday in station-local time, 0 = Sunday. Needs from/to. */
  dow?: number;
  /** Hour of day in station-local time, 0-23. Needs from/to. */
  hour?: number;
}

const PAYMENT_FILTERS: PaymentFilter[] = ['CASH', 'CARD', 'MOMO'];

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function transactionsHref(link: TransactionsLink = {}): string {
  return withQuery('/transactions', { ...link, dow: link.dow?.toString(), hour: link.hour?.toString() });
}

/** An integer query value within [min, max], or undefined. */
export function readInt(
  params: { get(key: string): string | null },
  key: string,
  min: number,
  max: number,
): number | undefined {
  const v = params.get(key);
  if (v === null || !/^\d+$/.test(v)) return undefined;
  const n = Number(v);
  return n >= min && n <= max ? n : undefined;
}

export function pumpsHref(pumpId?: string): string {
  return withQuery('/pumps', { pump: pumpId });
}

export function attendantsHref(link: { attendant?: string; from?: string; to?: string } = {}): string {
  return withQuery('/attendants', link);
}

/** Payment methods the transactions filter accepts; anything else gets no link. */
export function isPaymentFilter(method: string): method is PaymentFilter {
  return (PAYMENT_FILTERS as string[]).includes(method);
}

/** A YYYY-MM-DD value, or undefined when absent or malformed. */
export function readDay(params: { get(key: string): string | null }, key: string): string | undefined {
  const v = params.get(key);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}
