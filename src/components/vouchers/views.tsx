'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Drawer, Segmented, Select } from 'antd';
import { Ban, BadgePercent, CalendarPlus, Eye, Ticket } from 'lucide-react';
import { Banner, Button, RowMenu, StatusChip, TextField, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { cx } from '@/lib/cx';
import { ymd } from '@/lib/kigali';
import { num, rwf } from '@/components/overview/panels';
import { listCustomers, type CustomerRow } from '@/components/customers/types';
import { parseRwf, usedLabel } from '@/components/customers/views';
import { batchValue, createBatch, extendBatch, type Batch, type BatchRow, type BatchState, type Voucher } from './types';

const head = 'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

export const BATCH_STATE: Record<BatchState, { tone: StatusTone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  ends_soon: { tone: 'warning', label: 'Ends soon' },
  expired: { tone: 'danger', label: 'Expired' },
  used_up: { tone: 'neutral', label: 'Used up' },
};

const VOUCHER_STATE: Record<Voucher['status'], { tone: StatusTone; label: string }> = {
  unused: { tone: 'success', label: 'Unused' },
  used: { tone: 'neutral', label: 'Used' },
  voided: { tone: 'danger', label: 'Voided' },
};

/** "31 Dec 2026" from a YYYY-MM-DD day. */
export const dayLabel = (ymdDay: string) =>
  new Date(`${ymdDay}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const addDays = (ymdDay: string, days: number) => new Date(Date.parse(`${ymdDay}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function KindChip({ kind }: { kind: 'prepaid' | 'promo' }) {
  return kind === 'prepaid' ? (
    <StatusChip tone="neutral" icon={Ticket}>
      Prepaid
    </StatusChip>
  ) : (
    <StatusChip tone="info" icon={BadgePercent}>
      Promo
    </StatusChip>
  );
}

/* ---------------------------------------------------------------- Batches */

export function BatchesTable({ rows, onOpen }: { rows: BatchRow[]; onOpen: (b: BatchRow) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-240 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>Batch</th>
            <th scope="col" className={head}>Kind</th>
            <th scope="col" className={cx(head, 'text-right')}>Value</th>
            <th scope="col" className={cx(head, 'text-right')}>Used</th>
            <th scope="col" className={cx(head, 'text-right')}>Value left</th>
            <th scope="col" className={head}>Expires</th>
            <th scope="col" className={head}>Status</th>
            <th scope="col" className={cx(head, 'w-12')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const s = BATCH_STATE[b.state];
            return (
              <tr key={b.id} onClick={() => onOpen(b)} className="cursor-pointer transition-colors hover:bg-surface-muted">
                <th scope="row" className={cx(cell, 'text-left font-normal')}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(b);
                    }}
                    className={cx('flex cursor-pointer flex-col items-start gap-0.5 border-0 bg-transparent p-0 text-left', focusRing)}
                  >
                    <span className="text-14 font-semibold text-text">{b.name}</span>
                    <span className="text-12 text-text-muted">
                      {b.customer?.name ?? 'Anyone'} · created {dayLabel(b.created_at.slice(0, 10))}
                    </span>
                  </button>
                </th>
                <td className={cell}>
                  <KindChip kind={b.kind} />
                </td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{batchValue(b, true)}</td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>
                  {b.used} / {b.count}
                </td>
                <td className={cx(cell, 'text-right font-mono text-13', b.state === 'expired' ? 'text-text-muted' : 'text-text')}>
                  {b.kind === 'prepaid' ? num(b.state === 'expired' ? b.expired_value : b.value_left) : '—'}
                </td>
                <td className={cx(cell, 'text-14 whitespace-nowrap text-text-secondary')}>{dayLabel(b.expires_on)}</td>
                <td className={cell}>
                  <StatusChip tone={s.tone}>{s.label}</StatusChip>
                </td>
                <td className={cx(cell, 'text-right')}>
                  <RowMenu label={`Actions for ${b.name}`} items={[{ key: 'open', label: 'Open', icon: Eye, onClick: () => onOpen(b) }]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------------------------------------- Vouchers */

export function VouchersTable({ vouchers, canManage, onVoid, now }: { vouchers: Voucher[]; canManage: boolean; onVoid: (v: Voucher) => void; now: number }) {
  if (!vouchers.length) return <p className="m-0 px-5 py-8 text-center text-14 text-text-secondary">No voucher matches.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>Code</th>
            <th scope="col" className={head}>Status</th>
            <th scope="col" className={head}>Used at</th>
            <th scope="col" className={cx(head, 'text-right')}>Sale</th>
            <th scope="col" className={cx(head, 'text-right')}>Voucher paid</th>
            <th scope="col" className={cx(head, 'w-12')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => {
            const s = VOUCHER_STATE[v.status];
            const unusedPart = v.sale?.total_amount != null && v.amount_applied != null && v.sale.total_amount > v.amount_applied ? v.sale.total_amount - v.amount_applied : 0;
            return (
              <tr key={v.id}>
                <th scope="row" className={cx(cell, 'text-left font-mono text-13 font-semibold text-text')}>
                  {v.code}
                </th>
                <td className={cell}>
                  <StatusChip tone={s.tone}>{s.label}</StatusChip>
                </td>
                <td className={cell}>
                  {v.status === 'used' ? (
                    <span className="flex flex-col gap-0.5">
                      <span className="text-14 font-semibold text-text">
                        {v.station ?? 'A station'}
                        {v.sale?.pump_number ? ` · Pump ${v.sale.pump_number}` : ''}
                      </span>
                      <span className="text-12 text-text-muted">
                        {[v.used_at ? usedLabel(v.used_at, now) : null, v.sale?.attendant, unusedPart ? `rest RWF ${num(unusedPart)} paid another way` : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  ) : v.status === 'voided' ? (
                    <span className="flex flex-col gap-0.5">
                      <span className="text-14 font-semibold text-text">Voided{v.voided_by ? ` by ${v.voided_by}` : ''}</span>
                      <span className="text-12 text-text-muted">{[v.voided_at ? usedLabel(v.voided_at, now) : null, v.void_reason].filter(Boolean).join(' · ')}</span>
                    </span>
                  ) : (
                    <span className="text-14 text-text-muted">—</span>
                  )}
                </td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{v.sale?.total_amount != null ? num(v.sale.total_amount) : '—'}</td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{v.amount_applied != null ? num(v.amount_applied) : '—'}</td>
                <td className={cx(cell, 'text-right')}>
                  {canManage && v.status === 'unused' ? (
                    <RowMenu label={`Actions for voucher ${v.code}`} items={[{ key: 'void', label: 'Void…', icon: Ban, danger: true, onClick: () => onVoid(v) }]} />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------- Create batch */

export function CreateBatchDrawer({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (b: Batch) => void }) {
  const [today] = useState(() => ymd(Date.now()));
  const [kind, setKind] = useState<'prepaid' | 'promo'>('prepaid');
  const [customerId, setCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [name, setName] = useState('');
  const [count, setCount] = useState('100');
  const [face, setFace] = useState('');
  const [promoKind, setPromoKind] = useState<'per_unit' | 'fixed'>('per_unit');
  const [discount, setDiscount] = useState('');
  const [expires, setExpires] = useState(() => addDays(ymd(Date.now()), 60));
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    listCustomers()
      .then((r) => live && setCustomers(r.data))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open]);

  const n = Number(count || 0);
  const value = parseRwf(face) ?? 0;
  const off = parseRwf(discount) ?? 0;
  const reset = () => {
    setKind('prepaid');
    setCustomerId('');
    setName('');
    setCount('100');
    setFace('');
    setDiscount('');
    setPromoKind('per_unit');
    setExpires(addDays(today, 60));
    setReference('');
    setErrors({});
    setFailure('');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      name: name.trim().length < 2 ? 'Give the batch a name you will recognise.' : undefined,
      count: !(n >= 1 && n <= 1000) ? 'Between 1 and 1,000 vouchers.' : undefined,
      face: kind === 'prepaid' && value < 100 ? 'Enter what each voucher is worth.' : undefined,
      discount: kind === 'promo' && off < 1 ? 'Enter the discount.' : undefined,
      expires: expires < today ? 'Pick a day from today on.' : undefined,
    };
    setErrors(next);
    setFailure('');
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      const b = await createBatch({
        kind,
        customer_id: customerId || null,
        name: name.trim(),
        count: n,
        ...(kind === 'prepaid' ? { face_value: value } : promoKind === 'per_unit' ? { discount_per_unit: off } : { discount_fixed: off }),
        expires_on: expires,
        payment_reference: reference.trim() || null,
      });
      reset();
      onDone(b);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The batch could not be created.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={() => (reset(), onClose())}
      size={460}
      title="Create voucher batch"
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={() => (reset(), onClose())}>
            Cancel
          </Button>
          <Button kind="primary" icon={Ticket} htmlType="submit" form="create-batch" loading={saving}>
            {n >= 1 ? `Create ${num(n)} ${n === 1 ? 'voucher' : 'vouchers'}` : 'Create vouchers'}
          </Button>
        </div>
      }
    >
      <form id="create-batch" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">Each voucher gets its own code and QR. Print the sheet and hand them out.</p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <div className="flex flex-col gap-2">
          <span id="batch-kind" className="text-14 font-medium text-text-secondary">
            Kind
          </span>
          <Segmented
            aria-labelledby="batch-kind"
            block
            value={kind}
            onChange={(v) => setKind(v as 'prepaid' | 'promo')}
            options={[
              { value: 'prepaid', label: 'Prepaid value' },
              { value: 'promo', label: 'Promo discount' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span id="batch-for" className="text-14 font-medium text-text-secondary">
            For
          </span>
          <Select
            aria-labelledby="batch-for"
            size="large"
            value={customerId}
            onChange={setCustomerId}
            showSearch={{ optionFilterProp: 'label' }}
            options={[{ value: '', label: kind === 'promo' ? 'Anyone' : 'No customer' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <span className="text-13 text-text-muted">The customer who paid for them. Promo vouchers can be for anyone.</span>
        </div>
        <TextField label="Batch name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="off" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Number of vouchers" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, '').slice(0, 4))} error={errors.count} inputMode="numeric" mono />
          {kind === 'prepaid' ? (
            <TextField label="Value each, RWF" value={face} onChange={(e) => setFace(e.target.value)} error={errors.face} inputMode="numeric" mono />
          ) : (
            <TextField
              label={promoKind === 'per_unit' ? 'RWF off per litre' : 'RWF off the sale'}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              error={errors.discount}
              inputMode="numeric"
              mono
            />
          )}
        </div>
        {kind === 'promo' ? (
          <Segmented
            aria-label="Discount kind"
            block
            value={promoKind}
            onChange={(v) => setPromoKind(v as 'per_unit' | 'fixed')}
            options={[
              { value: 'per_unit', label: 'Per litre or kWh' },
              { value: 'fixed', label: 'Fixed amount' },
            ]}
          />
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Expires on" type="date" min={today} value={expires} onChange={(e) => setExpires(e.target.value)} error={errors.expires} />
          <TextField label={kind === 'prepaid' ? 'Payment reference' : 'Reference · optional'} value={reference} onChange={(e) => setReference(e.target.value)} mono />
        </div>
        {kind === 'prepaid' ? (
          <div className="flex flex-col gap-2.5 rounded-card bg-surface-muted p-4">
            <div className="flex justify-between text-14 text-text-secondary">
              <span>
                {num(n)} vouchers × {rwf(value)}
              </span>
              <span>single use</span>
            </div>
            <div className="flex items-end justify-between border-t border-border pt-2.5">
              <span className="text-15 font-semibold text-text">Prepaid value</span>
              <span className="font-mono text-20 font-semibold text-text">{rwf(n * value)}</span>
            </div>
          </div>
        ) : null}
        <Banner tone="info" icon={BadgePercent} title={kind === 'prepaid' ? 'Promo vouchers take money off one sale' : 'The customer pays the rest as usual'}>
          {kind === 'prepaid' ? 'Choose Promo discount for RWF per litre or a fixed amount off.' : 'Each code works once. You can extend the batch later if it runs out of time.'}
        </Banner>
      </form>
    </Drawer>
  );
}

/* --------------------------------------------------------- Extend, void */

export function ExtendDrawer({ batch, open, onClose, onDone }: { batch: Pick<Batch, 'id' | 'name' | 'expires_on' | 'unused' | 'state'>; open: boolean; onClose: () => void; onDone: (b: Batch) => void }) {
  const [today] = useState(() => ymd(Date.now()));
  const start = batch.expires_on > today ? batch.expires_on : today;
  const [to, setTo] = useState(() => addDays(start, 30));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (to <= batch.expires_on || to < today) return setError(`Pick a day after ${dayLabel(batch.expires_on)}.`);
    setSaving(true);
    try {
      onDone(await extendBatch(batch.id, to));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The batch could not be extended.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={460}
      title="Extend expiry"
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="primary" icon={CalendarPlus} htmlType="submit" form="extend-batch" loading={saving}>
            Extend to {dayLabel(to)}
          </Button>
        </div>
      }
    >
      <form id="extend-batch" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          {batch.name} {batch.state === 'expired' ? 'expired' : 'expires'} on {dayLabel(batch.expires_on)}.{' '}
          {batch.unused ? `Its ${num(batch.unused)} unused ${batch.unused === 1 ? 'voucher works' : 'vouchers work'} until the new date.` : ''}
        </p>
        <TextField label="New expiry date" type="date" min={addDays(start, 1)} value={to} onChange={(e) => setTo(e.target.value)} error={error} />
        <Banner tone="info" title="A batch can be extended, not shortened">
          To stop vouchers you no longer want, void them instead.
        </Banner>
      </form>
    </Drawer>
  );
}

export function VoidDrawer({
  title,
  intro,
  open,
  onClose,
  onConfirm,
}: {
  title: string;
  intro: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) return setError('Say why, for the record.');
    setSaving(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={460}
      title={title}
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="danger" icon={Ban} htmlType="submit" form="void-vouchers" loading={saving}>
            Void
          </Button>
        </div>
      }
    >
      <form id="void-vouchers" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">{intro}</p>
        <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} error={error} autoFocus />
      </form>
    </Drawer>
  );
}
