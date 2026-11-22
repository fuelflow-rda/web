'use client';

import { useState, type FormEvent } from 'react';
import { Drawer, Segmented } from 'antd';
import { Check, Eye, IdCard, Lock, Plus, Printer, QrCode, Wallet } from 'lucide-react';
import { Banner, Button, RowMenu, StatusChip, Tag, TextField, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { cx } from '@/lib/cx';
import { ymd } from '@/lib/kigali';
import { num, rwf } from '@/components/overview/panels';
import { lastSale } from '@/components/pumps/views';
import { productCode, productColor, productName } from '@/lib/product-types';
import {
  createCard,
  createCustomer,
  discountWords,
  recordTopUp,
  updateCard,
  updateCustomer,
  type Card,
  type Customer,
  type CustomerRow,
  type CustomerState,
  type Discount,
  type Statement,
} from './types';

const head = 'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

export const STATE: Record<CustomerState, { tone: StatusTone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  low_balance: { tone: 'warning', label: 'Low balance' },
  empty: { tone: 'danger', label: 'No balance' },
  suspended: { tone: 'neutral', label: 'Suspended' },
};

/** Products a discount can be given on, in the order the drawer lists them. */
export const DISCOUNT_PRODUCTS = ['GASOLINE', 'DIESEL', 'EV_AC', 'EV_DC_FAST'] as const;

/** "Today 09:14", "Yesterday", "Thu 19 Nov", "Never": when something last happened. */
export function usedLabel(iso: string | null, now: number): string {
  const d = lastSale(iso, now);
  return /^\d{2}:\d{2}$/.test(d) ? `Today ${d}` : d;
}

/** Whole RWF from what a person typed: "1,000,000" → 1000000; empty → null. */
export function parseRwf(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

/* ----------------------------------------------------------------- List */

export function CustomersTable({ rows, onOpen, now }: { rows: CustomerRow[]; onOpen: (r: CustomerRow) => void; now: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-240 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>Customer</th>
            <th scope="col" className={cx(head, 'text-right')}>Cards</th>
            <th scope="col" className={head}>Discount</th>
            <th scope="col" className={cx(head, 'text-right')}>Balance</th>
            <th scope="col" className={cx(head, 'text-right')}>This month</th>
            <th scope="col" className={head}>Last used</th>
            <th scope="col" className={head}>Status</th>
            <th scope="col" className={cx(head, 'w-12')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = STATE[r.state];
            return (
              <tr key={r.id} onClick={() => onOpen(r)} className="cursor-pointer transition-colors hover:bg-surface-muted">
                <th scope="row" className={cx(cell, 'text-left font-normal')}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(r);
                    }}
                    className={cx('flex cursor-pointer flex-col items-start gap-0.5 border-0 bg-transparent p-0 text-left', focusRing)}
                  >
                    <span className="text-14 font-semibold text-text">{r.name}</span>
                    <span className="text-12 text-text-muted">
                      {r.kind === 'person' ? 'Person' : 'Company'}
                      {r.contact_name ? ` · ${r.contact_name}` : r.phone ? ` · ${r.phone}` : ''}
                    </span>
                  </button>
                </th>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{r.active_cards}</td>
                <td className={cx(cell, 'text-14 text-text-secondary')}>{discountWords(r.discounts)}</td>
                <td
                  className={cx(
                    cell,
                    'text-right font-mono text-13 font-semibold',
                    r.state === 'empty' ? 'text-danger' : r.state === 'low_balance' ? 'text-warning' : 'text-text',
                  )}
                >
                  {num(r.balance)}
                </td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{num(r.month_sales)}</td>
                <td className={cx(cell, 'text-14 whitespace-nowrap text-text-secondary')}>{usedLabel(r.last_used_at, now)}</td>
                <td className={cell}>
                  <StatusChip tone={s.tone}>{s.label}</StatusChip>
                </td>
                <td className={cx(cell, 'text-right')}>
                  <RowMenu label={`Actions for ${r.name}`} items={[{ key: 'open', label: 'Open', icon: Eye, onClick: () => onOpen(r) }]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------- Add customer */

export function DiscountGrid({ value, onChange }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2.5 p-0 text-14 font-medium text-text-secondary">Discount per litre or kWh</legend>
      <div className="flex flex-col rounded-control border border-border bg-surface">
        {DISCOUNT_PRODUCTS.map((p, i) => (
          <label key={p} className={cx('flex items-center gap-2.5 px-3 py-2', i > 0 && 'border-t border-border')}>
            <Tag color={productColor(p)}>{productCode(p)}</Tag>
            <span className="flex-1 text-14 text-text">{productName(p)}</span>
            <input
              aria-label={`${productName(p)} discount`}
              inputMode="numeric"
              value={value[p] ?? ''}
              placeholder="0"
              onChange={(e) => onChange({ ...value, [p]: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              className={cx(
                'w-24 rounded-control border border-border-strong bg-bg px-2.5 py-1.5 text-right font-mono text-14 text-text placeholder:text-text-muted',
                focusRing,
              )}
            />
            <span className="w-14 font-mono text-12 text-text-muted">{p.startsWith('EV') ? 'RWF/kWh' : 'RWF/L'}</span>
          </label>
        ))}
      </div>
      <p className="m-0 text-13 text-text-muted">Taken off the pump price on every sale with their card, at every station.</p>
    </fieldset>
  );
}

export const discountsFrom = (grid: Record<string, string>): Discount[] =>
  DISCOUNT_PRODUCTS.map((p) => ({ product_type: p, amount_per_unit: Number(grid[p] || 0) })).filter((d) => d.amount_per_unit > 0);

export function AddCustomerDrawer({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (c: Customer) => void }) {
  const [kind, setKind] = useState<'company' | 'person'>('company');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState('');
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>();
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setKind('company');
    setName('');
    setContact('');
    setPhone('');
    setEmail('');
    setAlert('');
    setGrid({});
    setError(undefined);
    setFailure('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Enter the customer’s name.');
    setError(undefined);
    setFailure('');
    setSaving(true);
    try {
      const c = await createCustomer({
        kind,
        name: name.trim(),
        contact_name: contact.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        low_balance_alert: parseRwf(alert),
        discounts: discountsFrom(grid),
      });
      reset();
      onDone(c);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The customer could not be added.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={() => (reset(), onClose())}
      size={460}
      title="Add customer"
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={() => (reset(), onClose())}>
            Cancel
          </Button>
          <Button kind="primary" icon={Plus} htmlType="submit" form="add-customer" loading={saving}>
            Add customer
          </Button>
        </div>
      }
    >
      <form id="add-customer" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">A company, institution or person. Their cards share one prepaid balance.</p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <div className="flex flex-col gap-2">
          <span id="customer-kind" className="text-14 font-medium text-text-secondary">
            Customer type
          </span>
          <Segmented
            aria-labelledby="customer-kind"
            block
            value={kind}
            onChange={(v) => setKind(v as 'company' | 'person')}
            options={[
              { value: 'company', label: 'Company or institution' },
              { value: 'person', label: 'Person' },
            ]}
          />
        </div>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="off" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" />
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" mono autoComplete="off" />
        </div>
        <TextField
          label="Email · optional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="Statements and low-balance alerts go here"
          inputMode="email"
          autoComplete="off"
        />
        <DiscountGrid value={grid} onChange={setGrid} />
        <TextField
          label="Alert managers below, RWF · optional"
          value={alert}
          onChange={(e) => setAlert(e.target.value)}
          inputMode="numeric"
          mono
          autoComplete="off"
        />
        <Banner tone="info" icon={Wallet} title="The balance starts at RWF 0">
          Record a top-up when the customer pays, then add their cards.
        </Banner>
      </form>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ Cards */

const CARD_STATE = (c: Card): { tone: StatusTone; label: string } =>
  c.status === 'deactivated'
    ? { tone: 'danger', label: 'Deactivated' }
    : c.daily_limit != null && c.used_today >= c.daily_limit
      ? { tone: 'warning', label: 'Limit reached' }
      : { tone: 'success', label: 'Active' };

export function CardsTable({
  cards,
  canManage,
  onStop,
  onReactivate,
  onPrint,
  now,
}: {
  cards: Card[];
  canManage: boolean;
  onStop: (c: Card) => void;
  onReactivate: (c: Card) => void;
  onPrint: (c: Card) => void;
  now: number;
}) {
  if (!cards.length) return <p className="m-0 px-5 py-8 text-center text-14 text-text-secondary">No cards yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-170 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>Card</th>
            <th scope="col" className={head}>Vehicle</th>
            <th scope="col" className={cx(head, 'text-right')}>Limit / day</th>
            <th scope="col" className={cx(head, 'text-right')}>Used today</th>
            <th scope="col" className={head}>Status</th>
            <th scope="col" className={cx(head, 'w-12')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => {
            const s = CARD_STATE(c);
            const sub =
              c.status === 'deactivated'
                ? `Stopped${c.deactivated_reason ? `: ${c.deactivated_reason}` : ''}`
                : `${c.holder_name ? 'Driver' : 'Pool card'} · ${c.last_used_at ? `used ${usedLabel(c.last_used_at, now).toLowerCase()}` : 'not used yet'}`;
            return (
              <tr key={c.id}>
                <th scope="row" className={cx(cell, 'text-left font-normal')}>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-14 font-semibold text-text">
                      <span className="font-mono">{c.label}</span>
                      {c.holder_name ? ` · ${c.holder_name}` : ''}
                    </span>
                    <span className="text-12 text-text-muted">{sub}</span>
                  </span>
                </th>
                <td className={cx(cell, 'font-mono text-13 text-text')}>{c.vehicle_plate ?? '—'}</td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{c.daily_limit != null ? num(c.daily_limit) : '—'}</td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{num(c.used_today)}</td>
                <td className={cell}>
                  <StatusChip tone={s.tone}>{s.label}</StatusChip>
                </td>
                <td className={cx(cell, 'text-right')}>
                  <RowMenu
                    label={`Actions for card ${c.label}`}
                    items={[
                      { key: 'print', label: 'Print card', icon: Printer, onClick: () => onPrint(c) },
                      ...(canManage
                        ? c.status === 'active'
                          ? [{ key: 'stop', label: 'Stop card…', icon: Lock, danger: true, onClick: () => onStop(c) }]
                          : [{ key: 'on', label: 'Reactivate', icon: Check, onClick: () => onReactivate(c) }]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AddCardDrawer({
  customer,
  open,
  companyName,
  onClose,
  onDone,
}: {
  customer: Pick<Customer, 'id' | 'name' | 'discounts'>;
  open: boolean;
  companyName: string;
  onClose: () => void;
  onDone: (c: Card) => void;
}) {
  const [holder, setHolder] = useState('');
  const [plate, setPlate] = useState('');
  const [daily, setDaily] = useState('');
  const [monthly, setMonthly] = useState('');
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const reset = () => {
    setHolder('');
    setPlate('');
    setDaily('');
    setMonthly('');
    setFailure('');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFailure('');
    setSaving(true);
    try {
      const c = await createCard(customer.id, {
        holder_name: holder.trim() || null,
        vehicle_plate: plate.trim() || null,
        daily_limit: parseRwf(daily),
        monthly_limit: parseRwf(monthly),
      });
      reset();
      onDone(c);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The card could not be created.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={() => (reset(), onClose())}
      size={460}
      title="Add card"
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={() => (reset(), onClose())}>
            Cancel
          </Button>
          <Button kind="primary" icon={IdCard} htmlType="submit" form="add-card" loading={saving}>
            Create card
          </Button>
        </div>
      }
    >
      <form id="add-card" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          For {customer.name}. It pays from their balance{customer.discounts.length ? ` and gets ${discountWords(customer.discounts).split(' · ')[0]} off` : ''}.
        </p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <CardFace companyName={companyName} customerName={customer.name} plate={plate.trim().toUpperCase() || null} code="Code given on save" />
        <TextField
          label="Card holder · optional"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          hint="A driver’s name, or leave empty for a pool card"
          autoComplete="off"
        />
        <TextField
          label="Vehicle plate · optional"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          hint="If set, the card works only for this vehicle. The attendant sees the plate at the pump."
          mono
          autoComplete="off"
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Daily limit, RWF" value={daily} onChange={(e) => setDaily(e.target.value)} inputMode="numeric" mono />
          <TextField label="Monthly limit, RWF" value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" mono />
        </div>
        <Banner tone="info" icon={Printer} title="Works as soon as you save">
          Print the card, or give the customer the code. Lost cards are stopped from this page.
        </Banner>
      </form>
    </Drawer>
  );
}

/** The card as printed: forest gradient, the company, the customer and the plate. */
export function CardFace({ companyName, customerName, plate, code }: { companyName: string; customerName: string; plate: string | null; code: string }) {
  return (
    <div className="flex h-59 flex-col justify-between rounded-card bg-linear-135 from-sidebar-selected to-sidebar-bg p-5.5" aria-label="Card preview">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-18 font-semibold text-sidebar-text">{companyName}</span>
          <span className="type-overline font-mono text-11 text-sidebar-indicator">Member card</span>
        </div>
        <span className="grid size-19 place-items-center rounded-control bg-sidebar-text text-sidebar-bg">
          <QrCode size={60} aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-16 font-semibold text-sidebar-text">{customerName}</span>
        <span className="flex justify-between font-mono text-13 text-sidebar-text-secondary">
          <span>{code}</span>
          <span>{plate ?? ''}</span>
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Top-up */

export function TopUpDrawer({
  customer,
  open,
  onClose,
  onDone,
}: {
  customer: Pick<Customer, 'id' | 'name' | 'balance'>;
  open: boolean;
  onClose: () => void;
  onDone: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'momo' | 'cash'>('bank');
  const [reference, setReference] = useState('');
  const [today] = useState(() => ymd(Date.now()));
  const [received, setReceived] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const value = parseRwf(amount);
  const reset = () => {
    setAmount('');
    setMethod('bank');
    setReference('');
    setReceived(today);
    setNote('');
    setError(undefined);
    setFailure('');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value) return setError('Enter the amount received.');
    setError(undefined);
    setFailure('');
    setSaving(true);
    try {
      await recordTopUp(customer.id, { amount: value, method, reference: reference.trim() || null, received_on: received, note: note.trim() || null });
      reset();
      onDone(value);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The top-up could not be recorded.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={() => (reset(), onClose())}
      size={460}
      title="Record top-up"
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={() => (reset(), onClose())}>
            Cancel
          </Button>
          <Button kind="primary" icon={Check} htmlType="submit" form="top-up" loading={saving}>
            Record top-up
          </Button>
        </div>
      }
    >
      <form id="top-up" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          Money {customer.name} has paid in. It is added to the balance their cards spend.
        </p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <TextField
          label="Amount, RWF"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ''))}
          error={error}
          inputMode="numeric"
          mono
          autoFocus
          autoComplete="off"
        />
        <div className="flex flex-col gap-2">
          <span id="topup-method" className="text-14 font-medium text-text-secondary">
            Received by
          </span>
          <Segmented
            aria-labelledby="topup-method"
            block
            value={method}
            onChange={(v) => setMethod(v as 'bank' | 'momo' | 'cash')}
            options={[
              { value: 'bank', label: 'Bank transfer' },
              { value: 'momo', label: 'MoMo' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} hint="From the bank or MoMo receipt" mono />
          <TextField label="Date received" type="date" value={received} max={today} onChange={(e) => setReceived(e.target.value)} />
        </div>
        <TextField label="Note · optional" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-col gap-2.5 rounded-card bg-surface-muted p-4">
          <div className="flex justify-between text-14 text-text-secondary">
            <span>Balance now</span>
            <span className="font-mono">{rwf(customer.balance)}</span>
          </div>
          <div className="flex justify-between text-14 text-text-secondary">
            <span>Top-up</span>
            <span className="font-mono text-success">+{rwf(value ?? 0)}</span>
          </div>
          <div className="flex items-end justify-between border-t border-border pt-2.5">
            <span className="text-15 font-semibold text-text">Balance after</span>
            <span className="font-mono text-20 font-semibold text-text">{rwf(customer.balance + (value ?? 0))}</span>
          </div>
        </div>
        <Banner tone="warning" icon={Lock} title="Top-ups cannot be deleted">
          A mistake is corrected with an adjustment and a reason. Both appear on the statement and in the audit log.
        </Banner>
      </form>
    </Drawer>
  );
}

/* -------------------------------------------------------------- Statement */

const ENTRY_TITLE: Record<string, string> = { topup: 'Top-up', refund: 'Refund of an undone sale', adjustment: 'Adjustment' };
const METHOD: Record<string, string> = { bank: 'bank transfer', momo: 'MoMo', cash: 'cash' };

export function StatementTable({ statement, now }: { statement: Statement; now: number }) {
  const rows = [...statement.entries].reverse();
  if (!rows.length) return <p className="m-0 px-5 py-8 text-center text-14 text-text-secondary">Nothing in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-170 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>Date</th>
            <th scope="col" className={head}>Detail</th>
            <th scope="col" className={cx(head, 'text-right')}>Litres</th>
            <th scope="col" className={cx(head, 'text-right')}>Discount</th>
            <th scope="col" className={cx(head, 'text-right')}>Amount</th>
            <th scope="col" className={cx(head, 'text-right')}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const s = e.sale;
            const title = s ? `${s.station ?? 'Station'}${s.pump_number ? ` · Pump ${s.pump_number}` : ''}` : `${ENTRY_TITLE[e.kind]}${e.method ? ` · ${METHOD[e.method]}` : ''}`;
            const sub = s
              ? [s.card, s.vehicle_plate, s.attendant].filter(Boolean).join(' · ')
              : [e.reference, e.note].filter(Boolean).join(' · ') || ' ';
            return (
              <tr key={e.id}>
                <td className={cx(cell, 'text-14 whitespace-nowrap text-text-secondary')}>{usedLabel(e.at, now)}</td>
                <th scope="row" className={cx(cell, 'text-left font-normal')}>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-14 font-semibold text-text">{title}</span>
                    <span className="text-12 text-text-muted">{sub}</span>
                  </span>
                </th>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{s ? s.quantity.toFixed(1) : '—'}</td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{s ? num(s.discount_amount) : '—'}</td>
                <td className={cx(cell, 'text-right font-mono text-13 font-semibold', e.amount > 0 ? 'text-success' : 'text-text')}>
                  {e.amount > 0 ? '+' : '−'}
                  {num(Math.abs(e.amount))}
                </td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{num(e.balance_after)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


/* -------------------------------------------------------------- Edit, stop */

export function EditCustomerDrawer({
  customer,
  open,
  onClose,
  onDone,
}: {
  customer: Customer;
  open: boolean;
  onClose: () => void;
  onDone: (c: Customer) => void;
}) {
  const initialGrid = () => Object.fromEntries(customer.discounts.map((d) => [d.product_type, String(d.amount_per_unit)]));
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.contact_name ?? '');
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [tin, setTin] = useState(customer.tin ?? '');
  const [alert, setAlert] = useState(customer.low_balance_alert != null ? num(customer.low_balance_alert) : '');
  const [grid, setGrid] = useState<Record<string, string>>(initialGrid);
  const [suspended, setSuspended] = useState(customer.status === 'suspended');
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFailure('');
    setSaving(true);
    try {
      const c = await updateCustomer(customer.id, {
        name: name.trim(),
        contact_name: contact.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        tin: tin.replace(/\s/g, '') || null,
        low_balance_alert: parseRwf(alert),
        discounts: DISCOUNT_PRODUCTS.map((p) => ({ product_type: p, amount_per_unit: Number(grid[p] || 0) })),
        status: suspended ? 'suspended' : 'active',
      });
      onDone(c);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The changes could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={460}
      title="Edit customer"
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="primary" icon={Check} htmlType="submit" form="edit-customer" loading={saving}>
            Save
          </Button>
        </div>
      }
    >
      <form id="edit-customer" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" />
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" mono autoComplete="off" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="off" />
          <TextField label="TIN" value={tin} onChange={(e) => setTin(e.target.value)} hint="9 digits" inputMode="numeric" mono />
        </div>
        <DiscountGrid value={grid} onChange={setGrid} />
        <TextField label="Alert managers below, RWF" value={alert} onChange={(e) => setAlert(e.target.value)} inputMode="numeric" mono />
        <label className="flex items-start gap-3 rounded-card border border-border p-4">
          <input type="checkbox" checked={suspended} onChange={(e) => setSuspended(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
          <span className="flex flex-col gap-0.5">
            <span className="text-14 font-semibold text-text">Suspend this customer</span>
            <span className="text-13 text-text-secondary">Their cards stop working until you turn this off. The balance is kept.</span>
          </span>
        </label>
      </form>
    </Drawer>
  );
}

export function StopCardDrawer({
  customerId,
  card,
  onClose,
  onDone,
}: {
  customerId: string;
  card: Card | null;
  onClose: () => void;
  onDone: (c: Card) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!card) return;
    if (reason.trim().length < 3) return setError('Say why, for the record: lost, stolen, driver left…');
    setSaving(true);
    try {
      const c = await updateCard(customerId, card.id, { status: 'deactivated', reason: reason.trim() });
      setReason('');
      setError(undefined);
      onDone(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The card could not be stopped.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={!!card}
      onClose={onClose}
      size={460}
      title={card ? `Stop card ${card.label}` : 'Stop card'}
      footer={
        <div className="flex justify-end gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="danger" icon={Lock} htmlType="submit" form="stop-card" loading={saving}>
            Stop card
          </Button>
        </div>
      }
    >
      <form id="stop-card" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          It is refused at the pump at once. Phones without signal stop it at their next sync; a sale made before then is flagged
          for you.
        </p>
        <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} error={error} autoFocus />
      </form>
    </Drawer>
  );
}
