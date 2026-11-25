'use client';

import { useState, type FormEvent } from 'react';
import { Drawer, Segmented } from 'antd';
import { ClipboardCheck, Trash2, Truck, type LucideIcon } from 'lucide-react';
import { Banner, Button, RowMenu, StatusChip, TextField } from '@/components/ui';
import { toKigaliWall } from '@/components/prices/data';
import { cx } from '@/lib/cx';
import { formatMeter, unitLabel } from '@/lib/product-types';
import {
  REASON_MAX,
  STOCK_PRODUCTS,
  checkCount,
  checkDelivery,
  checkReason,
  formatCostPerUnit,
  levelQty,
  parseCost,
  parseQuantity,
  perUnit,
  recordCount,
  recordDelivery,
  removeEntry,
  signedQty,
  stockColor,
  stockHint,
  stockName,
  stockSubline,
  stockUnit,
  type CountDraft,
  type DeliveryDraft,
  type Problems,
  type StockEntry,
  type StockKind,
  type StockLevel,
  type StockProduct,
  NOTE_MAX,
  REFERENCE_MAX,
  SUPPLIER_MAX,
} from './data';

const one = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** "Mon 23 Nov, 08:00", in Kigali. */
export const stamp = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));
/** The current minute in Kigali, as a datetime field holds it. */
const kigaliNow = () => toKigaliWall(new Date().toISOString());

export const KIND: Record<StockKind, { label: string; icon: LucideIcon }> = {
  delivery: { label: 'Delivery', icon: Truck },
  count: { label: 'Count', icon: ClipboardCheck },
};

/** The product's colour as a dot, beside its name. Colour is never the only mark. */
export function ProductDot({ product, className }: { product: string; className?: string }) {
  return (
    <span aria-hidden className={cx('size-2 shrink-0 rounded-full', className)} style={{ background: stockColor(product) }} />
  );
}

/* --------------------------------------------------------------- Levels */

/**
 * One product's stock: the level worked out from the last count, or a plain
 * "unknown" and the way to fix it when nothing has been counted yet.
 */
