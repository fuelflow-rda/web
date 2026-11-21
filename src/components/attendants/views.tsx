'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Drawer, Segmented } from 'antd';
import {
  CircleCheck,
  CircleDashed,
  KeyRound,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  UserPlus,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { Banner, Button, StatusChip, TextField, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { initialsOf } from '@/components/ui/Avatar';
import { PanelError, PanelSkeleton, clock, num, rwf } from '@/components/overview/panels';
import { kigaliWindow } from '@/lib/kigali';
import { cx } from '@/lib/cx';
import { formatMeter, isEvProductType } from '@/lib/product-types';
import { formatRwandaPhone, isValidRwandaPhone, normalizeRwandaPhone } from '@/lib/phone';
import { addAttendant, getAttendantSummary, unlockPin, updateAttendant, type RosterRow, type Summary } from './data';

const STATUS: Record<RosterRow['status'], { label: string; tone: StatusTone; icon: LucideIcon }> = {
  on_shift: { label: 'On shift', tone: 'success', icon: CircleCheck },
  off_shift: { label: 'Off shift', tone: 'neutral', icon: CircleDashed },
  pin_locked: { label: 'PIN locked', tone: 'danger', icon: LockKeyhole },
  deactivated: { label: 'Deactivated', tone: 'neutral', icon: UserX },
};

const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Africa/Kigali' }).format(new Date(iso));

/** "Pump 1, 2", "Chargers 4, 5", or both. */
export function pointsLabel(points: Array<{ number: number; productType: string }>): string {
  const pumps = points.filter((p) => !isEvProductType(p.productType)).map((p) => p.number);
  const chargers = points.filter((p) => isEvProductType(p.productType)).map((p) => p.number);
  const part = (word: string, nums: number[]) =>
    nums.length ? `${word}${nums.length > 1 ? 's' : ''} ${nums.join(', ')}` : null;
  return [part('Pump', pumps), part('Charger', chargers)].filter(Boolean).join(' · ');
}

/** The "current or last shift" cell. */
export function shiftLabel(r: RosterRow): string {
  if (r.status === 'pin_locked' && r.pinLockedAt)
    return `${r.pinFailedAttempts || 5} wrong PIN attempts at ${clock(r.pinLockedAt)}`;
  if (r.openShift) {
    const points = pointsLabel(r.openShift.points);
    return `Since ${clock(r.openShift.startedAt)}${points ? ` · ${points}` : ''}`;
  }
  if (r.lastShift) {
    return `${day(r.lastShift.startedAt)} ${clock(r.lastShift.startedAt)} to ${r.lastShift.endedAt ? clock(r.lastShift.endedAt) : '—'}`;
  }
  return 'No shifts yet';
}

/** Signed litres, as the design shows variance: "−3.2 L", "+0.2 L", "0.0 L". */
export function varianceLabel(v: RosterRow['varianceWeek']): string {
  if (v.shifts === 0) return '—';
  const l = Math.round(v.liters * 10) / 10;
  return `${l < 0 ? '−' : l > 0 ? '+' : ''}${formatMeter(Math.abs(l), 'L')}`;
}

export function RosterTable({ rows, onOpen }: { rows: RosterRow[]; onOpen: (r: RosterRow) => void }) {
  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>
              Attendant
            </th>
            <th scope="col" className={head}>
              Status
            </th>
            <th scope="col" className={head}>
              Current or last shift
            </th>
            <th scope="col" className={cx(head, 'text-right')}>
              Sales today
            </th>
            <th scope="col" className={cx(head, 'text-right')}>
              Revenue today
            </th>
            <th
              scope="col"
              className={cx(head, 'text-right')}
              title="Recorded minus metered over their shifts in the last 7 days"
            >
              7-day variance
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = STATUS[r.status];
            const off = r.varianceWeek.shifts > 0 && Math.abs(r.varianceWeek.liters) > 0.5;
            return (
              <tr
                key={r.id}
                onClick={() => onOpen(r)}
                className="cursor-pointer transition-colors hover:bg-surface-muted"
              >
                <th scope="row" className={cx(cell, 'text-left font-normal')}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(r);
                    }}
                    className={cx(
                      'flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left',
                      focusRing,
                    )}
                  >
                    <span
                      aria-hidden
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-12 font-semibold text-text-secondary"
                    >
                      {initialsOf(r.name)}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-14 font-semibold text-text">{r.name}</span>
                      <span className="font-mono text-12 text-text-muted">{formatRwandaPhone(r.phone)}</span>
                    </span>
                  </button>
                </th>
                <td className={cell}>
                  <StatusChip tone={s.tone} icon={s.icon}>
                    {s.label}
                  </StatusChip>
                </td>
                <td className={cx(cell, 'text-13 text-text-secondary')}>{shiftLabel(r)}</td>
                <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{num(r.salesToday)}</td>
                <td className={cx(cell, 'text-right font-mono text-13 font-semibold text-text')}>
                  {num(r.revenueToday)}
                </td>
                <td
                  className={cx(cell, 'text-right font-mono text-13 font-semibold', off ? 'text-danger' : 'text-text')}
                >
                  {varianceLabel(r.varianceWeek)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- Add attendant */

export function AddAttendantDrawer({
  open,
  station,
  onClose,
  onDone,
}: {
  open: boolean;
  station: { id: string; name: string; companyId: string };
  onClose: () => void;
  onDone: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; pin?: string }>({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setPhone('');
    setPin('');
    setErrors({});
    setFailure('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      name: name.trim().length < 2 ? 'Enter their full name.' : undefined,
      phone: !isValidRwandaPhone(phone) ? 'Enter a Rwandan mobile number such as 078 812 3456.' : undefined,
      pin: !/^\d{4,6}$/.test(pin) ? 'Use 4 to 6 digits.' : undefined,
    };
    setErrors(next);
    setFailure('');
    if (next.name || next.phone || next.pin) return;
    setSaving(true);
    try {
      await addAttendant({
        name: name.trim(),
        phone: normalizeRwandaPhone(phone),
        pin,
        company_id: station.companyId,
        station_id: station.id,
      });
      const added = name.trim();
      reset();
      onDone(added);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The attendant could not be added.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size={460}
      title="Add attendant"
      footer={
        <div className="flex gap-2.5 py-1">
          <Button kind="ghost" onClick={() => (reset(), onClose())}>
            Cancel
          </Button>
          <Button kind="primary" icon={UserPlus} htmlType="submit" form="add-attendant" loading={saving}>
            Add attendant
          </Button>
        </div>
      }
    >
      <form id="add-attendant" onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <p className="m-0 -mt-1 text-14 text-text-secondary">
          They sign in on the Relai app with this phone number and PIN. {station.name} only.
        </p>
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <TextField
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="off"
          autoFocus
        />
        <TextField
          label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          hint="Rwandan mobile number, 10 digits"
          inputMode="tel"
          mono
          autoComplete="off"
        />
        <TextField
          label="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          error={errors.pin}
          hint="4 to 6 digits. Share it in person, never by message."
          inputMode="numeric"
          type="password"
          mono
          autoComplete="new-password"
        />
        <TextField
          label="Station"
          value={station.name}
          readOnly
          hint="Station managers can only add attendants to their own station"
        />
        <Banner tone="info" icon={ShieldCheck} title="Five wrong PINs lock the account">
          A manager can unlock it and set a new PIN from this page.
        </Banner>
      </form>
    </Drawer>
  );
}

/* ---------------------------------------------------------------- One attendant */

const PERIODS = [
  { value: 1, label: 'Today' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
];

export function AttendantDrawer({
  row,
  stationId,
  canManage,
  onClose,
  onChanged,
}: {
  row: RosterRow | null;
  stationId: string;
  canManage: boolean;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const [days, setDays] = useState(1);
  const [summary, setSummary] = useState<{ key: string; data: Summary | null; error: string | null } | null>(null);
  const [mode, setMode] = useState<'view' | 'pin' | 'edit'>('view');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const key = row ? `${row.id}|${days}` : null;

  const [lastId, setLastId] = useState<string | null>(null);
  if ((row?.id ?? null) !== lastId) {
    setLastId(row?.id ?? null);
    setMode('view');
    setPin('');
    setProblem('');
    setDays(1);
  }

  useEffect(() => {
    if (!row || !key) return;
    let live = true;
    getAttendantSummary(stationId, row.id, kigaliWindow({ days }).from)
      .then((data) => live && setSummary({ key, data, error: null }))
      .catch((err: Error) => live && setSummary({ key, data: null, error: err.message }));
    return () => {
      live = false;
    };
  }, [row, days, key, stationId]);
  const current = summary?.key === key ? summary : null;

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setSaving(true);
    setProblem('');
    try {
      await fn();
      setMode('view');
      setPin('');
      onChanged(done);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'That did not work. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!row) return <Drawer open={false} onClose={onClose} />;
  const s = STATUS[row.status];
  const locked = row.status === 'pin_locked';

  return (
    <Drawer open onClose={onClose} size={460} title={row.name}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-14 text-text-secondary">{formatRwandaPhone(row.phone)}</span>
          <StatusChip tone={s.tone} icon={s.icon}>
            {s.label}
          </StatusChip>
        </div>
        <p className="m-0 text-13 text-text-muted">{shiftLabel(row)}</p>

        {locked ? (
          <Banner tone="danger" icon={LockKeyhole} title="Locked after five wrong PINs">
            They cannot sign in until you unlock the account. Setting a new PIN is safer if someone else may have tried
            theirs.
          </Banner>
        ) : null}
        {problem ? <Banner tone="danger" title={problem} /> : null}

        {canManage && mode === 'view' ? (
          <div className="flex flex-wrap gap-2">
            {locked ? (
              <Button
                kind="primary"
                icon={KeyRound}
                onClick={() => act(() => unlockPin(row.id), `${row.name} can sign in again.`)}
                loading={saving}
              >
                Unlock
              </Button>
            ) : null}
            <Button icon={KeyRound} onClick={() => setMode('pin')}>
              {locked ? 'Unlock with a new PIN' : 'Set a new PIN'}
            </Button>
            <Button
              icon={Pencil}
              onClick={() => (setName(row.name), setPhone(formatRwandaPhone(row.phone)), setMode('edit'))}
            >
              Edit
            </Button>
            <Button
              kind={row.isActive ? 'danger' : 'secondary'}
              icon={UserX}
              onClick={() =>
                act(
                  () => updateAttendant(row.id, { is_active: !row.isActive }),
                  row.isActive ? `${row.name} is deactivated.` : `${row.name} is active again.`,
                )
              }
              loading={saving}
            >
              {row.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ) : null}

        {mode === 'pin' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{4,6}$/.test(pin)) return setProblem('Use 4 to 6 digits.');
              void act(
                () => (locked ? unlockPin(row.id, pin) : updateAttendant(row.id, { pin })),
                `New PIN set for ${row.name}. Tell them in person.`,
              );
            }}
            noValidate
            className="flex flex-col gap-3 rounded-control border border-border p-4"
          >
            <TextField
              label="New PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              hint="4 to 6 digits. Share it in person, never by message."
              inputMode="numeric"
              type="password"
              mono
              autoComplete="new-password"
              autoFocus
            />
            <div className="flex gap-2">
              <Button kind="primary" htmlType="submit" loading={saving}>
                {locked ? 'Unlock and set PIN' : 'Set PIN'}
              </Button>
              <Button kind="ghost" onClick={() => setMode('view')}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {mode === 'edit' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2) return setProblem('Enter their full name.');
              if (!isValidRwandaPhone(phone)) return setProblem('Enter a Rwandan mobile number such as 078 812 3456.');
              void act(
                () => updateAttendant(row.id, { name: name.trim(), phone: normalizeRwandaPhone(phone) }),
                `${name.trim()} is updated.`,
              );
            }}
            noValidate
            className="flex flex-col gap-3 rounded-control border border-border p-4"
          >
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              mono
              hint="Changing it changes what they sign in with."
            />
            <div className="flex gap-2">
              <Button kind="primary" htmlType="submit" loading={saving}>
                Save
              </Button>
              <Button kind="ghost" onClick={() => setMode('view')}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        <section aria-label="Sales" className="flex flex-col gap-3 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="m-0 text-15 font-semibold text-text">Sales</h3>
            <Segmented
              aria-label="Period"
              size="small"
              value={days}
              onChange={(v) => setDays(Number(v))}
              options={PERIODS}
            />
          </div>
          {current?.error ? (
            <PanelError message="Their sales could not be loaded." onRetry={() => setSummary(null)} />
          ) : !current?.data ? (
            <PanelSkeleton rows={2} />
          ) : (
            <dl className="m-0 grid grid-cols-2 gap-4">
              {(
                [
                  ['Sales', num(current.data.sales)],
                  ['Revenue', rwf(current.data.revenue)],
                  ['Fuel', formatMeter(current.data.liters, 'L')],
                  ['Energy', formatMeter(current.data.kwh, 'KWH')],
                  ['Average ticket', current.data.sales ? rwf(current.data.revenue / current.data.sales) : '—'],
                  ['Voided', num(current.data.voided)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="font-mono text-10 font-medium tracking-p80 text-text-muted uppercase">{k}</dt>
                  <dd className="m-0 font-mono text-15 font-semibold text-text">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="m-0 text-12 text-text-muted">
            7-day meter variance: <span className="font-mono">{varianceLabel(row.varianceWeek)}</span> over{' '}
            {row.varianceWeek.shifts} measured {row.varianceWeek.shifts === 1 ? 'shift' : 'shifts'}. Negative means fuel
            left pumps without a sale.
          </p>
        </section>
      </div>
    </Drawer>
  );
}
