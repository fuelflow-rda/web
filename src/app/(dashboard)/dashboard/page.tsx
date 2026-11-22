'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Segmented } from 'antd';
import { Banknote, Fuel, MapPin, Receipt, Zap } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import ActivityHeatmap from '@/components/metrics/ActivityHeatmap';
import { Banner, KpiTile, PageHeader, Panel } from '@/components/ui';
import { BarChart, type Bar } from '@/components/overview/BarChart';
import {
  getDashboard,
  getLivePumps,
  getRecentSales,
  getToday,
  usePolled,
} from '@/components/overview/data';
import {
  OnShiftPanel,
  PanelError,
  PanelSkeleton,
  PaymentsPanel,
  ProductMixPanel,
  PumpsPanel,
  ReconciliationPanel,
  RecentSalesPanel,
  longDay,
  num,
  rwf,
} from '@/components/overview/panels';
import { ago, delta, kigaliDayStart, reviewBanner, ymd } from '@/components/overview/logic';
import { transactionsHref } from '@/lib/links';
import { isEvProductType, productName } from '@/lib/product-types';
import { useStationStore } from '@/store/station-store';

/** "1,103.2": one decimal, grouped. */
const one = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Range = 'today' | '7d' | '30d' | '90d';
const RANGES: Array<{ value: Range; label: string; days: number }> = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
];

