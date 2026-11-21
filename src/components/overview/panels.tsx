'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleDashed, Info, TriangleAlert, ArrowRight, type LucideIcon } from 'lucide-react';
import { Button, Panel, StatusChip, Tag, type StatusTone } from '@/components/ui';
import { initialsOf } from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';
import { formatMeter, pointLabel, productCode, productColor, productName, unitForProduct } from '@/lib/product-types';
import type { Dashboard, LivePump, RecentSale, ReconciliationSummary, StationToday } from './data';

export const rwf = (n: number) => `RWF ${Math.round(n).toLocaleString('en-US')}`;
export const num = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** "Friday 20 November", in Kigali. */
export const longDay = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Kigali' }).format(new Date(iso));
/** A report's calendar day, which has no time zone of its own. */
export const reportDay = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
export const clock = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' }).format(new Date(iso));

/** "Aline U." */
const shortName = (name?: string | null) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Unknown';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

/** A panel's body while its data is on the way: quiet bars, not a spinner. */
export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-3.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4.5 animate-pulse rounded-badge bg-surface-muted motion-reduce:animate-none" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p role="alert" className="m-0 text-13 text-text-secondary">
      {message}{' '}
      <button type="button" onClick={onRetry} className="cursor-pointer border-0 bg-transparent p-0 text-13 font-semibold text-link underline">
        Try again
      </button>
    </p>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="m-0 py-6 text-center text-13 text-text-secondary">{children}</p>;

/* ---------------------------------------------------------------- Reconciliation */

