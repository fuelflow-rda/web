'use client';

import { useState, type FormEvent } from 'react';
import { Input, Select } from 'antd';
import { Check, CircleCheck, Flag } from 'lucide-react';
import { Button, Panel, StatusChip, Tag, type StatusTone } from '@/components/ui';
import { PanelError, PanelSkeleton, clock, num, rwf } from '@/components/overview/panels';
import { cx } from '@/lib/cx';
import { formatMeter, pointLabel, productCode, productColor } from '@/lib/product-types';
import type { Decision, PumpLine, PumpShifts, Report } from './types';

const signed = (n: number, unit?: string) => {
  const body = unit ? formatMeter(Math.abs(n), unit) : num(Math.abs(n));
  return n === 0 ? body : `${n < 0 ? '−' : '+'}${body}`;
};
const meter = (n: number | null) =>
  n === null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const when = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));

const OUTCOME: Record<PumpLine['outcome'], { label: string; tone: StatusTone }> = {
  review: { label: 'Review', tone: 'danger' },
  matched: { label: 'Matched', tone: 'success' },
  offline: { label: 'Offline', tone: 'neutral' },
};

const head =
  'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
const right = 'text-right';
const cellBase = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

/* ---------------------------------------------------------------- By pump */

export function PumpTable({
  report,
  selected,
  onSelect,
}: {
  report: Report;
  selected: string | null;
  onSelect: (pumpId: string) => void;
}) {
  const lines = report.pumpBreakdown;
  const liters = lines.filter((l) => l.unit === 'L');
  const kwh = lines.filter((l) => l.unit === 'KWH');
  const sum = (ls: PumpLine[], f: (l: PumpLine) => number | null) => ls.reduce((s, l) => s + (f(l) ?? 0), 0);
  // One line per unit, so the total row does not widen its columns.
  const both = (f: (l: PumpLine) => number | null) => (
    <span className="flex flex-col items-end gap-0.5">
      {liters.length ? <span>{formatMeter(sum(liters, f), 'L')}</span> : null}
      {kwh.length ? <span>{formatMeter(sum(kwh, f), 'KWH')}</span> : null}
    </span>
  );
  const reviewNote = (l: PumpLine) => (l.reviewReason === 'readings_missing' ? 'A closing reading is missing' : null);

  return (
    <Panel title="By pump" meta="Discrepancies first · readings from the shift open and close" padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-240 border-collapse">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={head}>
                Pump
              </th>
              {['Opening', 'Closing', 'Metered', 'Recorded', 'Variance', 'Expected RWF', 'Difference RWF'].map((h) => (
                <th key={h} scope="col" className={cx(head, right)}>
                  {h}
                </th>
              ))}
              <th scope="col" className={head}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const review = l.outcome === 'review';
              const isSelected = selected === l.pumpId;
              const cell = cx(cellBase, review && 'bg-danger-tint');
              const tone = review && l.reviewReason === 'variance' ? 'text-danger' : 'text-text';
              return (
                <tr key={l.pumpId} onClick={() => onSelect(l.pumpId)} className="cursor-pointer">
                  <th
                    scope="row"
                    className={cx(cell, 'text-left', isSelected && 'shadow-[inset_3px_0_0_var(--primary)]')}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(l.pumpId);
                      }}
                      aria-pressed={isSelected}
                      className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left"
                    >
                      <span className="text-14 font-semibold whitespace-nowrap text-text">
                        {pointLabel(l.pumpNumber, l.productType)}
                      </span>
                      <Tag color={productColor(l.productType)} className="whitespace-nowrap">
                        {productCode(l.productType)}
                      </Tag>
                    </button>
                  </th>
                  <td className={cx(cell, right, 'font-mono text-13 text-text-secondary')}>
                    {meter(l.openingReading)}
                  </td>
                  <td className={cx(cell, right, 'font-mono text-13 text-text-secondary')}>
                    {meter(l.closingReading)}
                  </td>
                  <td className={cx(cell, right, 'font-mono text-13 whitespace-nowrap text-text')}>
                    {l.meteredQuantity === null ? '—' : formatMeter(l.meteredQuantity, l.unit)}
                  </td>
                  <td className={cx(cell, right, 'font-mono text-13 whitespace-nowrap text-text')}>
                    {formatMeter(l.quantity, l.unit)}
                  </td>
                  <td className={cx(cell, right, 'font-mono text-13 font-semibold whitespace-nowrap', tone)}>
                    {l.volumeDifference === null ? '—' : signed(l.volumeDifference, l.unit)}
                  </td>
                  <td className={cx(cell, right, 'font-mono text-13 text-text')}>{num(l.expectedRevenue)}</td>
                  <td className={cx(cell, right, 'font-mono text-13 font-semibold', tone)}>{signed(l.difference)}</td>
                  <td className={cell} title={reviewNote(l) ?? undefined}>
                    <span className="flex flex-col items-start gap-1">
                      <StatusChip tone={OUTCOME[l.outcome].tone}>{OUTCOME[l.outcome].label}</StatusChip>
                      {l.resolution ? (
                        <span className="text-12 whitespace-nowrap text-text-secondary">
                          {l.resolution.decision === 'explained' ? 'Explained' : 'Flagged'}
                        </span>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface-muted">
              <th
                scope="row"
                className={cx(cellBase, 'border-border-strong text-left text-14 font-semibold text-text')}
              >
                Station total
              </th>
              <td className={cx(cellBase, 'border-border-strong')} />
              <td className={cx(cellBase, 'border-border-strong')} />
              <td
                className={cx(
                  cellBase,
                  'border-border-strong',
                  right,
                  'font-mono text-13 font-semibold whitespace-nowrap text-text',
                )}
              >
                {both((l) => l.meteredQuantity)}
              </td>
              <td
                className={cx(
                  cellBase,
                  'border-border-strong',
                  right,
                  'font-mono text-13 font-semibold whitespace-nowrap text-text',
                )}
              >
                {both((l) => l.quantity)}
              </td>
              <td
                className={cx(
                  cellBase,
                  'border-border-strong',
                  right,
                  'font-mono text-13 font-semibold whitespace-nowrap',
                  Math.abs(report.volumeDifference.liters) > report.tolerance ? 'text-danger' : 'text-text',
                )}
              >
                {[
                  liters.length ? signed(report.volumeDifference.liters, 'L') : null,
                  kwh.length && report.volumeDifference.kwh ? signed(report.volumeDifference.kwh, 'KWH') : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </td>
              <td className={cx(cellBase, 'border-border-strong', right, 'font-mono text-13 font-semibold text-text')}>
                {num(report.expectedRevenue)}
              </td>
              <td
                className={cx(
                  cellBase,
                  'border-border-strong',
                  right,
                  'font-mono text-13 font-semibold',
                  report.difference < 0 ? 'text-danger' : 'text-text',
                )}
              >
                {signed(report.difference)}
              </td>
              <td className={cx(cellBase, 'border-border-strong')} />
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- By attendant / by payment */

export function AttendantTable({ report }: { report: Report }) {
  const rows = report.attendantBreakdown;
  return (
    <Panel title="By attendant" meta="Sales recorded by each attendant that day" padded={false}>
      {rows.length === 0 ? (
        <p className="m-0 px-5 py-8 text-center text-14 text-text-secondary">No sales were recorded that day.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className={head}>
                  Attendant
                </th>
                {['Sales', 'Fuel', 'Energy', 'Revenue RWF'].map((h) => (
                  <th key={h} scope="col" className={cx(head, right)}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.attendantId}>
                  <th scope="row" className={cx(cellBase, 'text-left text-14 font-semibold text-text')}>
                    {a.attendantName}
                  </th>
                  <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>{num(a.transactionCount)}</td>
                  <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>{formatMeter(a.liters, 'L')}</td>
                  <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>{formatMeter(a.kwh, 'KWH')}</td>
                  <td className={cx(cellBase, right, 'font-mono text-13 font-semibold text-text')}>{num(a.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

const PAY: Record<string, string> = { CASH: 'Cash', MOMO: 'MoMo', CARD: 'Bank card', ACCOUNT: 'Prepaid balance', VOUCHER: 'Prepaid voucher' };
const PAY_DOT: Record<string, string> = { CASH: 'bg-pay-cash', MOMO: 'bg-pay-momo', CARD: 'bg-pay-card', ACCOUNT: 'bg-pay-account', VOUCHER: 'bg-pay-voucher' };
const TILL: Record<string, string> = { CASH: 'Yes', MOMO: 'MoMo wallet', CARD: 'Card terminal', ACCOUNT: 'No · paid earlier', VOUCHER: 'No · paid earlier' };

/**
 * The day by payment (Pencil "Web / Reconciliation · By payment"). Balance and
 * voucher payments were paid for before the sale, so they are marked as not
 * in the till; discounts are shown beside, with how expected revenue allows
 * for them.
 */
export function PaymentTable({ report }: { report: Report }) {
  const total = report.paymentBreakdown.reduce((s, p) => s + p.amount, 0);
  const payments = report.paymentBreakdown.reduce((s, p) => s + p.count, 0);
  const d = report.discounts;
  const hasNew = report.paymentBreakdown.some((p) => p.prepaid) || (d?.total ?? 0) > 0;
  const table = (
    <Panel
      title="By payment"
      meta={hasNew ? 'Balance and voucher payments were paid for in advance; they are not cash in the till' : 'What was recorded against each way of paying'}
      padded={false}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 border-collapse">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={head}>
                Payment
              </th>
              {['Payments', 'Amount RWF', 'Share', ...(hasNew ? ['In the till'] : [])].map((h) => (
                <th key={h} scope="col" className={cx(head, right)}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.paymentBreakdown.map((p) => (
              <tr key={p.method}>
                <th scope="row" className={cx(cellBase, 'text-left text-14 font-semibold text-text')}>
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className={cx('size-2 rounded-full', PAY_DOT[p.method] ?? 'bg-text-muted')} />
                    {PAY[p.method] ?? p.method}
                  </span>
                </th>
                <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>{num(p.count)}</td>
                <td className={cx(cellBase, right, 'font-mono text-13 font-semibold text-text')}>{num(p.amount)}</td>
                <td className={cx(cellBase, right, 'font-mono text-13 text-text-muted')}>
                  {total ? ((p.amount / total) * 100).toFixed(1) : '0.0'}%
                </td>
                {hasNew ? <td className={cx(cellBase, right, 'text-13 text-text-secondary')}>{TILL[p.method] ?? '—'}</td> : null}
              </tr>
            ))}
            <tr className="bg-surface-muted">
              <th scope="row" className={cx(cellBase, 'text-left text-14 font-semibold text-text')}>
                Recorded revenue
              </th>
              <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>{num(payments)}</td>
              <td className={cx(cellBase, right, 'font-mono text-13 font-semibold text-text')}>{num(total)}</td>
              <td className={cx(cellBase, right, 'font-mono text-13 text-text-muted')}>100%</td>
              {hasNew ? <td className={cellBase} /> : null}
            </tr>
          </tbody>
        </table>
      </div>
      {report.splitSales ? (
        <p className="m-0 border-t border-border px-5 py-3 text-13 text-text-secondary">
          {num(report.totalTransactions)} sales. {num(report.splitSales)} {report.splitSales === 1 ? 'was' : 'were'} paid two ways, a balance or voucher plus
          cash, card or MoMo; each part is counted in its own row.
        </p>
      ) : null}
    </Panel>
  );
  if (!hasNew || !d) return table;
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      {table}
      <div className="flex flex-col gap-4">
        <Panel title="Discounts" meta="Already taken off the price of each sale">
          <dl className="m-0 flex flex-col">
            {[
              [`Card discounts · ${num(d.card_sales)} ${d.card_sales === 1 ? 'sale' : 'sales'}`, d.card],
              [`Promo vouchers · ${num(d.promo_sales)} ${d.promo_sales === 1 ? 'sale' : 'sales'}`, d.promo],
              ['Total discounts', d.total],
            ].map(([k, v], i) => (
              <div key={String(k)} className={cx('flex items-center justify-between gap-3 py-2.5', i > 0 && 'border-t border-border')}>
                <dt className="text-14 text-text-secondary">{k}</dt>
                <dd className="m-0 font-mono text-13 font-medium text-text">−{rwf(Number(v))}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="How expected revenue is worked out">
          <dl className="m-0 flex flex-col">
            {[
              ['Volume × list price', rwf(report.expectedRevenue + d.total)],
              ['Less discounts recorded', `−${rwf(d.total)}`],
              ['Expected revenue', rwf(report.expectedRevenue)],
            ].map(([k, v], i) => (
              <div key={k} className={cx('flex items-center justify-between gap-3 py-2.5', i > 0 && 'border-t border-border')}>
                <dt className="text-14 text-text-secondary">{k}</dt>
                <dd className="m-0 font-mono text-13 font-medium text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- One pump by shift */

export function ShiftPanel({
  line,
  data,
  loading,
  error,
  onRetry,
}: {
  line: PumpLine;
  data: PumpShifts | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const label = pointLabel(line.pumpNumber, line.productType);
  const gap = line.volumeDifference;
  const meta =
    line.reviewReason === 'variance' && gap !== null && gap < 0
      ? `Where the ${formatMeter(Math.abs(gap), line.unit)} went missing`
      : 'Metered against recorded, shift by shift';
  return (
    <Panel title={`${label} by shift`} meta={meta} padded={false}>
      {error && !data ? (
        <div className="p-5">
          <PanelError message="The shifts could not be loaded." onRetry={onRetry} />
        </div>
      ) : loading && !data ? (
        <div className="p-5">
          <PanelSkeleton rows={3} />
        </div>
      ) : !data || data.shifts.length === 0 ? (
        <p className="m-0 px-5 py-8 text-center text-14 text-text-secondary">No shift used {label} that day.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 border-collapse">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className={head}>
                  Shift
                </th>
                {['Metered', 'Recorded', 'Variance'].map((h) => (
                  <th key={h} scope="col" className={cx(head, right)}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.shifts.map((s) => {
                const off = s.volumeDifference !== null && Math.abs(s.volumeDifference) > 0.5;
                return (
                  <tr key={s.shiftId ?? 'none'}>
                    <th scope="row" className={cx(cellBase, 'text-left')}>
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-12 font-semibold text-text-secondary"
                        >
                          {(s.attendant?.name ?? '?')
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-14 font-semibold text-text">
                            {s.attendant?.name ?? 'No shift recorded'}
                          </span>
                          <span className="text-12 text-text-muted">
                            {s.startedAt ? clock(s.startedAt) : '—'} to{' '}
                            {s.shiftOpen ? 'now' : s.endedAt ? clock(s.endedAt) : '—'}
                          </span>
                        </span>
                      </span>
                    </th>
                    <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>
                      {s.meteredQuantity === null ? 'No reading' : formatMeter(s.meteredQuantity, data.unit)}
                    </td>
                    <td className={cx(cellBase, right, 'font-mono text-13 text-text')}>
                      {formatMeter(s.recordedQuantity, data.unit)}
                    </td>
                    <td
                      className={cx(
                        cellBase,
                        right,
                        'font-mono text-13 font-semibold',
                        off ? 'text-danger' : s.volumeDifference === null ? 'text-text' : 'text-success',
                      )}
                    >
                      {s.volumeDifference === null ? '—' : signed(s.volumeDifference, data.unit)}
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

/* ---------------------------------------------------------------- Resolve */

export function ResolvePanel({
  line,
  decisions,
  shifts,
  canDecide,
  onDecide,
}: {
  line: PumpLine;
  decisions: Decision[];
  shifts: PumpShifts | null;
  canDecide: boolean;
  onDecide: (body: { decision: 'explained' | 'flagged'; note: string; shift_id?: string }) => Promise<void>;
}) {
  const label = pointLabel(line.pumpNumber, line.productType);
  const history = decisions.filter((d) => d.pumpId === line.pumpId);
  // Whose shift to flag: the one with the largest gap, unless someone picks another.
  const flaggable = (shifts?.shifts ?? []).filter((s) => s.shiftId && s.attendant);
  const worst = [...flaggable].sort((a, b) => Math.abs(b.volumeDifference ?? 0) - Math.abs(a.volumeDifference ?? 0))[0];
  const [shiftId, setShiftId] = useState<string | undefined>(undefined);
  const chosen = flaggable.find((s) => s.shiftId === shiftId) ?? worst;
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState<'explained' | 'flagged' | null>(null);

  const submit = async (decision: 'explained' | 'flagged', e?: FormEvent) => {
    e?.preventDefault();
    if (note.trim().length < 3) {
      setProblem('Write what happened, so the decision makes sense to whoever reads it later.');
      return;
    }
    if (decision === 'flagged' && !chosen?.shiftId) {
      setProblem('There is no shift on this pump to flag.');
      return;
    }
    setProblem('');
    setBusy(decision);
    try {
      await onDecide({
        decision,
        note: note.trim(),
        ...(decision === 'flagged' ? { shift_id: chosen!.shiftId! } : {}),
      });
      setNote('');
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The decision could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const needsDecision = line.outcome === 'review';
  return (
    <Panel
      title={needsDecision ? 'Resolve this discrepancy' : `${label} decisions`}
      meta="Decisions are kept in the audit log"
    >
      <div className="flex flex-col gap-4">
        {!needsDecision && history.length === 0 ? (
          <p className="m-0 flex items-center gap-2 text-14 text-text-secondary">
            <CircleCheck size={16} aria-hidden className="text-success" />
            {line.outcome === 'offline'
              ? `${label} was out of service.`
              : `${label} is within tolerance. Nothing to resolve.`}
          </p>
        ) : null}
        {history.length ? (
          <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Decisions so far">
            {history.map((d) => (
              <li key={d.id} className="flex flex-col gap-1 rounded-control bg-surface-muted p-3">
                <span className="flex items-center justify-between gap-2">
                  <StatusChip
                    tone={d.decision === 'explained' ? 'success' : 'warning'}
                    icon={d.decision === 'flagged' ? Flag : undefined}
                  >
                    {d.decision === 'explained' ? 'Explained' : `Flagged to ${d.attendant?.name ?? 'attendant'}`}
                  </StatusChip>
                  <span className="text-12 text-text-muted">{when(d.decidedAt)}</span>
                </span>
                <span className="text-14 text-text">{d.note}</span>
                <span className="text-12 text-text-muted">{d.decidedBy.name ?? 'Someone'}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {needsDecision || history.length ? (
          canDecide ? (
            <form onSubmit={(e) => submit('explained', e)} noValidate className="flex flex-col gap-2">
              <label htmlFor="decision-note" className="text-13 font-medium text-text-secondary">
                Note for the record
              </label>
              <Input.TextArea
                id="decision-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
                maxLength={1000}
                placeholder="What happened, in a sentence or two"
                status={problem ? 'error' : undefined}
                aria-invalid={problem ? true : undefined}
                aria-describedby="decision-hint"
              />
              <p id="decision-hint" className={cx('m-0 text-12', problem ? 'text-danger' : 'text-text-muted')}>
                {problem || 'Visible to the company admin and in the PDF export'}
              </p>
              {flaggable.length > 1 ? (
                <Select
                  aria-label="Shift to flag"
                  value={chosen?.shiftId ?? undefined}
                  onChange={setShiftId}
                  options={flaggable.map((s) => ({
                    value: s.shiftId!,
                    label: `${s.attendant!.name ?? 'Attendant'} · ${s.startedAt ? clock(s.startedAt) : ''}${s.volumeDifference ? ` · ${signed(s.volumeDifference, shifts!.unit)}` : ''}`,
                  }))}
                />
              ) : null}
              <div className="mt-2 flex flex-col gap-2.5">
                <Button
                  kind="primary"
                  htmlType="submit"
                  icon={Check}
                  block
                  loading={busy === 'explained'}
                  disabled={busy !== null}
                >
                  Mark as explained
                </Button>
                <Button
                  icon={Flag}
                  block
                  onClick={() => submit('flagged')}
                  loading={busy === 'flagged'}
                  disabled={busy !== null || !chosen}
                >
                  {chosen?.attendant?.name ? `Flag to ${chosen.attendant.name.split(' ')[0]}` : 'Flag to attendant'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="m-0 text-13 text-text-muted">Station managers and company admins decide on discrepancies.</p>
          )
        ) : null}
      </div>
    </Panel>
  );
}
