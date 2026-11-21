'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Drawer, Dropdown, Input, InputNumber, Modal, Segmented, Select } from 'antd';
import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  Ellipsis,
  Info,
  ScrollText,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Banner, Button, StatusChip, Tag, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { BarChart } from '@/components/overview/BarChart';
import { PanelError, PanelSkeleton, clock, num, rwf } from '@/components/overview/panels';
import { kigaliWindow } from '@/lib/kigali';
import { cx } from '@/lib/cx';
import {
  CONNECTOR_TYPES,
  PRODUCT_TYPES,
  connectorShort,
  formatMeter,
  isEvProductType,
  pointLabel,
  productCode,
  productColor,
  productName,
} from '@/lib/product-types';
import {
  addPoint,
  endMaintenance,
  getLog,
  getSeries,
  nextNumber,
  startMaintenance,
  type Maintenance,
  type Point,
  type PumpSeries,
} from './data';

const LIVE: Record<Point['status'], { label: string; tone: StatusTone; icon: LucideIcon }> = {
  in_use: { label: 'In use', tone: 'success', icon: CircleCheck },
  idle: { label: 'Idle', tone: 'success', icon: CircleCheck },
  charging: { label: 'Charging', tone: 'info', icon: Info },
  available: { label: 'Available', tone: 'success', icon: CircleCheck },
  offline: { label: 'Offline', tone: 'neutral', icon: CircleDashed },
};

const one = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const kigaliDay = (iso: string) => new Date(Date.parse(iso) + 2 * 3600_000).toISOString().slice(0, 10);
export const sinceLabel = (iso: string, now = Date.now()) => {
  const today = kigaliDay(new Date(now).toISOString());
  if (kigaliDay(iso) === today) return clock(iso);
  if (kigaliDay(iso) === kigaliDay(new Date(now - 86_400_000).toISOString())) return `yesterday at ${clock(iso)}`;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));
};
/** The card's "Last sale": a time today, "Yesterday", or the day alone, so it fits its column. */
export const lastSale = (iso: string | null, now: number) => {
  if (!iso) return 'Never';
  const d = sinceLabel(iso, now);
  if (d.startsWith('yesterday')) return 'Yesterday';
  if (/^\d{2}:\d{2}$/.test(d)) return d;
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Kigali' }).format(
    new Date(iso),
  );
};

/** The card's line under the name: product and price, plus connector and power for a charger. */
export function pointMeta(p: Point): string {
  const name = productName(p.product_type).replace(/^EV · /, '');
  const price =
    p.price_per_unit === null ? 'no price set' : `${rwf(p.price_per_unit)} per ${p.unit === 'KWH' ? 'kWh' : 'litre'}`;
  if (p.kind === 'charger') {
    return [name, connectorShort(p.connector_type), p.power_kw ? `${num(p.power_kw)} kW` : null, price]
      .filter(Boolean)
      .join(' · ');
  }
  return `${name} · ${price}`;
}

