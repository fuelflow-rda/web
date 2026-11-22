'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { DatePicker, Drawer, Input, Segmented, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight, Eye, Flag, FlagOff, Search, X } from 'lucide-react';
import api from '@/lib/api';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, PageHeader, RowMenu, StatusChip, Tag, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { PanelError, PanelSkeleton, clock, num, rwf } from '@/components/overview/panels';
import { kigaliWindow, ymd } from '@/lib/kigali';
import { cx } from '@/lib/cx';
import { isPaymentFilter } from '@/lib/links';
import { PRODUCT_TYPES, formatMeter, pointLabel, productCode, productColor, productName } from '@/lib/product-types';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

type Preset = 'today' | '7d' | '30d' | '90d';
const PRESETS: Array<{ value: Preset; label: string; days: number }> = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
];
type Range = { kind: 'preset'; value: Preset } | { kind: 'custom'; from: string; to: string };
type Status = 'all' | 'pending' | 'locked' | 'voided' | 'flagged';
type Sort = 'newest' | 'oldest' | 'amount' | 'quantity';
const SORTS: Record<Sort, { label: string; sortBy: string; sortOrder: 'asc' | 'desc' }> = {
  newest: { label: 'Newest first', sortBy: 'timestamp', sortOrder: 'desc' },
  oldest: { label: 'Oldest first', sortBy: 'timestamp', sortOrder: 'asc' },
  amount: { label: 'Largest amount', sortBy: 'total_amount', sortOrder: 'desc' },
  quantity: { label: 'Largest quantity', sortBy: 'quantity', sortOrder: 'desc' },
};
/** Rows per page, as the design shows them. */
const PAGE = 12;
/** Columns of figures, set right-aligned so the digits line up. */
const NUMERIC = new Set(['Quantity', 'Price', 'Amount']);

const PAY: Record<string, string> = { CASH: 'Cash', MOMO: 'MoMo', CARD: 'Card' };
const STATUS: Record<'pending' | 'locked' | 'voided', { label: string; tone: StatusTone; title: string }> = {
  pending: { label: 'Pending', tone: 'warning', title: 'Saved under 2 minutes ago: the attendant can still undo it' },
  locked: { label: 'Synced', tone: 'success', title: 'Saved and locked' },
  voided: { label: 'Voided', tone: 'neutral', title: 'Undone by the attendant; kept for the record' },
};

interface Sale {
  id: string;
  timestamp: string;
  quantity: number;
  unit: string;
  unit_price: number;
  product_type: string;
  total_amount: number;
  payment_method: string;
  vehicle_plate: string | null;
  customer_phone: string | null;
  sale_status: 'pending' | 'locked' | 'voided';
  is_flagged: boolean | null;
  flag_reason: string | null;
  is_offline: boolean | null;
  synced_at: string | null;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
  users?: { id: string; name: string | null } | null;
  pumps?: { pump_number: number; product_type?: string } | null;
}
interface Summary {
  sales: number;
  revenue: number;
  liters: number;
  kwh: number;
  pending: number;
  voided: number;
}

const readDay = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const readInt = (v: string | null, lo: number, hi: number) => {
  const n = v === null ? NaN : Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : undefined;
};
const one = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));

/** The window as API timestamps, on Kigali days. */
function windowOf(range: Range): { from: string; to?: string } {
  if (range.kind === 'custom') return kigaliWindow({ from: range.from, to: range.to });
  return kigaliWindow({ days: PRESETS.find((p) => p.value === range.value)!.days });
}

// useSearchParams needs a Suspense boundary for Next to prerender the page.
export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsView />
    </Suspense>
  );
}