export default function OverviewPage() {
  const router = useRouter();
  const { currentStation, loading: stationsLoading, stations } = useStationStore();
  const stationId = currentStation?.id ?? null;
  const [range, setRange] = useState<Range>('today');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(t);
  }, []);

  const days = RANGES.find((r) => r.value === range)!.days;
  // The window's start moves only when the day or the range does, so polling reuses it.
  const dayStart = kigaliDayStart(now);
  const from = new Date(dayStart - (days - 1) * 86_400_000).toISOString();

  const today = usePolled(stationId, () => getToday(stationId!), 30_000);
  const dash = usePolled(stationId ? `${stationId}|${range}|${from}` : null, () => getDashboard(stationId!, from, new Date().toISOString()), 60_000);
  const pumps = usePolled(stationId, () => getLivePumps(stationId!), 30_000);
  const recent = usePolled(stationId, () => getRecentSales(stationId!), 10_000);

  const t = today.data;
  const d = dash.data;
  const isToday = range === 'today';
  const banner = reviewBanner(t?.reconciliation ?? null);

  const kpis = useMemo(() => {
    if (isToday && t) {
      const fuel = t.kpis.fuelByProduct.map((f) => `${productName(f.productType)} ${one(f.quantity)}`).join(' · ');
      return {
        revenue: t.kpis.revenue,
        revenueDelta: delta(t.kpis.revenueVsYesterday, 'vs yesterday'),
        liters: t.kpis.liters,
        litersMeta: fuel || 'No fuel sold yet',
        kwh: t.kpis.kwh,
        kwhMeta: `${num(t.kpis.chargingSessions)} charging ${t.kpis.chargingSessions === 1 ? 'session' : 'sessions'}`,
        sales: t.kpis.sales,
        salesMeta: `Average ticket ${rwf(t.kpis.avgTicket)}`,
      };
    }
    if (!isToday && d) {
      const fuel = d.productMix.filter((m) => !isEvProductType(m.productType));
      const sessions = d.productMix.filter((m) => isEvProductType(m.productType)).reduce((s, m) => s + m.transactions, 0);
      return {
        revenue: d.totals.revenue,
        revenueDelta: delta(d.deltas.revenue, 'vs the previous period'),
        liters: d.totals.liters,
        litersMeta: fuel.map((f) => `${productName(f.productType)} ${one(f.quantity)}`).join(' · ') || 'No fuel sold',
        kwh: d.totals.kwh,
        kwhMeta: `${num(sessions)} charging ${sessions === 1 ? 'session' : 'sessions'}`,
        sales: d.totals.transactions,
        salesMeta: `Average ticket ${rwf(d.totals.avgTicket)}`,
      };
    }
    return null;
  }, [isToday, t, d]);

  const bars: Bar[] = useMemo(() => {
    if (isToday) {
      const hours = t?.revenueByHour ?? [];
      // The trading day the design shows, widened if a sale fell outside it.
      const active = hours.filter((h) => (h.today ?? 0) > 0 || h.yesterday > 0).map((h) => h.hour);
      const first = Math.min(6, ...active);
      const last = Math.max(22, ...active);
      return hours
        .filter((h) => h.hour >= first && h.hour <= last)
        .map((h) => ({
          label: h.hour % 2 === 0 ? String(h.hour).padStart(2, '0') : null,
          name: `${String(h.hour).padStart(2, '0')}:00`,
          value: h.today,
          highlight: h.inProgress,
        }));
    }
    const series = d?.series ?? [];
    const every = Math.ceil(series.length / 12);
    return series.map((s, i) => {
      const day = new Date(s.bucket);
      return {
        label: i % every === 0 ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Kigali' }).format(day) : null,
        name: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Kigali' }).format(day),
        value: s.revenue,
        highlight: i === series.length - 1,
      };
    });
  }, [isToday, t, d]);

  const exportRows = bars.filter((b) => b.value !== null).map((b) => ({ period: b.name, revenue: b.value ?? 0 }));
  const updated = today.updatedAt ? ` · updated ${ago(now - today.updatedAt)}` : '';

  if (!stationId) {
    return (
      <>
        <PageHeader title="Overview" />
        {stationsLoading ? (
          <PanelSkeleton />
        ) : (
          <Panel title={stations.length ? 'Choose a station' : 'No stations yet'}>
            <p className="m-0 flex items-center gap-2 text-14 text-text-secondary">
              <MapPin size={16} aria-hidden />
              {stations.length
                ? 'Pick a station in the sidebar to see its day.'
                : 'Once your company has a station, its sales, pumps and shifts appear here.'}
            </p>
          </Panel>
        )}
      </>
    );
  }

  const chartLoading = isToday ? today.loading && !t : dash.loading && !d;
  const chartError = isToday ? (!t ? today.error : null) : !d ? dash.error : null;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${currentStation?.name} · ${longDay(new Date(now).toISOString())}${updated}`}
        actions={
          <>
            <Segmented<Range>
              aria-label="Period"
              value={range}
              onChange={setRange}
              options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
            />
            <ExportButton
              data={exportRows}
              columns={[
                { header: isToday ? 'Hour' : 'Day', key: 'period' },
                { header: 'Revenue (RWF)', key: 'revenue' },
              ]}
              filename={`${currentStation?.name ?? 'station'}-overview-${ymd(dayStart)}`}
            />
          </>
        }
      />

      {banner ? (
        <Banner
          tone="danger"
          title={banner.title}
          action={{ label: 'Open reconciliation', onClick: () => router.push(`/reconciliation?date=${banner.date}`) }}
        >
          {banner.body}
        </Banner>
      ) : null}
      {today.error && t ? <Banner tone="warning" title="Showing the last figures received; the latest could not be loaded." /> : null}

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis ? (
          <>
            <KpiTile label={isToday ? 'Revenue today' : 'Revenue'} icon={Banknote} prefix="RWF" value={num(kpis.revenue)} delta={kpis.revenueDelta ?? { text: 'Nothing to compare with yet', direction: 'flat' }} href={transactionsHref({ from: ymd(new Date(from).getTime()), to: ymd(now) })} />
            <KpiTile label="Fuel dispensed" icon={Fuel} value={one(kpis.liters)} suffix="L" delta={{ text: kpis.litersMeta, direction: 'flat' }} />
            <KpiTile label="Energy delivered" icon={Zap} value={one(kpis.kwh)} suffix="kWh" delta={{ text: kpis.kwhMeta, direction: 'flat' }} />
            <KpiTile label="Sales" icon={Receipt} value={num(kpis.sales)} delta={{ text: kpis.salesMeta, direction: 'flat' }} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-32.5 animate-pulse rounded-card border border-border bg-surface motion-reduce:animate-none" />
          ))
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel
          title={isToday ? 'Revenue by hour' : 'Revenue by day'}
          meta={
            isToday
              ? t
                ? `RWF, today against yesterday's total of ${rwf(t.kpis.yesterdayRevenue)}`
                : 'RWF'
              : 'RWF, each day of the period'
          }
          action={{ label: 'Open transactions', href: '/transactions' }}
          className="self-start"
        >
          <div className="flex flex-col gap-4">
            <div aria-hidden className="flex flex-wrap gap-5 text-12 text-text-secondary">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-indicator bg-primary" /> {isToday ? 'Completed hours' : 'Completed days'}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-indicator bg-accent" /> {isToday ? 'Current hour, in progress' : 'Today, in progress'}
              </span>
            </div>
            {chartError ? (
              <PanelError message="Revenue could not be loaded." onRetry={isToday ? today.reload : dash.reload} />
            ) : chartLoading ? (
              <div className="h-59 animate-pulse rounded-control bg-surface-muted motion-reduce:animate-none" />
            ) : (
              <BarChart
                bars={bars}
                format={rwf}
                summary={
                  isToday
                    ? `Revenue by hour today: ${rwf(t?.kpis.revenue ?? 0)} so far, against ${rwf(t?.kpis.yesterdayRevenue ?? 0)} for all of yesterday.`
                    : `Revenue by day over ${days} days: ${rwf(d?.totals.revenue ?? 0)} in all.`
                }
              />
            )}
          </div>
        </Panel>
        <ReconciliationPanel summary={t ? t.reconciliation : undefined} loading={today.loading} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProductMixPanel
          mix={d?.productMix}
          loading={dash.loading}
          error={dash.error}
          onRetry={dash.reload}
          meta={isToday ? 'Share of revenue today' : 'Share of revenue in the period'}
        />
        <PaymentsPanel payments={d?.payments} sales={d?.totals.transactions} loading={dash.loading} error={dash.error} onRetry={dash.reload} />
        <PumpsPanel pumps={pumps.data} loading={pumps.loading} error={pumps.error} onRetry={pumps.reload} />
      </div>

      {!isToday ? (
        <Panel title="Activity by hour" meta="Sales by weekday and hour, in Kigali time">
          {d ? (
            <ActivityHeatmap
              data={d.heatmap}
              hrefFor={(dow, hour) =>
                transactionsHref({ from: ymd(new Date(from).getTime()), to: ymd(now), dow: dow ?? undefined, hour })
              }
            />
          ) : (
            <PanelSkeleton />
          )}
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RecentSalesPanel sales={recent.data} loading={recent.loading} error={recent.error} onRetry={recent.reload} />
        <OnShiftPanel shifts={t?.onShift} loading={today.loading} />
      </div>
    </>
  );
}
