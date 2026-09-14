'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Progress, Row, Segmented, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { formatQuantity, isEvProductType, productColor, productLabel } from '@/lib/product-types';
import { useStationStore } from '@/store/station-store';
import MetricTile from '@/components/metrics/MetricTile';
import ActivityHeatmap, { type HeatCell } from '@/components/metrics/ActivityHeatmap';
import ProductMixBar, { type ProductMixRow } from '@/components/metrics/ProductMixBar';
import RevenueChart from '@/components/charts/RevenueChart';
import type { ProductType, ProductUnit } from '@/types';

const { Title, Text } = Typography;

type Period = 'today' | 'week' | 'month' | 'quarter';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
  { value: 'quarter', label: '90 days' },
];

function windowFor(period: Period): { from: string; to: string } {
  const to = dayjs();
  const from =
    period === 'today'
      ? to.startOf('day')
      : period === 'week'
        ? to.subtract(6, 'day').startOf('day')
        : period === 'month'
          ? to.subtract(29, 'day').startOf('day')
          : to.subtract(89, 'day').startOf('day');
  return { from: from.toISOString(), to: to.toISOString() };
}

interface DashboardPayload {
  window: { from: string; to: string; bucket: string; tz: string };
  totals: {
    revenue: number;
    transactions: number;
    liters: number;
    kwh: number;
    avgTicket: number;
    flagged: number;
    offline: number;
  };
  deltas: {
    revenue: number | null;
    transactions: number | null;
    liters: number | null;
    kwh: number | null;
    avgTicket: number | null;
  };
  payments: { method: string; amount: number }[];
  series: { bucket: string; revenue: number; transactions: number; liters: number; kwh: number }[];
  heatmap: HeatCell[];
  productMix: ProductMixRow[];
  attendants: {
    attendantId: string | null;
    name: string;
    revenue: number;
    transactions: number;
    liters: number;
    kwh: number;
    avgTicket: number;
    flagged: number;
  }[];
  pumps: {
    pumpId: string;
    pumpNumber: number;
    productType: ProductType;
    label: string;
    connectorType: string | null;
    powerKw: number | null;
    unit: ProductUnit;
    revenue: number;
    transactions: number;
    quantity: number;
    utilisation: number | null;
  }[];
}

/** Compact money for tiles, where the full figure would dominate the layout. */
function compactRWF(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(Math.round(amount));
}