function TransactionsView() {
  const params = useSearchParams();
  const { currentStation } = useStationStore();
  const stationId = currentStation?.id ?? null;
  // The platform admin reads a station's sales; flags are the company's (the API refuses them).
  const role = useAuthStore((st) => st.user?.role);
  const canFlag = role === 'ADMIN' || role === 'MANAGER';

  // Links from the Overview and the search box arrive with the slice they mean.
  const [range, setRange] = useState<Range>(() => {
    const from = readDay(params.get('from'));
    const to = readDay(params.get('to')) ?? from;
    if (from && to) return { kind: 'custom', from, to };
    // A search with no dates means "find this plate", not "find it today".
    return { kind: 'preset', value: params.get('search') ? '90d' : 'today' };
  });
  const [search, setSearch] = useState(() => params.get('search') ?? '');
  const [query, setQuery] = useState(search);
  const [product, setProduct] = useState<string | undefined>(() => params.get('product') ?? undefined);
  const [payment, setPayment] = useState<string | undefined>(() => {
    const p = params.get('payment') ?? '';
    return isPaymentFilter(p) ? p : undefined;
  });
  const [attendant, setAttendant] = useState<string | undefined>(() => params.get('attendant') ?? undefined);
  const [pump, setPump] = useState<string | undefined>(() => params.get('pump') ?? undefined);
  const [status, setStatus] = useState<Status>(() => (params.get('flag') === 'flagged' ? 'flagged' : 'all'));
  const [slot] = useState(() => ({ dow: readInt(params.get('dow'), 0, 6), hour: readInt(params.get('hour'), 0, 23) }));
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);

  const [sales, setSales] = useState<Sale[] | null>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  // What is on screen was loaded for this key; anything else is still loading.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [stamp] = useState(() => ymd(Date.now()));
  const [nonce, setNonce] = useState(0);
  const [pumps, setPumps] = useState<Array<{ id: string; pump_number: number; product_type: string }>>([]);
  const [attendants, setAttendants] = useState<Array<{ id: string; name: string }>>([]);
  const [open, setOpen] = useState<Sale | null>(null);
  const [flagging, setFlagging] = useState(false);
  const [menuProblem, setMenuProblem] = useState<string | null>(null);

  /** "Remove flag" from a row's menu: no reason needed, so it acts at once. */
  const unflag = async (sale: Sale) => {
    setMenuProblem(null);
    try {
      await api.delete(`/transactions/${sale.id}/flag`);
      setSales((list) => (list ?? []).map((x) => (x.id === sale.id ? { ...x, is_flagged: false, flag_reason: null } : x)));
    } catch (err) {
      setMenuProblem(err instanceof Error ? err.message : 'The flag could not be removed.');
    }
  };

  // Typing settles for a moment before it searches.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // Any change of filter goes back to the first page.
  const filterKey = JSON.stringify([range, query, product, payment, attendant, pump, status, sort, stationId]);
  const [lastKey, setLastKey] = useState(filterKey);
  if (filterKey !== lastKey) {
    setLastKey(filterKey);
    setPage(1);
  }

  const shared = useMemo(() => {
    const w = windowOf(range);
    const p: Record<string, unknown> = { station_id: stationId, from: w.from };
    if (w.to) p.to = w.to;
    if (query) p.search = query;
    if (product) p.product_type = product;
    if (payment) p.payment_method = payment;
    if (attendant) p.attendant_id = attendant;
    if (pump) p.pump_id = pump;
    if (slot.dow !== undefined) p.dow = slot.dow;
    if (slot.hour !== undefined) p.hour = slot.hour;
    return p;
    // The window is recomputed when filters change; "today" rolling over is picked up by reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, query, product, payment, attendant, pump, slot, stationId, nonce]);

  const requestKey = JSON.stringify([stationId, shared, page, sort, status]);
  useEffect(() => {
    if (!stationId) return;
    let live = true;
    const list: Record<string, unknown> = {
      ...shared,
      page,
      limit: PAGE,
      sortBy: SORTS[sort].sortBy,
      sortOrder: SORTS[sort].sortOrder,
    };
    if (status === 'flagged') Object.assign(list, { flag_status: 'flagged', include_voided: true });
    else if (status === 'all') list.include_voided = true;
    else list.sale_status = status;
    const key = requestKey;
    Promise.all([api.get('/transactions', { params: list }), api.get('/transactions/summary', { params: shared })])
      .then(([res, sum]) => {
        if (!live) return;
        const body = res.data as { data?: Sale[]; pagination?: { total: number } };
        setSales(body.data ?? []);
        setTotal(body.pagination?.total ?? 0);
        setSummary(sum.data as Summary);
        setError(null);
      })
      .catch((err: Error) => live && setError(err.message))
      .finally(() => live && setLoadedKey(key));
    return () => {
      live = false;
    };
  }, [stationId, shared, page, sort, status, requestKey]);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    if (!stationId) return;
    Promise.all([api.get('/pumps', { params: { stationId } }), api.get(`/users/attendants/${stationId}`)])
      .then(([p, a]) => {
        const pumpRows = ((p.data as { data?: unknown[] }).data ?? (Array.isArray(p.data) ? p.data : [])) as Array<
          Record<string, unknown>
        >;
        setPumps(
          pumpRows.map((r) => ({
            id: String(r.id),
            pump_number: Number(r.pump_number),
            product_type: String(r.product_type ?? r.fuel_type),
          })),
        );
        setAttendants(
          ((Array.isArray(a.data) ? a.data : []) as Array<Record<string, unknown>>).map((r) => ({
            id: String(r.id),
            name: String(r.name ?? ''),
          })),
        );
      })
      .catch(() => {
        // The filters stay usable with what they have; the list itself reports errors.
      });
  }, [stationId]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const filtered = Boolean(
    query ||
    product ||
    payment ||
    attendant ||
    pump ||
    status !== 'all' ||
    slot.dow !== undefined ||
    slot.hour !== undefined,
  );
  const clear = () => {
    setSearch('');
    setQuery('');
    setProduct(undefined);
    setPayment(undefined);
    setAttendant(undefined);
    setPump(undefined);
    setStatus('all');
  };

  const first = total === 0 ? 0 : (page - 1) * PAGE + 1;
  const last = Math.min(page * PAGE, total);
  const exportRows = (sales ?? []).map((s) => ({
    time: dateTime(s.timestamp),
    pump: s.pumps ? pointLabel(s.pumps.pump_number, s.product_type) : '',
    product: productName(s.product_type),
    quantity: formatMeter(s.quantity, s.unit),
    price: s.unit_price,
    amount: s.total_amount,
    payment: PAY[s.payment_method] ?? s.payment_method,
    attendant: s.users?.name ?? '',
    plate: s.vehicle_plate ?? '',
    status: STATUS[s.sale_status].label,
  }));

  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

  return (
    <>
      <PageHeader
        title="Transactions"
        description={`${currentStation?.name ?? 'No station chosen'} · every sale locks two minutes after it is saved`}
        actions={
          <>
            <Segmented<Preset | 'custom'>
              aria-label="Period"
              value={range.kind === 'preset' ? range.value : 'custom'}
              onChange={(v) => {
                if (v !== 'custom') setRange({ kind: 'preset', value: v });
              }}
              options={[
                ...PRESETS.map((p) => ({ value: p.value, label: p.label })),
                ...(range.kind === 'custom' ? [{ value: 'custom' as const, label: 'Custom' }] : []),
              ]}
            />
            <ExportButton
              data={exportRows}
              filename={`${currentStation?.name ?? 'station'}-transactions-${stamp}`}
              columns={[
                { header: 'Time', key: 'time' },
                { header: 'Pump', key: 'pump' },
                { header: 'Product', key: 'product' },
                { header: 'Quantity', key: 'quantity' },
                { header: 'Price (RWF)', key: 'price' },
                { header: 'Amount (RWF)', key: 'amount' },
                { header: 'Payment', key: 'payment' },
                { header: 'Attendant', key: 'attendant' },
                { header: 'Plate', key: 'plate' },
                { header: 'Status', key: 'status' },
              ]}
            />
          </>
        }
      />

      <div role="search" aria-label="Filter transactions" className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Search by plate or phone"
          placeholder="Search plate or phone"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-full sm:w-70"
        />
        <Select
          aria-label="Product"
          placeholder="All products"
          allowClear
          value={product}
          onChange={setProduct}
          className="w-full sm:w-37.5"
          options={PRODUCT_TYPES.map((p) => ({ value: p, label: productName(p) }))}
        />
        <Select
          aria-label="Payment"
          placeholder="All payments"
          allowClear
          value={payment}
          onChange={setPayment}
          className="w-full sm:w-37.5"
          options={Object.entries(PAY).map(([value, label]) => ({ value, label }))}
        />
        <Select
          aria-label="Attendant"
          placeholder="All attendants"
          allowClear
          value={attendant}
          onChange={setAttendant}
          className="w-full sm:w-37.5"
          showSearch
          optionFilterProp="label"
          options={attendants.map((a) => ({ value: a.id, label: a.name }))}
        />
        <Select
          aria-label="Pump or charger"
          placeholder="All pumps"
          allowClear
          value={pump}
          onChange={setPump}
          className="w-full sm:w-37.5"
          options={[...pumps]
            .sort((a, b) => a.pump_number - b.pump_number)
            .map((p) => ({ value: p.id, label: pointLabel(p.pump_number, p.product_type) }))}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={setStatus}
          className="w-full sm:w-37.5"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'locked', label: 'Synced' },
            { value: 'voided', label: 'Voided' },
            { value: 'flagged', label: 'Flagged' },
          ]}
        />
        {range.kind === 'custom' ? (
          <DatePicker.RangePicker
            aria-label="Dates"
            value={[dayjs(range.from), dayjs(range.to)]}
            onChange={(v) => {
              const [a, b] = (v ?? []) as [Dayjs | null, Dayjs | null];
              if (a && b) setRange({ kind: 'custom', from: a.format('YYYY-MM-DD'), to: b.format('YYYY-MM-DD') });
              else setRange({ kind: 'preset', value: 'today' });
            }}
          />
        ) : null}
        <Button kind="ghost" icon={X} onClick={clear} disabled={!filtered} className="sm:ml-auto">
          Clear filters
        </Button>
      </div>
      {slot.dow !== undefined || slot.hour !== undefined ? (
        <Banner tone="info" title="Showing one slot from the Overview's activity chart">
          {slot.dow !== undefined
            ? ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][slot.dow]
            : 'Every day'}
          {slot.hour !== undefined
            ? `, ${String(slot.hour).padStart(2, '0')}:00 to ${String(slot.hour + 1).padStart(2, '0')}:00`
            : ''}
          , Kigali time.
        </Banner>
      ) : null}

      {menuProblem ? <Banner tone="danger" title={menuProblem} /> : null}
      <dl
        aria-label="Summary"
        className="m-0 flex flex-wrap gap-x-10 gap-y-3 rounded-card bg-surface-muted px-5 py-3.5"
      >
        {(
          [
            ['Sales', summary ? num(summary.sales) : '–'],
            ['Revenue', summary ? rwf(summary.revenue) : '–'],
            ['Fuel', summary ? `${one(summary.liters)} L` : '–'],
            ['Energy', summary ? `${one(summary.kwh)} kWh` : '–'],
            ['Pending', summary ? num(summary.pending) : '–', STATUS.pending.title],
            ['Voided', summary ? num(summary.voided) : '–'],
          ] as Array<[string, string, string?]>
        ).map(([label, value, title]) => (
          <div key={label} className="flex flex-col gap-1" title={title}>
            <dt className="font-mono text-10 font-medium tracking-p80 text-text-muted uppercase">{label}</dt>
            <dd className="m-0 font-mono text-15 font-semibold text-text">{value}</dd>
          </div>
        ))}
      </dl>

      <section
        aria-labelledby="tx-title"
        className="min-w-0 overflow-hidden rounded-card border border-border bg-surface"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex flex-col gap-0.5">
            <h2 id="tx-title" className="m-0 text-15 font-semibold text-text">
              {num(total)} {total === 1 ? 'transaction' : 'transactions'}
            </h2>
            <p className="m-0 text-12 text-text-muted">{SORTS[sort].label}</p>
          </div>
          <Select
            aria-label="Sort"
            value={sort}
            onChange={setSort}
            size="small"
            variant="borderless"
            options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))}
          />
        </header>
        {error && !sales ? (
          <div className="p-5">
            <PanelError message="Transactions could not be loaded." onRetry={reload} />
          </div>
        ) : loading && !sales ? (
          <div className="p-5">
            <PanelSkeleton rows={8} />
          </div>
        ) : sales && sales.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">
            {filtered ? 'No sales match these filters.' : 'No sales in this period yet.'}
          </p>
        ) : (
          <div className={cx('overflow-x-auto transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            <table className="w-full min-w-240 border-collapse">
              <thead className="bg-surface-muted">
                <tr>
                  {[
                    'Time',
                    'Pump',
                    'Product',
                    'Quantity',
                    'Price',
                    'Amount',
                    'Payment',
                    'Attendant',
                    'Plate',
                    'Status',
                  ].map((h) => (
                    <th key={h} scope="col" className={cx(head, NUMERIC.has(h) && 'text-right')}>
                      {h}
                    </th>
                  ))}
                  <th scope="col" className={head}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(sales ?? []).map((s) => {
                  const voided = s.sale_status === 'voided';
                  const st = STATUS[s.sale_status];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setOpen(s)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted"
                    >
                      <td className={cell}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(s);
                          }}
                          aria-label={`Sale at ${dateTime(s.timestamp)}, details`}
                          className={cx(
                            'inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-mono text-13 text-text-secondary',
                            focusRing,
                          )}
                        >
                          {range.kind === 'preset' && range.value === 'today'
                            ? clock(s.timestamp)
                            : dateTime(s.timestamp)}
                          {s.is_flagged ? <Flag size={12} aria-label="Flagged" className="text-danger" /> : null}
                        </button>
                      </td>
                      <td className={cx(cell, 'text-14 whitespace-nowrap text-text')}>
                        {s.pumps ? pointLabel(s.pumps.pump_number, s.product_type) : '—'}
                      </td>
                      <td className={cell}>
                        <Tag color={productColor(s.product_type)} className="whitespace-nowrap">
                          {productCode(s.product_type)}
                        </Tag>
                      </td>
                      <td className={cx(cell, 'text-right font-mono text-13 whitespace-nowrap text-text')}>
                        {formatMeter(s.quantity, s.unit)}
                      </td>
                      <td className={cx(cell, 'text-right font-mono text-13 text-text-secondary')}>{num(s.unit_price)}</td>
                      <td
                        className={cx(
                          cell,
                          'text-right font-mono text-13 font-semibold',
                          voided ? 'text-text-muted' : 'text-text',
                        )}
                      >
                        {num(s.total_amount)}
                      </td>
                      <td className={cx(cell, 'text-14 text-text-secondary')}>
                        {PAY[s.payment_method] ?? s.payment_method}
                      </td>
                      <td className={cx(cell, 'text-14 whitespace-nowrap text-text')}>{s.users?.name ?? '—'}</td>
                      <td className={cx(cell, 'font-mono text-13 whitespace-nowrap text-text-secondary')}>
                        {s.vehicle_plate ?? '—'}
                      </td>
                      <td className={cell} title={st.title}>
                        <StatusChip tone={st.tone}>{st.label}</StatusChip>
                      </td>
                      <td className={cx(cell, 'w-12 text-right')}>
                        <RowMenu
                          label={`Actions for the sale at ${dateTime(s.timestamp)}`}
                          items={[
                            { key: 'open', label: 'View details', icon: Eye, onClick: () => setOpen(s) },
                            ...(canFlag
                              ? [
                                  s.is_flagged
                                    ? { key: 'unflag', label: 'Remove flag', icon: FlagOff, onClick: () => void unflag(s) }
                                    : {
                                        key: 'flag',
                                        label: 'Flag for review…',
                                        icon: Flag,
                                        onClick: () => {
                                          setFlagging(true);
                                          setOpen(s);
                                        },
                                      },
                                ]
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
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="m-0 text-13 text-text-secondary" aria-live="polite">
            {total === 0 ? 'No results' : `Showing ${num(first)} to ${num(last)} of ${num(total)}`}
          </p>
          <div className="flex gap-2">
            <Button icon={ChevronLeft} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              icon={ChevronRight}
              iconPlacement="end"
              disabled={last >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      </section>

      <SaleDrawer
        sale={open}
        canFlag={canFlag}
        focusFlag={flagging}
        onClose={() => {
          setOpen(null);
          setFlagging(false);
        }}
        onChanged={(s) => {
          setOpen(s);
          setSales((list) => (list ?? []).map((x) => (x.id === s.id ? s : x)));
        }}
      />
    </>
  );
}

/** Everything about one sale, and flagging it for a closer look. Not designed; built from the components. */
function SaleDrawer({
  sale,
  canFlag,
  focusFlag = false,
  onClose,
  onChanged,
}: {
  sale: Sale | null;
  /** Company admins and managers flag; the platform admin only sees the flag. */
  canFlag: boolean;
  /** Opened from the row menu's "Flag for review": the cursor starts in the reason. */
  focusFlag?: boolean;
  onClose: () => void;
  onChanged: (s: Sale) => void;
}) {
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);
  if ((sale?.id ?? null) !== lastId) {
    setLastId(sale?.id ?? null);
    setReason(sale?.flag_reason ?? '');
    setProblem('');
  }
  if (!sale) return <Drawer open={false} onClose={onClose} />;

  const flag = async (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setProblem('Give a reason of at least 5 characters, so the next person knows what to check.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/transactions/${sale.id}/flag`, { reason: reason.trim() });
      onChanged({ ...sale, is_flagged: true, flag_reason: reason.trim() });
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The flag could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  const unflag = async () => {
    setSaving(true);
    try {
      await api.delete(`/transactions/${sale.id}/flag`);
      onChanged({ ...sale, is_flagged: false, flag_reason: null });
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The flag could not be removed.');
    } finally {
      setSaving(false);
    }
  };

  const st = STATUS[sale.sale_status];
  const rows: Array<[string, React.ReactNode]> = [
    ['Time', dateTime(sale.timestamp)],
    ['Pump', sale.pumps ? pointLabel(sale.pumps.pump_number, sale.product_type) : '—'],
    ['Product', productName(sale.product_type)],
    ['Quantity', formatMeter(sale.quantity, sale.unit)],
    ['Price', `${rwf(sale.unit_price)} per ${sale.unit === 'KWH' ? 'kWh' : 'litre'}`],
    ['Amount', rwf(sale.total_amount)],
    ['Payment', PAY[sale.payment_method] ?? sale.payment_method],
    ['Attendant', sale.users?.name ?? '—'],
    ['Plate', sale.vehicle_plate ?? '—'],
    ['Customer phone', sale.customer_phone ?? '—'],
    [
      'Recorded',
      sale.is_offline
        ? `Offline on the phone, received ${dateTime(sale.created_at)}`
        : `Received ${dateTime(sale.created_at)}`,
    ],
  ];

  return (
    <Drawer open onClose={onClose} title="Sale" size="default">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-22 font-semibold text-text">{rwf(sale.total_amount)}</span>
          <StatusChip tone={st.tone}>{st.label}</StatusChip>
        </div>
        {sale.sale_status === 'voided' ? (
          <Banner tone="info" title="Undone by the attendant">
            {sale.void_reason ? `Reason: ${sale.void_reason}. ` : ''}It no longer counts towards any total, and is kept
            here for the record.
          </Banner>
        ) : null}
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-13 text-text-muted">{k}</dt>
              <dd className="m-0 text-14 text-text">{v}</dd>
            </div>
          ))}
        </dl>
        {sale.is_flagged ? (
          <div className="flex flex-col gap-3 rounded-control bg-danger-tint p-4">
            <p className="m-0 flex items-center gap-2 text-14 font-semibold text-danger">
              <Flag size={16} aria-hidden /> Flagged for a closer look
            </p>
            <p className="m-0 text-14 text-text">{sale.flag_reason ?? 'No reason recorded.'}</p>
            {canFlag ? (
              <Button icon={FlagOff} onClick={unflag} loading={saving}>
                Remove flag
              </Button>
            ) : null}
          </div>
        ) : !canFlag ? null : (
          <form onSubmit={flag} noValidate className="flex flex-col gap-3 border-t border-border pt-5">
            <label htmlFor="flag-reason" className="text-13 font-medium text-text-secondary">
              Flag for a closer look
            </label>
            <Input.TextArea
              id="flag-reason"
              autoFocus={focusFlag}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What looks wrong: the amount, the pump, the payment…"
              autoSize={{ minRows: 2, maxRows: 5 }}
              maxLength={500}
              status={problem ? 'error' : undefined}
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem ? 'flag-problem' : undefined}
            />
            {problem ? (
              <p id="flag-problem" className="m-0 text-12 text-danger">
                {problem}
              </p>
            ) : null}
            <Button icon={Flag} htmlType="submit" loading={saving}>
              Flag this sale
            </Button>
          </form>
        )}
      </div>
    </Drawer>
  );
}