export function PointCard({
  point,
  now,
  canManage,
  onReport,
  onStart,
  onEnd,
  onLog,
}: {
  point: Point;
  now: number;
  canManage: boolean;
  onReport: () => void;
  onStart: () => void;
  onEnd: () => void;
  onLog: () => void;
}) {
  const s = LIVE[point.status];
  const label = pointLabel(point.pump_number, point.product_type);
  const menu = [
    ...(canManage
      ? point.maintenance
        ? [{ key: 'end', label: 'Put back in service', icon: <CircleCheck size={16} aria-hidden />, onClick: onEnd }]
        : [
            {
              key: 'start',
              label: 'Take out for maintenance',
              icon: <Wrench size={16} aria-hidden />,
              onClick: onStart,
            },
          ]
      : []),
    { key: 'log', label: 'Maintenance log', icon: <ScrollText size={16} aria-hidden />, onClick: onLog },
  ];
  return (
    <article
      aria-label={label}
      className="flex min-w-0 flex-col gap-4.5 rounded-card border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3 className="m-0 truncate text-18 font-semibold text-text">{label}</h3>
          <Tag color={productColor(point.product_type)} className="whitespace-nowrap">
            {productCode(point.product_type)}
          </Tag>
        </div>
        <StatusChip tone={s.tone} icon={s.icon}>
          {s.label}
        </StatusChip>
      </div>
      <p className="m-0 -mt-2.5 truncate text-13 text-text-muted">{pointMeta(point)}</p>
      <div className="flex flex-col gap-1.5">
        <span className="type-overline text-text-muted">
          {point.kind === 'charger' ? 'Delivered today' : 'Dispensed today'}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-30 leading-none font-medium tracking-n20 text-text">
            {one(point.today.quantity)}
          </span>
          <span className="text-14 font-medium text-text-secondary">{point.unit === 'KWH' ? 'kWh' : 'L'}</span>
        </span>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-3 border-t border-border pt-3.5">
        {(
          [
            ['Totaliser', point.last_reading === null ? '—' : one(point.last_reading)],
            ['Revenue', num(point.today.revenue)],
            ['Last sale', lastSale(point.last_sale_at, now)],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="flex min-w-0 flex-col gap-1">
            <dt className="font-mono text-10 font-medium tracking-p80 text-text-muted uppercase">{k}</dt>
            <dd className="m-0 truncate font-mono text-14 font-medium text-text">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onReport}
          className={cx(
            'inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-13 font-medium text-link hover:underline',
            focusRing,
          )}
        >
          Open pump report <ArrowRight size={14} aria-hidden />
        </button>
        <Dropdown trigger={['click']} menu={{ items: menu }} placement="bottomRight">
          <button
            type="button"
            aria-label={`More for ${label}`}
            className={cx(
              'inline-flex size-7 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-text-muted hover:bg-surface-muted hover:text-text',
              focusRing,
            )}
          >
            <Ellipsis size={18} aria-hidden />
          </button>
        </Dropdown>
      </div>
    </article>
  );
}

/** One banner per point out of service: since when, who, why, and what it means for tonight. */
export function MaintenanceBanners({ points, now, onLog }: { points: Point[]; now: number; onLog: () => void }) {
  const out = points.filter((p) => p.maintenance);
  return (
    <>
      {out.map((p) => (
        <Banner
          key={p.id}
          tone="warning"
          icon={Wrench}
          title={`${pointLabel(p.pump_number, p.product_type)} has been offline since ${sinceLabel(p.maintenance!.startedAt, now)}`}
          action={{ label: 'View maintenance log', onClick: onLog }}
        >
          {`Taken out for maintenance${p.maintenance!.startedBy ? ` by ${p.maintenance!.startedBy}` : ''}: ${p.maintenance!.reason}. It shows as Offline in reconciliation until it is back in service.`}
        </Banner>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- Dialogs */

export function StartMaintenanceModal({
  point,
  onClose,
  onDone,
}: {
  point: Point | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const label = point ? pointLabel(point.pump_number, point.product_type) : '';
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!point) return;
    if (reason.trim().length < 3) return setProblem('Say what is wrong, so whoever fixes it knows.');
    setSaving(true);
    try {
      await startMaintenance(point.id, reason.trim());
      setReason('');
      onDone();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'It could not be taken out of service.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open={point !== null}
      onCancel={onClose}
      title={`Take ${label} out for maintenance`}
      okText="Take out of service"
      onOk={() => submit()}
      confirmLoading={saving}
      destroyOnHidden
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-2">
        <p className="m-0 mb-2 text-14 text-text-secondary">
          Attendants will not be able to record sales on it until it is put back in service.
        </p>
        <label htmlFor="mx-reason" className="text-13 font-medium text-text-secondary">
          What is wrong
        </label>
        <Input.TextArea
          id="mx-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nozzle leaking; technician booked for Monday"
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={500}
          status={problem ? 'error' : undefined}
          aria-describedby={problem ? 'mx-problem' : undefined}
          autoFocus
        />
        {problem ? (
          <p id="mx-problem" className="m-0 text-12 text-danger">
            {problem}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export function EndMaintenanceModal({
  point,
  onClose,
  onDone,
}: {
  point: Point | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [resolution, setResolution] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const label = point ? pointLabel(point.pump_number, point.product_type) : '';
  const submit = async () => {
    if (!point) return;
    setSaving(true);
    try {
      await endMaintenance(point.id, resolution.trim() || undefined);
      setResolution('');
      onDone();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'It could not be put back in service.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open={point !== null}
      onCancel={onClose}
      title={`Put ${label} back in service`}
      okText="Back in service"
      onOk={submit}
      confirmLoading={saving}
      destroyOnHidden
    >
      <div className="flex flex-col gap-2">
        {point?.maintenance ? (
          <p className="m-0 mb-2 text-14 text-text-secondary">
            Out since {sinceLabel(point.maintenance.startedAt)}: {point.maintenance.reason}
          </p>
        ) : null}
        <label htmlFor="mx-resolution" className="text-13 font-medium text-text-secondary">
          What was done <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <Input.TextArea
          id="mx-resolution"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Seal replaced and meter checked against the calibration can"
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={500}
        />
        {problem ? <p className="m-0 text-12 text-danger">{problem}</p> : null}
      </div>
    </Modal>
  );
}

export function MaintenanceLogDrawer({
  stationId,
  open,
  onClose,
}: {
  stationId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Maintenance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!open) return;
    let live = true;
    getLog(stationId)
      .then((r) => live && (setRows(r), setError(null)))
      .catch((err: Error) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [open, stationId, nonce]);
  return (
    <Drawer open={open} onClose={onClose} title="Maintenance log" size="large">
      {error && !rows ? (
        <PanelError message="The log could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
      ) : !rows ? (
        <PanelSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <p className="m-0 text-14 text-text-secondary">Nothing has been taken out for maintenance at this station.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((m) => (
            <li key={m.id} className="flex flex-col gap-1.5 rounded-control border border-border p-4">
              <span className="flex items-center justify-between gap-2">
                <span className="text-14 font-semibold text-text">Pump {m.pumpNumber ?? '?'}</span>
                <StatusChip tone={m.endedAt ? 'success' : 'warning'} icon={m.endedAt ? CircleCheck : Wrench}>
                  {m.endedAt ? 'Back in service' : 'Out of service'}
                </StatusChip>
              </span>
              <span className="text-14 text-text">{m.reason}</span>
              <span className="text-12 text-text-muted">
                Out {sinceLabel(m.startedAt)}
                {m.startedBy ? ` by ${m.startedBy}` : ''}
                {m.endedAt ? ` · back ${sinceLabel(m.endedAt)}${m.endedBy ? ` by ${m.endedBy}` : ''}` : ''}
              </span>
              {m.resolution ? <span className="text-13 text-text-secondary">Done: {m.resolution}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

const PERIODS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

/** The old "pump report", now one pump at a time: sales by day, summed in the database. */
export function PumpReportDrawer({ point, onClose }: { point: Point | null; onClose: () => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{ key: string; series: PumpSeries | null; error: string | null } | null>(null);
  const key = point ? `${point.id}|${days}` : null;
  useEffect(() => {
    if (!point || !key) return;
    let live = true;
    const w = kigaliWindow({ days });
    getSeries(point.id, w.from, new Date().toISOString())
      .then((series) => live && setData({ key, series, error: null }))
      .catch((err: Error) => live && setData({ key, series: null, error: err.message }));
    return () => {
      live = false;
    };
  }, [point, days, key]);
  const current = data?.key === key ? data : null;
  const series = current?.series ?? null;
  const unit = point?.unit ?? 'L';
  const bars = useMemo(
    () =>
      (series?.days ?? []).map((d, i, all) => ({
        label:
          i % Math.ceil(all.length / 6) === 0
            ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
                new Date(`${d.day}T12:00:00Z`),
              )
            : null,
        name: new Intl.DateTimeFormat('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        }).format(new Date(`${d.day}T12:00:00Z`)),
        value: d.revenue,
        highlight: i === all.length - 1,
      })),
    [series],
  );
  const label = point ? pointLabel(point.pump_number, point.product_type) : '';
  return (
    <Drawer open={point !== null} onClose={onClose} title={`${label} report`} size="large">
      <div className="flex flex-col gap-5">
        <Segmented
          aria-label="Period"
          value={days}
          onChange={(v) => setDays(Number(v))}
          options={PERIODS}
          className="self-start"
        />
        {current?.error ? (
          <PanelError message="The report could not be loaded." onRetry={() => setData(null)} />
        ) : !series ? (
          <PanelSkeleton rows={6} />
        ) : (
          <>
            <dl className="m-0 grid grid-cols-3 gap-4 rounded-card bg-surface-muted px-5 py-3.5">
              {(
                [
                  ['Sales', num(series.totals.sales)],
                  ['Revenue', rwf(series.totals.revenue)],
                  [unit === 'KWH' ? 'Delivered' : 'Dispensed', formatMeter(series.totals.quantity, unit)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="font-mono text-10 font-medium tracking-p80 text-text-muted uppercase">{k}</dt>
                  <dd className="m-0 font-mono text-15 font-semibold text-text">{v}</dd>
                </div>
              ))}
            </dl>
            <BarChart
              bars={bars}
              format={rwf}
              summary={`${label}: revenue by day over ${days} days, ${rwf(series.totals.revenue)} in all.`}
            />
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Day', 'Sales', unit === 'KWH' ? 'kWh' : 'Litres', 'Revenue RWF'].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={cx(
                        'border-b border-border py-2 type-overline text-11 text-text-muted',
                        i ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...series.days]
                  .reverse()
                  .filter((d) => d.sales > 0)
                  .map((d) => (
                    <tr key={d.day}>
                      <th scope="row" className="border-b border-border py-2 text-left text-13 font-normal text-text">
                        {new Intl.DateTimeFormat('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(`${d.day}T12:00:00Z`))}
                      </th>
                      <td className="border-b border-border py-2 text-right font-mono text-13 text-text">
                        {num(d.sales)}
                      </td>
                      <td className="border-b border-border py-2 text-right font-mono text-13 text-text">
                        {one(d.quantity)}
                      </td>
                      <td className="border-b border-border py-2 text-right font-mono text-13 font-semibold text-text">
                        {num(d.revenue)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </Drawer>
  );
}

export function AddPointModal({
  stationId,
  open,
  onClose,
  onDone,
}: {
  stationId: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [number, setNumber] = useState<number | null>(null);
  const [product, setProduct] = useState('GASOLINE');
  const [connector, setConnector] = useState<string | undefined>(undefined);
  const [power, setPower] = useState<number | null>(null);
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const ev = isEvProductType(product);

  useEffect(() => {
    if (!open) return;
    let live = true;
    nextNumber(stationId)
      .then((n) => live && setNumber((cur) => cur ?? n))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open, stationId]);

  const submit = async () => {
    if (!number || number < 1) return setProblem('Give it a number of 1 or more, as painted on the forecourt.');
    if (ev && !connector) return setProblem('Choose the connector this charger uses.');
    if (ev && !(power && power > 0)) return setProblem('Give the charger’s rated power in kW.');
    setSaving(true);
    try {
      await addPoint({
        station_id: stationId,
        pump_number: number,
        product_type: product,
        ...(ev ? { connector_type: connector, power_kw: power! } : {}),
      });
      setNumber(null);
      setConnector(undefined);
      setPower(null);
      setProblem('');
      onDone();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'It could not be added.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Add a pump or charger"
      okText={ev ? 'Add charger' : 'Add pump'}
      onOk={submit}
      confirmLoading={saving}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4">
        {problem ? <Banner tone="danger" title={problem} /> : null}
        <div className="flex flex-col gap-2">
          <label htmlFor="pt-product" className="text-13 font-medium text-text-secondary">
            What it sells
          </label>
          <Select
            id="pt-product"
            value={product}
            onChange={setProduct}
            options={PRODUCT_TYPES.map((p) => ({ value: p, label: productName(p) }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pt-number" className="text-13 font-medium text-text-secondary">
            Number
          </label>
          <InputNumber
            id="pt-number"
            min={1}
            max={99}
            value={number}
            onChange={(v) => setNumber(v)}
            className="w-full"
          />
          <p className="m-0 text-12 text-text-muted">
            Pumps and chargers share one numbering at a station, as attendants pick them by it.
          </p>
        </div>
        {ev ? (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="pt-connector" className="text-13 font-medium text-text-secondary">
                Connector
              </label>
              <Select
                id="pt-connector"
                value={connector}
                onChange={setConnector}
                placeholder="Choose a connector"
                options={CONNECTOR_TYPES.map((c) => ({ value: c, label: connectorShort(c) }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="pt-power" className="text-13 font-medium text-text-secondary">
                Rated power (kW)
              </label>
              <InputNumber
                id="pt-power"
                min={1}
                max={1000}
                value={power}
                onChange={(v) => setPower(v)}
                className="w-full"
              />
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
