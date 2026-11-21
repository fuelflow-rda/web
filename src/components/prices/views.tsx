'use client';

import { useState, type FormEvent } from 'react';
import { DatePicker, InputNumber, Segmented, Select } from 'antd';
import dayjs from 'dayjs';
import { CalendarClock, Trash2 } from 'lucide-react';
import { Banner, Button, Panel, Tag } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { num } from '@/components/overview/panels';
import { cx } from '@/lib/cx';
import { PRODUCT_TYPES, productCode, productColor, productName, unitForProduct } from '@/lib/product-types';
import { fromKigaliWall, nextSixAm, toKigaliWall, type HistoryRow, type PriceRow } from './data';

const per = (product: string) => (unitForProduct(product) === 'KWH' ? 'per kWh' : 'per litre');
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));
const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Kigali',
  })
    .format(new Date(iso))
    .replace(',', '');
const time = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' }).format(
    new Date(iso),
  );
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${num(Math.abs(n))}`;

/** "at 06:00 tomorrow", "at 06:00 on Mon 23 Nov", in Kigali. */
export function whenLabel(iso: string, now = Date.now()): string {
  const day = (ms: number) => new Date(ms + 2 * 3600_000).toISOString().slice(0, 10);
  const d = day(Date.parse(iso));
  if (d === day(now)) return `at ${time(iso)} today`;
  if (d === day(now + 86_400_000)) return `at ${time(iso)} tomorrow`;
  return `at ${time(iso)} on ${shortDate(iso)}`;
}

export function ScheduledBanner({ change, onEdit }: { change: PriceRow; onEdit: () => void }) {
  const by = change.users?.name;
  const setAt = change.set_at
    ? ` on ${new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'Africa/Kigali' }).format(new Date(change.set_at))} at ${time(change.set_at)}`
    : '';
  return (
    <Banner
      tone="info"
      icon={CalendarClock}
      title={`${productName(change.product_type)} moves to RWF ${num(change.price_per_unit)} ${per(change.product_type)} ${whenLabel(change.effective_at)}`}
      action={{ label: 'Edit or cancel', onClick: onEdit }}
    >
      {`Scheduled${by ? ` by ${by}` : ''}${setAt}. Attendants see the new price on their first sale after ${time(change.effective_at)}.`}
    </Banner>
  );
}

export function PriceCard({
  product,
  row,
  selected,
  onPick,
}: {
  product: string;
  row: PriceRow;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cx(
        'flex min-w-0 cursor-pointer flex-col gap-3.5 rounded-card border bg-surface p-5 text-left transition-colors hover:border-border-strong',
        selected ? 'border-primary' : 'border-border',
        focusRing,
      )}
    >
      <Tag color={productColor(product)} className="self-start whitespace-nowrap">
        {productCode(product)}
      </Tag>
      <span className="text-14 font-semibold text-text">{productName(product)}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-14 font-medium text-text-secondary">RWF</span>
        <span className="font-mono text-30 leading-none font-medium tracking-n20 text-text">
          {num(row.price_per_unit)}
        </span>
        <span className="text-14 whitespace-nowrap text-text-secondary">{per(product)}</span>
      </span>
      <span className="text-12 text-text-muted">Since {shortDate(row.effective_at)}</span>
    </button>
  );
}

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';
  if (rows.length === 0)
    return (
      <p className="m-0 px-5 py-10 text-center text-14 text-text-secondary">No price changes in the last 90 days.</p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>
              Date
            </th>
            <th scope="col" className={head}>
              Product
            </th>
            {['Old', 'New', 'Change'].map((h) => (
              <th key={h} scope="col" className={cx(head, 'text-right')}>
                {h}
              </th>
            ))}
            <th scope="col" className={head}>
              Changed by
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={cx(cell, 'text-14 whitespace-nowrap text-text')}>{longDate(r.effective_at)}</td>
              <td className={cell}>
                <Tag color={productColor(r.product_type)} className="whitespace-nowrap">
                  {productCode(r.product_type)}
                </Tag>
              </td>
              <td className={cx(cell, 'text-right font-mono text-13 text-text-secondary')}>
                {r.previous_price === null ? '—' : num(r.previous_price)}
              </td>
              <td className={cx(cell, 'text-right font-mono text-13 font-semibold text-text')}>
                {num(r.price_per_unit)}
              </td>
              <td
                className={cx(
                  cell,
                  'text-right font-mono text-13 font-semibold',
                  (r.change ?? 0) > 0 ? 'text-success' : (r.change ?? 0) < 0 ? 'text-danger' : 'text-text-muted',
                )}
              >
                {r.change === null ? 'First price' : signed(r.change)}
              </td>
              <td className={cx(cell, 'text-14 text-text')}>{r.users?.name ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type Draft = { editing: PriceRow | null; product: string };

/**
 * "Schedule a price change": a new price now or at a set time (Kigali), or
 * an edit to one already scheduled. Sales keep the price they were made at.
 */
export function SchedulePanel({
  draft,
  current,
  canEdit,
  onProduct,
  onSave,
  onCancelChange,
  onDone,
}: {
  draft: Draft;
  current: Record<string, PriceRow | null>;
  canEdit: boolean;
  onProduct: (product: string) => void;
  onSave: (body: { product: string; price: number; effectiveAt: string | null }) => Promise<void>;
  onCancelChange: (row: PriceRow) => Promise<void>;
  onDone: () => void;
}) {
  const editing = draft.editing;
  const product = editing?.product_type ?? draft.product;
  const now = current[product]?.price_per_unit ?? null;
  const [price, setPrice] = useState<number | null>(editing?.price_per_unit ?? null);
  const [mode, setMode] = useState<'later' | 'now'>('later');
  const [wall, setWall] = useState(editing ? toKigaliWall(editing.effective_at) : nextSixAm());
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState<'save' | 'cancel' | null>(null);

  const diff = price !== null && now !== null ? price - now : null;
  const hint =
    now === null
      ? 'This product has no price yet.'
      : `Current price ${num(now)}${diff !== null && diff !== 0 ? ` · change ${signed(diff)} (${((diff / now) * 100).toFixed(1)}%)` : ''}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!price || price <= 0) return setProblem('Enter the new price in RWF.');
    if (price === now && !editing) return setProblem('That is already the price.');
    const at = editing || mode === 'later' ? fromKigaliWall(wall) : null;
    if (at && Date.parse(at) < Date.now() - 60_000)
      return setProblem('Choose a time that has not passed, or change it now.');
    setProblem('');
    setBusy('save');
    try {
      await onSave({ product, price, effectiveAt: at });
      onDone();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The price could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  if (!canEdit) {
    return (
      <Panel title="Changing a price">
        <p className="m-0 text-14 text-text-secondary">Station managers and company admins set prices.</p>
      </Panel>
    );
  }

  return (
    <Panel title={editing ? 'Edit the scheduled change' : 'Schedule a price change'}>
      <form id="schedule-price" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {problem ? <Banner tone="danger" title={problem} /> : null}
        <div className="flex flex-col gap-2">
          <label htmlFor="sp-product" className="text-13 font-medium text-text-secondary">
            Product
          </label>
          <Select
            id="sp-product"
            value={product}
            onChange={onProduct}
            disabled={Boolean(editing)}
            options={PRODUCT_TYPES.map((p) => ({ value: p, label: productName(p) }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sp-price" className="text-13 font-medium text-text-secondary">
            New price, RWF {per(product)}
          </label>
          <InputNumber
            id="sp-price"
            value={price}
            onChange={(v) => setPrice(v)}
            min={1}
            max={1_000_000}
            precision={0}
            className="w-full font-mono"
            formatter={(v) =>
              v === undefined || v === null || String(v) === '' ? '' : Number(v).toLocaleString('en-US')
            }
            parser={(v) => Number((v ?? '').replace(/\D/g, ''))}
            aria-describedby="sp-price-hint"
          />
          <p id="sp-price-hint" className="m-0 text-12 text-text-muted">
            {hint}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-13 font-medium text-text-secondary">Takes effect</span>
          {editing ? null : (
            <Segmented
              aria-label="When"
              value={mode}
              onChange={(v) => setMode(v as 'later' | 'now')}
              options={[
                { value: 'later', label: 'At a set time' },
                { value: 'now', label: 'Now' },
              ]}
              className="self-start"
            />
          )}
          {mode === 'later' || editing ? (
            <DatePicker
              aria-label="Takes effect, Kigali time"
              showTime={{ format: 'HH:mm', minuteStep: 5 }}
              format="ddd D MMM YYYY · HH:mm"
              value={dayjs(wall)}
              onChange={(v) => v && setWall(v.format('YYYY-MM-DDTHH:mm'))}
              allowClear={false}
              disabledDate={(d) => d.isBefore(dayjs().startOf('day')) || d.isAfter(dayjs().add(90, 'day'))}
            />
          ) : null}
          <p className="m-0 text-12 text-text-muted">
            {mode === 'now' && !editing
              ? 'The next sale on any pump uses the new price.'
              : 'Kigali time. Sales recorded before this time keep the old price.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button kind="primary" htmlType="submit" loading={busy === 'save'} disabled={busy !== null}>
            {editing ? 'Save changes' : mode === 'now' ? 'Change price now' : 'Schedule change'}
          </Button>
          {editing ? (
            <Button
              kind="danger"
              icon={Trash2}
              loading={busy === 'cancel'}
              disabled={busy !== null}
              onClick={async () => {
                setBusy('cancel');
                try {
                  await onCancelChange(editing);
                  onDone();
                } catch (err) {
                  setProblem(err instanceof Error ? err.message : 'The change could not be cancelled.');
                } finally {
                  setBusy(null);
                }
              }}
            >
              Cancel this change
            </Button>
          ) : null}
          <Button kind="ghost" onClick={onDone} disabled={busy !== null}>
            {editing ? 'Back' : 'Clear'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