export default function DashboardPage() {
  const { currentStation } = useStationStore();
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentStation) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { from, to } = windowFor(period);
      const res = await api.get(`/analytics/station/${currentStation.id}/dashboard`, {
        params: { from, to },
      });
      setData(res.data as DashboardPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentStation, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh while the tab is visible; a background tab does not need to poll.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const revenueSpark = useMemo(() => data?.series.map((s) => s.revenue) ?? [], [data]);
  const txSpark = useMemo(() => data?.series.map((s) => s.transactions) ?? [], [data]);
  const litersSpark = useMemo(() => data?.series.map((s) => s.liters) ?? [], [data]);
  const kwhSpark = useMemo(() => data?.series.map((s) => s.kwh) ?? [], [data]);

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((s) => ({
        hour: dayjs(s.bucket).format(data?.window.bucket === 'hour' ? 'HH:mm' : 'MMM D'),
        revenue: s.revenue,
        liters: s.liters,
        kwh: s.kwh,
      })),
    [data],
  );

  const totalPayments = (data?.payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const evPumps = (data?.pumps ?? []).filter((p) => isEvProductType(p.productType));

  const attendantColumns: ColumnsType<DashboardPayload['attendants'][number]> = [
    {
      title: '#',
      key: 'rank',
      width: 44,
      render: (_: unknown, __: unknown, index: number) => (
        <span className="text-ink-muted tabular-nums text-xs">{index + 1}</span>
      ),
    },
    {
      title: 'Attendant',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r) => (
        <span className="font-medium text-ink">
          {name}
          {r.flagged > 0 && (
            <Tag className="!ml-2 !text-[10px]" color="warning">
              {r.flagged} flagged
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'transactions',
      key: 'transactions',
      align: 'right',
      width: 80,
      sorter: (a, b) => a.transactions - b.transactions,
      render: (v: number) => <span className="tabular-nums">{v.toLocaleString()}</span>,
    },
    {
      title: 'Avg ticket',
      dataIndex: 'avgTicket',
      key: 'avgTicket',
      align: 'right',
      width: 120,
      sorter: (a, b) => a.avgTicket - b.avgTicket,
      render: (v: number) => <span className="tabular-nums text-ink-muted">{formatRWF(v)}</span>,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      width: 140,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (v: number) => <span className="font-semibold tabular-nums">{formatRWF(v)}</span>,
    },
  ];

  if (!currentStation) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description={<span className="text-ink-muted">Select a station to see its dashboard</span>} />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Title level={3} className="!mb-0">
              {currentStation.name}
            </Title>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-tint rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-xs font-semibold text-accent">Live</span>
            </span>
          </div>
          <Text type="secondary" className="!text-sm">
            {data
              ? `${dayjs(data.window.from).format('MMM D')} – ${dayjs(data.window.to).format('MMM D, YYYY')}`
              : 'Loading…'}
          </Text>
        </div>
        <Segmented value={period} onChange={(v) => setPeriod(v as Period)} options={PERIODS} />
      </div>

      {error && (
        <Card className="!rounded-card" size="small">
          <Text type="danger">{error}</Text>
        </Card>
      )}

      {/* Headline metrics. Deltas compare with the previous window of equal length. */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <MetricTile
            label="Revenue"
            value={`RWF ${compactRWF(data?.totals.revenue ?? 0)}`}
            delta={data?.deltas.revenue}
            spark={revenueSpark}
            accent="var(--accent)"
            detail={`${(data?.totals.transactions ?? 0).toLocaleString()} sales · avg ${formatRWF(data?.totals.avgTicket ?? 0)}`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricTile
            label="Fuel dispensed"
            value={`${Math.round(data?.totals.liters ?? 0).toLocaleString()} L`}
            delta={data?.deltas.liters}
            spark={litersSpark}
            accent="var(--product-diesel)"
            detail="Gasoline and diesel combined"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricTile
            label="Energy delivered"
            value={`${Math.round(data?.totals.kwh ?? 0).toLocaleString()} kWh`}
            delta={data?.deltas.kwh}
            spark={kwhSpark}
            accent="var(--product-ev-dc-fast)"
            detail={
              evPumps.length > 0
                ? `${evPumps.length} charge point${evPumps.length === 1 ? '' : 's'}`
                : 'No charge points yet'
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <MetricTile
            label="Transactions"
            value={(data?.totals.transactions ?? 0).toLocaleString()}
            delta={data?.deltas.transactions}
            spark={txSpark}
            accent="var(--chart-5)"
            detail={
              <>
                {data?.totals.flagged ? `${data.totals.flagged} flagged · ` : ''}
                {data?.totals.offline ? `${data.totals.offline} synced offline` : 'all synced live'}
              </>
            }
          />
        </Col>
      </Row>

      {/* Trend + product mix */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Revenue trend" className="!rounded-card h-full" size="small">
            <RevenueChart data={chartData} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Product mix" className="!rounded-card h-full" size="small">
            <ProductMixBar data={data?.productMix ?? []} />
          </Card>
        </Col>
      </Row>

      {/* When the forecourt is actually busy */}
      <Card
        title="Activity by hour"
        className="!rounded-card"
        size="small"
        extra={
          <Text type="secondary" className="!text-xs">
            Local time · darker is busier
          </Text>
        }
      >
        <ActivityHeatmap data={data?.heatmap ?? []} />
      </Card>

      {/* Rankings */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Attendant performance" className="!rounded-card h-full" size="small">
            <Table
              columns={attendantColumns}
              dataSource={data?.attendants ?? []}
              rowKey={(r) => r.attendantId ?? r.name}
              size="small"
              pagination={false}
              scroll={(data?.attendants.length ?? 0) > 8 ? { y: 320 } : undefined}
              locale={{ emptyText: 'No attendant activity in this period' }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title="Dispensing points"
            className="!rounded-card h-full"
            size="small"
            extra={
              <Text type="secondary" className="!text-xs">
                Utilisation shown for chargers
              </Text>
            }
          >
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {(data?.pumps ?? []).length === 0 && (
                <Empty description={<span className="text-ink-muted">No pumps configured</span>} />
              )}
              {(data?.pumps ?? []).map((pump) => {
                const isEv = isEvProductType(pump.productType);
                return (
                  <div
                    key={pump.pumpId}
                    className="flex items-center gap-3 py-2 border-b border-line-subtle last:border-0"
                  >
                    <span
                      className="w-1 h-9 rounded-full shrink-0"
                      style={{ background: productColor(pump.productType) }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink truncate">
                        {isEv ? 'Charger' : 'Pump'} #{pump.pumpNumber}
                        <span className="text-ink-muted font-normal">
                          {' · '}
                          {productLabel(pump.productType)}
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted tabular-nums">
                        {pump.transactions.toLocaleString()} sales ·{' '}
                        {formatQuantity(pump.quantity, pump.unit, 0)}
                        {isEv && pump.powerKw ? ` · ${pump.powerKw} kW` : ''}
                      </div>
                    </div>

                    {/* Only chargers have a rated capacity to be measured against. */}
                    {isEv && pump.utilisation != null && (
                      <div className="w-20 shrink-0">
                        <Progress
                          percent={Math.min(pump.utilisation, 100)}
                          size="small"
                          strokeColor={productColor(pump.productType)}
                          format={(p) => <span className="text-[10px] tabular-nums">{p}%</span>}
                        />
                      </div>
                    )}

                    <span className="text-sm font-semibold tabular-nums text-ink w-24 text-right shrink-0">
                      {formatRWF(pump.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Payment split */}
      <Card title="How customers paid" className="!rounded-card" size="small">
        <Row gutter={[16, 16]}>
          {(data?.payments ?? []).map((p) => {
            const share = totalPayments > 0 ? (p.amount / totalPayments) * 100 : 0;
            return (
              <Col xs={24} sm={8} key={p.method}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium text-ink">{p.method}</span>
                  <span className="text-xs text-ink-muted tabular-nums">{share.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, background: 'var(--accent)' }}
                  />
                </div>
                <div className="text-sm font-semibold tabular-nums text-ink mt-1.5">
                  {formatRWF(p.amount)}
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
}
