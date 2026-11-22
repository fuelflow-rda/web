'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { App, Input, InputNumber, Modal, Select } from 'antd';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Banner, Button, PageHeader, Panel, StatusChip, Tag } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { cx } from '@/lib/cx';
import {
  CONNECTOR_TYPES,
  PRODUCT_TYPES,
  connectorShort,
  isEvProductType,
  pointLabel,
  productCode,
  productColor,
  productName,
} from '@/lib/product-types';

interface PointRow {
  id: string;
  station_id: string;
  pump_number: number;
  product_type: string;
  status: 'active' | 'inactive';
  connector_type: string | null;
  power_kw: number | null;
}
interface StationRef {
  id: string;
  name: string;
  companyName?: string;
}

/**
 * Pumps and chargers across stations, for company admins and the platform.
 * Not designed; restyled from the components. A station's own Pumps page has
 * the live view; this one is for setting them up.
 */
export default function AdminPumpsPage() {
  const { modal } = App.useApp();
  const [stations, setStations] = useState<StationRef[] | null>(null);
  const [station, setStation] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<PointRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [editing, setEditing] = useState<PointRow | 'new' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/stations', { params: { limit: 500, sortBy: 'name', sortOrder: 'asc' } })
      .then((r) => {
        const body = r.data as { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
        const list = Array.isArray(body) ? body : (body.data ?? []);
        setStations(
          list.map((s) => ({
            id: String(s.id),
            name: String(s.name),
            companyName: (s.companies as { name?: string } | null)?.name,
          })),
        );
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  // One station, or all of them at once: a company has a handful.
  const targets = useMemo(
    () => (station ? [station] : (stations ?? []).slice(0, 40).map((s) => s.id)),
    [station, stations],
  );
  useEffect(() => {
    if (!stations) return;
    let live = true;
    Promise.all(
      targets.map((id) =>
        api
          .get('/pumps', { params: { stationId: id, limit: 100, sortBy: 'pump_number', sortOrder: 'asc' } })
          .then((r) => {
            const body = r.data as { data?: PointRow[] } | PointRow[];
            return Array.isArray(body) ? body : (body.data ?? []);
          }),
      ),
    )
      .then((lists) => {
        if (!live) return;
        setRows(lists.flat());
        setError(null);
      })
      .catch((err: Error) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [targets, stations, nonce]);

  const stationName = useMemo(() => new Map((stations ?? []).map((s) => [s.id, s])), [stations]);
  const needle = q.trim().toLowerCase();
  const shown = (rows ?? []).filter(
    (p) =>
      !needle ||
      pointLabel(p.pump_number, p.product_type).toLowerCase().includes(needle) ||
      productName(p.product_type).toLowerCase().includes(needle) ||
      (stationName.get(p.station_id)?.name ?? '').toLowerCase().includes(needle),
  );

  const remove = (p: PointRow) =>
    modal.confirm({
      title: `Delete ${pointLabel(p.pump_number, p.product_type)} at ${stationName.get(p.station_id)?.name ?? 'this station'}?`,
      content:
        'Only a pump with no sales or readings can be deleted. One with history can be taken out of service instead.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api.delete(`/pumps/${p.id}`);
        setNotice(`${pointLabel(p.pump_number, p.product_type)} is deleted.`);
        setNonce((n) => n + 1);
      },
    });

  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

  return (
    <>
      <PageHeader
        title="Pumps and chargers"
        description="Set up each station's pumps and chargers. Live status is on each station's own Pumps page."
        actions={
          <Button kind="primary" icon={Plus} onClick={() => setEditing('new')} disabled={!stations?.length}>
            Add pump or charger
          </Button>
        }
      />
      {notice ? <Banner tone="success" title={notice} /> : null}
      <div role="search" aria-label="Filter pumps" className="flex flex-wrap gap-3">
        <Input
          aria-label="Search pumps"
          placeholder="Search pump, product or station"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
          className="w-full sm:w-70"
        />
        <Select
          aria-label="Station"
          placeholder="All stations"
          allowClear
          showSearch
          optionFilterProp="label"
          value={station}
          onChange={setStation}
          className="w-full sm:w-60"
          options={(stations ?? []).map((s) => ({
            value: s.id,
            label: s.companyName ? `${s.name} · ${s.companyName}` : s.name,
          }))}
        />
      </div>
      {!station && (stations?.length ?? 0) > 40 ? (
        <Banner tone="info" title="Showing the first 40 stations. Choose a station to see the rest." />
      ) : null}
      <Panel
        title={`${num(shown.length)} ${shown.length === 1 ? 'pump or charger' : 'pumps and chargers'}`}
        padded={false}
      >
        {error && !rows ? (
          <div className="p-5">
            <PanelError message="Pumps could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : !rows ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : shown.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">
            {needle ? 'Nothing matches.' : 'No pumps or chargers yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 border-collapse">
              <thead className="bg-surface-muted">
                <tr>
                  {['Pump', 'Station', 'Product', 'Connector', 'Status'].map((h) => (
                    <th key={h} scope="col" className={head}>
                      {h}
                    </th>
                  ))}
                  <th scope="col" className={head}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const label = pointLabel(p.pump_number, p.product_type);
                  return (
                    <tr key={p.id}>
                      <th scope="row" className={cx(cell, 'text-left')}>
                        <span className="flex items-center gap-2.5">
                          <span className="text-14 font-semibold whitespace-nowrap text-text">{label}</span>
                          <Tag color={productColor(p.product_type)} className="whitespace-nowrap">
                            {productCode(p.product_type)}
                          </Tag>
                        </span>
                      </th>
                      <td className={cx(cell, 'text-14 text-text')}>{stationName.get(p.station_id)?.name ?? '—'}</td>
                      <td className={cx(cell, 'text-14 text-text')}>{productName(p.product_type)}</td>
                      <td className={cx(cell, 'text-14 text-text-secondary')}>
                        {isEvProductType(p.product_type)
                          ? `${connectorShort(p.connector_type)} · ${num(p.power_kw ?? 0)} kW`
                          : '—'}
                      </td>
                      <td className={cell}>
                        <StatusChip tone={p.status === 'active' ? 'success' : 'neutral'}>
                          {p.status === 'active' ? 'In service' : 'Out of service'}
                        </StatusChip>
                      </td>
                      <td className={cx(cell, 'text-right')}>
                        <span className="inline-flex gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${label}`}
                            onClick={() => setEditing(p)}
                            className={cx(
                              'inline-flex size-8 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-text-secondary hover:bg-surface-muted',
                              focusRing,
                            )}
                          >
                            <Pencil size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${label}`}
                            onClick={() => remove(p)}
                            className={cx(
                              'inline-flex size-8 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-danger hover:bg-danger-tint',
                              focusRing,
                            )}
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {editing && stations ? (
        <PointModal
          point={editing === 'new' ? null : editing}
          stations={stations}
          defaultStation={station}
          onClose={() => setEditing(null)}
          onDone={(m) => {
            setEditing(null);
            setNotice(m);
            setNonce((n) => n + 1);
          }}
        />
      ) : null}
    </>
  );
}

function PointModal({
  point,
  stations,
  defaultStation,
  onClose,
  onDone,
}: {
  point: PointRow | null;
  stations: StationRef[];
  defaultStation?: string;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [stationId, setStationId] = useState<string | undefined>(point?.station_id ?? defaultStation);
  const [number, setNumber] = useState<number | null>(point?.pump_number ?? null);
  const [product, setProduct] = useState(point?.product_type ?? 'GASOLINE');
  const [connector, setConnector] = useState<string | undefined>(point?.connector_type ?? undefined);
  const [power, setPower] = useState<number | null>(point?.power_kw ?? null);
  const [status, setStatus] = useState<'active' | 'inactive'>(point?.status ?? 'active');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const ev = isEvProductType(product);

  useEffect(() => {
    if (point || !stationId) return;
    let live = true;
    api
      .get<{ nextNumber: number }>('/pumps/next-number', { params: { stationId } })
      .then((r) => live && setNumber(r.data?.nextNumber ?? 1))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [point, stationId]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!stationId) return setProblem('Choose the station.');
    if (!number || number < 1) return setProblem('Give it a number of 1 or more.');
    if (ev && !connector) return setProblem('Choose the connector this charger uses.');
    if (ev && !(power && power > 0)) return setProblem('Give the charger’s rated power in kW.');
    setSaving(true);
    try {
      const evFields = ev ? { connector_type: connector, power_kw: power } : {};
      if (point)
        await api.patch(`/pumps/${point.id}`, { pump_number: number, product_type: product, status, ...evFields });
      else await api.post('/pumps', { station_id: stationId, pump_number: number, product_type: product, ...evFields });
      onDone(`${pointLabel(number, product)} is ${point ? 'updated' : 'added'}.`);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'It could not be saved.');
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      title={point ? `Edit ${pointLabel(point.pump_number, point.product_type)}` : 'Add a pump or charger'}
      okText={point ? 'Save' : 'Add'}
      onOk={() => submit()}
      confirmLoading={saving}
      destroyOnHidden
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {problem ? <Banner tone="danger" title={problem} /> : null}
        {!point ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="pm-station" className="text-13 font-medium text-text-secondary">
              Station
            </label>
            <Select
              id="pm-station"
              value={stationId}
              onChange={setStationId}
              showSearch
              optionFilterProp="label"
              placeholder="Choose a station"
              options={stations.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <label htmlFor="pm-product" className="text-13 font-medium text-text-secondary">
            What it sells
          </label>
          <Select
            id="pm-product"
            value={product}
            onChange={setProduct}
            options={PRODUCT_TYPES.map((p) => ({ value: p, label: productName(p) }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pm-number" className="text-13 font-medium text-text-secondary">
            Number
          </label>
          <InputNumber
            id="pm-number"
            min={1}
            max={99}
            value={number}
            onChange={(v) => setNumber(v)}
            className="w-full"
          />
        </div>
        {ev ? (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="pm-connector" className="text-13 font-medium text-text-secondary">
                Connector
              </label>
              <Select
                id="pm-connector"
                value={connector}
                onChange={setConnector}
                placeholder="Choose a connector"
                options={CONNECTOR_TYPES.map((c) => ({ value: c, label: connectorShort(c) }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="pm-power" className="text-13 font-medium text-text-secondary">
                Rated power (kW)
              </label>
              <InputNumber
                id="pm-power"
                min={1}
                max={1000}
                value={power}
                onChange={(v) => setPower(v)}
                className="w-full"
              />
            </div>
          </>
        ) : null}
        {point ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="pm-status" className="text-13 font-medium text-text-secondary">
              Status
            </label>
            <Select
              id="pm-status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'active', label: 'In service' },
                { value: 'inactive', label: 'Out of service' },
              ]}
            />
            <p className="m-0 text-12 text-text-muted">
              For a repair, use maintenance on the station’s Pumps page, which keeps a record.
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