export function ReconciliationPanel({ summary, loading }: { summary: ReconciliationSummary | null | undefined; loading: boolean }) {
  const router = useRouter();
  const meta = summary ? `${reportDay(summary.date)}${summary.generatedAt ? ` · ran at ${clock(summary.generatedAt)}` : ''}` : undefined;
  return (
    <Panel title="Reconciliation" meta={meta}>
      {loading && summary === undefined ? (
        <PanelSkeleton />
      ) : !summary ? (
        <Empty>No report yet. The first one runs after the station&apos;s first day of sales.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-44 leading-none font-medium text-text">{summary.toReview}</span>
            <span className="text-14 text-text-secondary">
              {summary.toReview === 1 ? 'item' : 'items'} to review of {summary.checks} {summary.checks === 1 ? 'check' : 'checks'}
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {summary.items.map((item) => {
              const unit = item.unit || unitForProduct(item.productType);
              const missing = item.reason === 'readings_missing';
              return (
                <li key={item.pumpId} className="flex items-center gap-3 border-b border-border py-3">
                  <TriangleAlert size={16} aria-hidden className={cx('shrink-0', missing ? 'text-warning' : 'text-danger')} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-14 font-semibold text-text">
                      {pointLabel(item.pumpNumber, item.productType)} · {productName(item.productType)}
                    </span>
                    <span className="truncate text-12 text-text-muted">
                      {missing
                        ? 'A closing meter reading is missing'
                        : `Metered ${formatMeter(item.meteredQuantity, unit)}, recorded ${formatMeter(item.recordedQuantity, unit)}`}
                      {item.shift?.attendant?.name ? ` · ${item.shift.attendant.name}` : ''}
                    </span>
                  </div>
                  {item.resolution ? (
                    <StatusChip tone={item.resolution.decision === 'explained' ? 'success' : 'warning'}>
                      {item.resolution.decision === 'explained' ? 'Explained' : 'Flagged'}
                    </StatusChip>
                  ) : (
                    <span className={cx('shrink-0 font-mono text-13 font-semibold', missing ? 'text-warning' : 'text-danger')}>
                      {missing ? 'No reading' : `${(item.volumeDifference ?? 0) > 0 ? '+' : '−'}${formatMeter(Math.abs(item.volumeDifference ?? 0), unit)}`}
                    </span>
                  )}
                </li>
              );
            })}
            {summary.matched > 0 ? (
              <li className="flex items-center gap-3 border-b border-border py-3">
                <CircleCheck size={16} aria-hidden className="shrink-0 text-success" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-14 font-semibold text-text">
                    {summary.matched} {summary.matched === 1 ? 'pump or charger' : 'pumps and chargers'}
                  </span>
                  <span className="text-12 text-text-muted">Within {summary.tolerance} L (or kWh) of recorded sales</span>
                </div>
                <span className="shrink-0 font-mono text-13 font-semibold text-success">Matched</span>
              </li>
            ) : null}
          </ul>
          <Button
            icon={ArrowRight}
            onClick={() => router.push(`/reconciliation?date=${summary.date}`)}
            block
          >
            {summary.toReview > 0 && !summary.reviewedAt ? 'Review discrepancies' : 'Open reconciliation'}
          </Button>
        </div>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------------------- Product mix */

export function ProductMixPanel({ mix, loading, error, onRetry, meta }: { mix?: Dashboard['productMix']; loading: boolean; error: string | null; onRetry: () => void; meta: string }) {
  const rows = [...(mix ?? [])].sort((a, b) => b.revenue - a.revenue);
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  return (
    <Panel title="Product mix" meta={meta}>
      {error && !mix ? (
        <PanelError message="The product mix could not be loaded." onRetry={onRetry} />
      ) : loading && !mix ? (
        <PanelSkeleton />
      ) : total === 0 ? (
        <Empty>No sales in this period.</Empty>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-badge">
            {rows.map((r) => (
              <div key={r.productType} style={{ width: `${(r.revenue / total) * 100}%`, background: productColor(r.productType) }} />
            ))}
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {rows.map((r) => (
              <li key={r.productType} className="flex items-center gap-2.5">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: productColor(r.productType) }} />
                <span className="min-w-0 flex-1 truncate text-14 text-text">{productName(r.productType)}</span>
                <span className="shrink-0 font-mono text-13 text-text-secondary">{formatMeter(r.quantity, r.unit)}</span>
                <span className="w-11 shrink-0 text-right font-mono text-13 font-semibold text-text">{pct(r.revenue, total)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------------------- Payments */

const PAY = {
  CASH: { label: 'Cash', color: 'var(--pay-cash)' },
  MOMO: { label: 'MoMo', color: 'var(--pay-momo)' },
  CARD: { label: 'Card', color: 'var(--pay-card)' },
} as const;

export function PaymentsPanel({ payments, sales, loading, error, onRetry }: { payments?: Dashboard['payments']; sales?: number; loading: boolean; error: string | null; onRetry: () => void }) {
  const rows = [...(payments ?? [])].sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <Panel title="Payments" meta={sales !== undefined ? `${num(sales)} ${sales === 1 ? 'sale' : 'sales'}` : undefined}>
      {error && !payments ? (
        <PanelError message="Payments could not be loaded." onRetry={onRetry} />
      ) : loading && !payments ? (
        <PanelSkeleton rows={3} />
      ) : total === 0 ? (
        <Empty>No sales in this period.</Empty>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {rows.map((r) => (
            <li key={r.method} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="min-w-0 flex-1 text-14 text-text">{PAY[r.method].label}</span>
                <span className="font-mono text-13 font-semibold text-text">{rwf(r.amount)}</span>
                <span className="w-10 text-right font-mono text-13 text-text-muted">{pct(r.amount, total)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-muted">
                <div className="h-full rounded-full" style={{ width: `${(r.amount / total) * 100}%`, background: PAY[r.method].color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------------------- Pumps and chargers */

const LIVE: Record<LivePump['status'], { label: string; tone: StatusTone; icon: LucideIcon }> = {
  in_use: { label: 'In use', tone: 'success', icon: CircleCheck },
  idle: { label: 'Idle', tone: 'success', icon: CircleCheck },
  charging: { label: 'Charging', tone: 'info', icon: Info },
  available: { label: 'Available', tone: 'success', icon: CircleCheck },
  offline: { label: 'Offline', tone: 'neutral', icon: CircleDashed },
};

export function PumpsPanel({ pumps, loading, error, onRetry }: { pumps: LivePump[] | null; loading: boolean; error: string | null; onRetry: () => void }) {
  const list = [...(pumps ?? [])].sort((a, b) => Number(a.kind === 'charger') - Number(b.kind === 'charger') || a.pump_number - b.pump_number);
  return (
    <Panel title="Pumps and chargers" meta="Live" action={{ label: 'Manage', href: '/pumps' }}>
      {error && !pumps ? (
        <PanelError message="Pumps could not be loaded." onRetry={onRetry} />
      ) : loading && !pumps ? (
        <PanelSkeleton rows={5} />
      ) : list.length === 0 ? (
        <Empty>No pumps or chargers at this station yet.</Empty>
      ) : (
        <table className="w-full border-collapse">
          <caption className="sr-only">Pumps and chargers now, with what each has dispensed today</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Pump or charger</th>
              <th scope="col">Product</th>
              <th scope="col">Status</th>
              <th scope="col">Today</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => {
              const s = LIVE[p.status];
              const pad = i === 0 ? 'pb-1.75' : i === list.length - 1 ? 'pt-1.75' : 'py-1.75';
              return (
                <tr key={p.id}>
                  <th scope="row" className={cx(pad, 'pr-2.5 text-left text-14 font-semibold whitespace-nowrap text-text')}>
                    {pointLabel(p.pump_number, p.product_type)}
                  </th>
                  <td className={cx(pad, 'pr-2.5')}>
                    <Tag color={productColor(p.product_type)} className="whitespace-nowrap">
                      {productCode(p.product_type)}
                    </Tag>
                  </td>
                  <td className={cx(pad, 'w-full pr-2.5 text-right')}>
                    <StatusChip tone={s.tone} icon={s.icon}>
                      {s.label}
                    </StatusChip>
                  </td>
                  <td className={cx(pad, 'text-right font-mono text-13 whitespace-nowrap text-text-secondary')}>{formatMeter(p.today.quantity, p.unit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------------------- Recent transactions */

const SALE: Record<RecentSale['sale_status'], { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  locked: { label: 'Synced', tone: 'success' },
  voided: { label: 'Voided', tone: 'neutral' },
};

export function RecentSalesPanel({ sales, loading, error, onRetry }: { sales: RecentSale[] | null; loading: boolean; error: string | null; onRetry: () => void }) {
  const head = 'px-3 py-2.5 text-left type-overline text-11 font-medium text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';
  return (
    <Panel title="Recent transactions" meta="Streaming as attendants record sales" action={{ label: 'View all', href: '/transactions' }} padded={false}>
      {error && !sales ? (
        <div className="p-5">
          <PanelError message="Recent sales could not be loaded." onRetry={onRetry} />
        </div>
      ) : loading && !sales ? (
        <div className="p-5">
          <PanelSkeleton rows={6} />
        </div>
      ) : !sales || sales.length === 0 ? (
        <Empty>No sales yet today. They appear here as attendants record them.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-176 border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                {['Time', 'Pump', 'Product', 'Quantity', 'Amount', 'Payment', 'Attendant', 'Status'].map((h) => (
                  <th key={h} scope="col" className={head}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const product = s.product_type ?? s.pumps?.product_type;
                const voided = s.sale_status === 'voided';
                return (
                  <tr key={s.id}>
                    <td className={cx(cell, 'font-mono text-13 text-text-secondary')}>{clock(s.timestamp)}</td>
                    <td className={cx(cell, 'text-14 whitespace-nowrap text-text')}>{s.pumps?.pump_number != null ? pointLabel(s.pumps.pump_number, product) : '—'}</td>
                    <td className={cell}>
                      <Tag color={productColor(product)}>{productCode(product)}</Tag>
                    </td>
                    <td className={cx(cell, 'font-mono text-13 whitespace-nowrap text-text')}>{formatMeter(s.quantity, s.unit)}</td>
                    <td className={cx(cell, 'font-mono text-13 font-semibold', voided ? 'text-text-muted line-through' : 'text-text')}>{num(s.total_amount)}</td>
                    <td className={cx(cell, 'text-14 text-text-secondary')}>{PAY[s.payment_method]?.label ?? s.payment_method}</td>
                    <td className={cx(cell, 'text-14 whitespace-nowrap text-text')}>{shortName(s.users?.name)}</td>
                    <td className={cell}>
                      <StatusChip tone={SALE[s.sale_status].tone}>{SALE[s.sale_status].label}</StatusChip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------------------- On shift now */

const hms = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, '0')).join(':');
};

export function OnShiftPanel({ shifts, loading }: { shifts: StationToday['onShift'] | undefined; loading: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const list = shifts ?? [];
  return (
    <Panel title="On shift now" meta={shifts ? `${list.length} ${list.length === 1 ? 'attendant' : 'attendants'}` : undefined}>
      {loading && !shifts ? (
        <PanelSkeleton rows={3} />
      ) : (
        <div className="flex flex-col gap-3.5">
          {list.length === 0 ? (
            <Empty>Nobody is on shift. Shifts start on the attendant app.</Empty>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {list.map((s) => {
                const name = s.attendant?.name ?? 'Unknown attendant';
                return (
                  <li key={s.shiftId} className="flex items-center gap-3 border-b border-border pb-3.5">
                    <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-13 font-semibold text-text-secondary">
                      {initialsOf(name)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-14 font-semibold text-text">{name}</span>
                      <span className="truncate text-12 text-text-muted">
                        {num(s.sales)} {s.sales === 1 ? 'sale' : 'sales'} · {rwf(s.revenue)}
                      </span>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-control bg-success-tint px-3 py-1.5" title={`On shift since ${clock(s.startedAt)}`}>
                      <span aria-hidden className="size-2 rounded-full bg-success" />
                      <time dateTime={s.startedAt} className="font-mono text-13 font-semibold text-success">
                        <span className="sr-only">On shift for </span>
                        {hms(now - Date.parse(s.startedAt))}
                      </time>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="m-0 text-12 text-text-muted">Shifts close with meter readings and the attendant&apos;s PIN.</p>
        </div>
      )}
    </Panel>
  );
}