export function LevelCard({
  level,
  canRecord,
  onCount,
}: {
  level: StockLevel;
  canRecord: boolean;
  onCount: () => void;
}) {
  const name = stockName(level.product);
  const unit = level.unit ?? stockUnit(level.product);
  const known = level.level !== null && level.counted_at !== null;
  const negative = known && (level.level as number) < 0;
  const last = level.last_delivery;

  return (
    <article
      aria-label={`${name} stock`}
      className="flex min-w-0 flex-col gap-4.5 rounded-card border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 flex items-center gap-2 text-18 font-semibold text-text">
            <ProductDot product={level.product} className="size-2.5" />
            {name}
          </h3>
          <p className="m-0 text-13 text-text-muted">{stockSubline(level.product)}</p>
        </div>
        {negative ? (
          <StatusChip tone="danger">Below zero</StatusChip>
        ) : !known ? (
          <StatusChip tone="neutral">Not counted</StatusChip>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="type-overline text-text-muted">In stock</span>
        {known ? (
          <span className="flex items-baseline gap-1.5">
            <span
              className={cx(
                'font-mono text-30 leading-none font-medium tracking-n20',
                negative ? 'text-danger' : 'text-text',
              )}
            >
              {negative ? '−' : ''}
              {one(Math.abs(level.level as number))}
            </span>
            <span className="text-14 font-medium text-text-secondary">{unitLabel(unit)}</span>
          </span>
        ) : (
          <span className="text-22 leading-none font-semibold text-text-secondary">Unknown</span>
        )}
      </div>

      {known ? (
        <>
          {negative ? (
            <p className="m-0 -mt-1.5 text-13 text-text-secondary">
              Recorded sales are more than the stock on record. Record a count, or a delivery that is missing.
            </p>
          ) : null}
          <dl className="m-0 flex flex-col gap-2 border-t border-border pt-3.5">
            {(
              [
                [`Counted ${stamp(level.counted_at as string)}`, levelQty(level.counted_quantity ?? 0, unit)],
                ['Delivered since', signedQty(level.delivered_since_count ?? 0, unit)],
                ['Sold since', signedQty(-(level.sold_since_count ?? 0), unit)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 truncate text-13 text-text-secondary">{k}</dt>
                <dd className="m-0 font-mono text-13 font-medium whitespace-nowrap text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="m-0 -mt-1.5 text-13 text-text-secondary">
            No stock count yet, so the level is unknown. A count sets the starting point; deliveries and sales are added
            from there.
          </p>
          {canRecord ? (
            <Button icon={ClipboardCheck} onClick={onCount}>
              Record a stock count
            </Button>
          ) : (
            <p className="m-0 text-13 text-text-muted">A station manager or company admin can record one.</p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3.5">
        <span className="font-mono text-10 font-medium tracking-p80 text-text-muted uppercase">Last delivery</span>
        <span className="text-13 text-text">
          {last
            ? [stamp(last.occurred_at), formatMeter(last.quantity, unit), last.supplier].filter(Boolean).join(' · ')
            : 'None recorded'}
        </span>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- Forms */

function ProductPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: StockProduct;
  onChange: (p: StockProduct) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-13 font-medium text-text-secondary">
        Product
      </span>
      <Segmented
        aria-labelledby={id}
        block
        value={value}
        onChange={(v) => onChange(v as StockProduct)}
        options={STOCK_PRODUCTS.map((p) => ({ value: p, label: stockName(p) }))}
      />
      {stockHint(value) ? <p className="m-0 text-12 text-text-muted">{`${stockName(value)} ${stockHint(value)}, in kWh.`}</p> : null}
    </div>
  );
}

function DrawerFooter({
  form,
  label,
  icon,
  kind = 'primary',
  saving,
  onClose,
}: {
  form: string;
  label: string;
  icon: LucideIcon;
  kind?: 'primary' | 'danger';
  saving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-2.5 py-1">
      <Button kind="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button kind={kind} icon={icon} htmlType="submit" form={form} loading={saving}>
        {label}
      </Button>
    </div>
  );
}

/**
 * "Record delivery": a tanker's litres, or electricity bought for the
 * chargers, with what it cost. Mounted only while open, so it starts afresh
 * at the current Kigali time.
 */
export function DeliveryDrawer({
  stationId,
  product,
  onClose,
  onDone,
}: {
  stationId: string;
  product: StockProduct;
  onClose: () => void;
  onDone: (entry: StockEntry) => void;
}) {
  const [draft, setDraft] = useState<DeliveryDraft>(() => ({
    product,
    quantity: '',
    wall: kigaliNow(),
    supplier: '',
    reference: '',
    cost: '',
    note: '',
  }));
  const [problems, setProblems] = useState<Problems>({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<DeliveryDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const unit = stockUnit(draft.product);
  const ev = unit === 'KWH';
  const per = formatCostPerUnit(parseCost(draft.cost), parseQuantity(draft.quantity), unit);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = checkDelivery(stationId, draft);
    setProblems(checked.problems);
    if (!checked.body) return;
    setFailure('');
    setSaving(true);
    try {
      onDone(await recordDelivery(checked.body));
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The delivery could not be recorded.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      size={460}
      title="Record delivery"
      footer={<DrawerFooter form="stock-delivery" label="Record delivery" icon={Truck} saving={saving} onClose={onClose} />}
    >
      <form id="stock-delivery" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          {ev
            ? 'Electricity bought for the chargers, as on the receipt. It is added to the stock level.'
            : 'Fuel received from a tanker, as on the delivery note. It is added to the stock level.'}
        </p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <ProductPicker id="stock-delivery-product" value={draft.product} onChange={(p) => set({ product: p })} />
        <TextField
          label={ev ? 'kWh bought' : 'Litres received'}
          value={draft.quantity}
          onChange={(e) => set({ quantity: e.target.value })}
          error={problems.quantity}
          inputMode="decimal"
          mono
          autoFocus
          autoComplete="off"
        />
        <TextField
          label={ev ? 'Date and time bought' : 'Date and time received'}
          type="datetime-local"
          value={draft.wall}
          max={kigaliNow()}
          onChange={(e) => set({ wall: e.target.value })}
          error={problems.wall}
          hint="Kigali time"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Supplier · optional"
            value={draft.supplier}
            onChange={(e) => set({ supplier: e.target.value })}
            maxLength={SUPPLIER_MAX}
            autoComplete="off"
          />
          <TextField
            label={ev ? 'Receipt number · optional' : 'Delivery note number · optional'}
            value={draft.reference}
            onChange={(e) => set({ reference: e.target.value })}
            maxLength={REFERENCE_MAX}
            mono
            autoComplete="off"
          />
        </div>
        <TextField
          label="Total cost, RWF · optional"
          value={draft.cost}
          onChange={(e) => set({ cost: e.target.value })}
          error={problems.cost}
          hint={
            <span aria-live="polite">{per ?? `With the quantity, this gives the cost per ${perUnit(unit)}.`}</span>
          }
          inputMode="numeric"
          mono
          autoComplete="off"
        />
        <TextField
          label="Note · optional"
          value={draft.note}
          onChange={(e) => set({ note: e.target.value })}
          maxLength={NOTE_MAX}
          autoComplete="off"
        />
      </form>
    </Drawer>
  );
}

/** "Record stock count": what was measured in the tanks or on the meter. It becomes the new starting level. */
export function CountDrawer({
  stationId,
  product,
  onClose,
  onDone,
}: {
  stationId: string;
  product: StockProduct;
  onClose: () => void;
  onDone: (entry: StockEntry) => void;
}) {
  const [draft, setDraft] = useState<CountDraft>(() => ({ product, quantity: '', wall: kigaliNow(), note: '' }));
  const [problems, setProblems] = useState<Problems>({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<CountDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const ev = stockUnit(draft.product) === 'KWH';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = checkCount(stationId, draft);
    setProblems(checked.problems);
    if (!checked.body) return;
    setFailure('');
    setSaving(true);
    try {
      onDone(await recordCount(checked.body));
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The count could not be recorded.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      size={460}
      title="Record stock count"
      footer={
        <DrawerFooter form="stock-count" label="Record count" icon={ClipboardCheck} saving={saving} onClose={onClose} />
      }
    >
      <form id="stock-count" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          What you measured becomes the new starting level. Deliveries and sales after it are added and taken away from
          there.
        </p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <ProductPicker id="stock-count-product" value={draft.product} onChange={(p) => set({ product: p })} />
        <TextField
          label={ev ? 'kWh left' : 'Litres measured'}
          value={draft.quantity}
          onChange={(e) => set({ quantity: e.target.value })}
          error={problems.quantity}
          hint={ev ? 'As the prepaid meter shows it.' : 'Add up every tank of this product, from the dip or the gauge.'}
          inputMode="decimal"
          mono
          autoFocus
          autoComplete="off"
        />
        <TextField
          label="Date and time measured"
          type="datetime-local"
          value={draft.wall}
          max={kigaliNow()}
          onChange={(e) => set({ wall: e.target.value })}
          error={problems.wall}
          hint="Kigali time"
        />
        <TextField
          label="Note · optional"
          value={draft.note}
          onChange={(e) => set({ note: e.target.value })}
          maxLength={NOTE_MAX}
          autoComplete="off"
        />
      </form>
    </Drawer>
  );
}

/** Takes a delivery or count out of the level, with a reason for the record. */
export function RemoveEntryDrawer({
  entry,
  onClose,
  onDone,
}: {
  entry: StockEntry;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const what = entry.kind === 'delivery' ? 'delivery' : 'count';
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = checkReason(reason);
    if (problem) return setError(problem);
    setError(undefined);
    setSaving(true);
    try {
      await removeEntry(entry.id, reason.trim());
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : `The ${what} could not be removed.`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open
      onClose={onClose}
      size={460}
      title={`Remove this ${what}`}
      footer={
        <DrawerFooter form="stock-remove" label="Remove" icon={Trash2} kind="danger" saving={saving} onClose={onClose} />
      }
    >
      <form id="stock-remove" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          {`The ${what} of ${formatMeter(entry.quantity, entry.unit)} of ${stockName(entry.product).toLowerCase()} on ${stamp(entry.occurred_at)} will no longer count towards the level. Your reason is kept with the record.`}
        </p>
        <TextField
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={error}
          hint="For example: entered twice, or the wrong product."
          maxLength={REASON_MAX}
          autoFocus
          autoComplete="off"
        />
      </form>
    </Drawer>
  );
}

/* -------------------------------------------------------------- History */

const head =
  'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
const cell = 'border-t border-border px-3 py-3 align-top first:pl-5 last:pr-5';
/** A cell with nothing that applies, such as a count's supplier. */
const none = <span className="text-text-muted">—</span>;

/** Deliveries and counts, newest first, as the API pages them. */
export function EntriesTable({
  rows,
  canRemove,
  onRemove,
}: {
  rows: StockEntry[];
  canRemove: boolean;
  onRemove: (entry: StockEntry) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-240 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            {['Date and time', 'Product', 'Type'].map((h) => (
              <th key={h} scope="col" className={head}>
                {h}
              </th>
            ))}
            <th scope="col" className={cx(head, 'text-right')}>
              Quantity
            </th>
            <th scope="col" className={head}>
              Supplier
            </th>
            <th scope="col" className={head}>
              Delivery note no.
            </th>
            <th scope="col" className={cx(head, 'text-right')}>
              Cost, RWF
            </th>
            <th scope="col" className={head}>
              Recorded by
            </th>
            {canRemove ? (
              <th scope="col" className={head}>
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const k = KIND[r.kind];
            const per = formatCostPerUnit(r.cost_rwf, r.quantity, r.unit);
            return (
              <tr key={r.id}>
                <td className={cx(cell, 'font-mono text-13 whitespace-nowrap text-text-secondary')}>
                  {stamp(r.occurred_at)}
                </td>
                <td className={cell}>
                  <span className="inline-flex items-center gap-2 text-14 whitespace-nowrap text-text">
                    <ProductDot product={r.product} />
                    {stockName(r.product)}
                  </span>
                </td>
                <td className={cx(cell, 'max-w-60')}>
                  <span className="inline-flex items-center gap-1.5 text-14 text-text">
                    <k.icon size={14} aria-hidden className="shrink-0 text-text-muted" />
                    {k.label}
                  </span>
                  {r.note ? (
                    <p className="m-0 mt-1 truncate text-12 text-text-muted" title={r.note}>
                      {r.note}
                    </p>
                  ) : null}
                </td>
                <td className={cx(cell, 'text-right font-mono text-13 font-semibold whitespace-nowrap text-text')}>
                  {formatMeter(r.quantity, r.unit)}
                </td>
                <td className={cx(cell, 'text-14 text-text')}>{r.supplier ?? none}</td>
                <td className={cx(cell, 'font-mono text-13 text-text-secondary')}>{r.reference ?? none}</td>
                <td className={cx(cell, 'text-right whitespace-nowrap')}>
                  {r.cost_rwf === null || r.cost_rwf === undefined ? (
                    none
                  ) : (
                    <>
                      <span className="block font-mono text-13 text-text">{r.cost_rwf.toLocaleString('en-US')}</span>
                      {per ? <span className="block text-12 text-text-muted">{per}</span> : null}
                    </>
                  )}
                </td>
                <td className={cx(cell, 'text-14 whitespace-nowrap text-text')}>{r.recorded_by?.name ?? none}</td>
                {canRemove ? (
                  <td className={cx(cell, 'w-12 text-right')}>
                    <RowMenu
                      label={`Actions for the ${k.label.toLowerCase()} on ${stamp(r.occurred_at)}`}
                      items={[
                        { key: 'remove', label: 'Remove…', icon: Trash2, danger: true, onClick: () => onRemove(r) },
                      ]}
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
