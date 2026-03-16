'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Alert, Typography, Spin, Segmented } from 'antd';
import {
  DollarOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStationStore } from '@/store/station-store';
import api from '@/lib/api';
import type { DashboardStats, Pump, Transaction } from '@/types';
import StatsCard from '@/components/StatsCard';
import PumpCard from '@/components/PumpCard';
import TransactionFeed from '@/components/TransactionFeed';
import RevenueChart from '@/components/charts/RevenueChart';

const { Title, Text } = Typography;

export type OverviewPeriod = 'today' | 'week' | 'month' | 'year';

function getRange(period: OverviewPeriod): { from: string; to: string } {
  const to = dayjs().format('YYYY-MM-DD');
  if (period === 'today') return { from: to, to };
  if (period === 'week') return { from: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), to };
  if (period === 'month') return { from: dayjs().subtract(29, 'day').format('YYYY-MM-DD'), to };
  return { from: dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD'), to };
}

function periodLabel(period: OverviewPeriod): string {
  switch (period) {
    case 'today': return "Today's Performance";
    case 'week': return "This Week's Performance";
    case 'month': return "This Month's Performance";
    case 'year': return "This Year's Performance";
  }
}

function chartTitle(period: OverviewPeriod): string {
  switch (period) {
    case 'today': return 'Revenue Today';
    case 'week': return 'Revenue This Week';
    case 'month': return 'Revenue This Month';
    case 'year': return 'Revenue This Year';
  }
}

export default function DashboardPage() {
  const { currentStation } = useStationStore();
  const [period, setPeriod] = useState<OverviewPeriod>('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [inactivePumps, setInactivePumps] = useState<Pump[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!currentStation) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { from, to } = getRange(period);
    try {
      const [overviewRes, pumpsRes, txRes] = await Promise.all([
        api.get(`/stations/${currentStation.id}/overview`, { params: { from, to } }),
        api.get(`/pumps`, { params: { stationId: currentStation.id } }),
        api.get(`/transactions`, {
          params: { station_id: currentStation.id, limit: 20, page: 1, sortBy: 'timestamp', sortOrder: 'desc' },
        }),
      ]);
      const overview = overviewRes.data as {
        station?: { pumps?: unknown[] };
        today?: {
          total_revenue: number;
          total_liters_petrol: number;
          total_liters_diesel: number;
          total_transactions: number;
        };
        active_shifts?: Array<{ pump_id: string; attendant_id: string; users?: { id: string; name: string } | null }>;
        revenue_by_hour?: { hour: string; revenue: number; liters: number }[];
      };
      const today = (overview?.today ?? {}) as { total_liters_petrol?: number; total_liters_diesel?: number; total_revenue?: number; total_transactions?: number };
      const totalLiters = (today.total_liters_petrol ?? 0) + (today.total_liters_diesel ?? 0);
      const pumpsPayload = pumpsRes.data as { data?: unknown[] };
      const rawPumps = pumpsPayload?.data ?? (Array.isArray(pumpsRes.data) ? pumpsRes.data : []);
      const activeShiftByPumpId: Record<string, { attendantId: string; attendantName: string }> = {};
      for (const shift of overview?.active_shifts ?? []) {
        const pumpId = (shift as { pump_id?: string }).pump_id;
        if (pumpId) {
          const users = (shift as { users?: { id: string; name: string } | null }).users;
          activeShiftByPumpId[pumpId] = {
            attendantId: (shift as { attendant_id: string }).attendant_id,
            attendantName: users?.name ?? 'Attendant',
          };
        }
      }
      const pumpsMapped: Pump[] = rawPumps.map((p) => {
        const r = p as Record<string, unknown>;
        const pumpId = r.id as string;
        const activeShift = activeShiftByPumpId[pumpId];
        return {
          id: pumpId,
          stationId: r.station_id as string,
          pumpNumber: Number(r.pump_number) ?? 0,
          fuelType: (r.fuel_type as Pump['fuelType']) ?? 'PETROL',
          status: (r.status as Pump['status']) ?? 'ACTIVE',
          currentAttendantId: activeShift?.attendantId,
          currentAttendant: activeShift ? { id: activeShift.attendantId, name: activeShift.attendantName, email: '', role: 'ATTENDANT' as const, isActive: true, createdAt: '', updatedAt: '' } : undefined,
          createdAt: (r.created_at as string) ?? '',
          updatedAt: (r.updated_at as string) ?? '',
        };
      });
      setPumps(pumpsMapped);

      setStats({
        totalRevenue: today.total_revenue ?? 0,
        totalLiters,
        totalTransactions: today.total_transactions ?? 0,
        activePumps: Array.isArray(overview?.active_shifts) ? overview.active_shifts.length : 0,
        totalPumps: pumpsMapped.length,
        revenueByHour: Array.isArray(overview?.revenue_by_hour) ? overview.revenue_by_hour : [],
      });

      const txPayload = txRes.data as { data?: unknown[] } | unknown[];
      const rawTx = Array.isArray(txPayload) ? txPayload : txPayload?.data ?? [];
      const txMapped: Transaction[] = rawTx.map((t) => {
        const r = t as Record<string, unknown>;
        return {
          id: r.id as string,
          stationId: r.station_id as string,
          pumpId: r.pump_id as string,
          attendantId: r.attendant_id as string,
          fuelType: (r.fuel_type as Transaction['fuelType']) ?? 'PETROL',
          liters: Number(r.liters) ?? 0,
          pricePerLiter: Number(r.price_per_liter) ?? 0,
          totalAmount: Number(r.total_amount) ?? 0,
          paymentMethod: (r.payment_method as Transaction['paymentMethod']) ?? 'CASH',
          isFlagged: Boolean(r.is_flagged),
          createdAt: (r.timestamp ?? r.created_at) as string,
          updatedAt: (r.updated_at ?? r.timestamp) as string,
        };
      });
      setRecentTransactions(txMapped);

      const inactive = pumpsMapped.filter((p) => p.status === 'ACTIVE' && !p.currentAttendantId);
      setInactivePumps(inactive);
    } catch {
      setStats(null);
      setPumps([]);
      setRecentTransactions([]);
      setInactivePumps([]);
    } finally {
      setLoading(false);
    }
  }, [currentStation, period]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Title level={3} className="!mb-0 !text-slate-800">
              Station Overview
            </Title>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600">Live</span>
            </div>
          </div>
          <Text className="!text-slate-400">
            {currentStation?.name || 'Select a station'} &mdash; {periodLabel(period)}
          </Text>
        </div>
        <Segmented
          value={period}
          onChange={(v) => setPeriod((v as OverviewPeriod) || 'today')}
          options={[
            { label: 'Today', value: 'today' },
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'This Year', value: 'year' },
          ]}
          className="!rounded-xl"
        />
      </div>

      {/* Inactive Pump Alert */}
      {inactivePumps.length > 0 && (
        <Alert
          message={
            <span className="font-semibold">Inactive Pump Alert</span>
          }
          description={`${inactivePumps.length} pump(s) have had no activity for 30+ minutes: ${inactivePumps.map((p) => `Pump #${p.pumpNumber}`).join(', ')}`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          closable
          className="!rounded-2xl !border-orange-200 !bg-orange-50/80"
        />
      )}

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Revenue"
            value={stats?.totalRevenue || 0}
            prefix="RWF"
            icon={<DollarOutlined />}
            color="#F97316"
            trend={12.5}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Liters"
            value={stats?.totalLiters || 0}
            suffix="L"
            icon={<DashboardOutlined />}
            color="#3B82F6"
            trend={8.2}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Transactions"
            value={stats?.totalTransactions || 0}
            icon={<ShoppingCartOutlined />}
            color="#8B5CF6"
            trend={5.1}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Active Pumps"
            value={stats?.activePumps || 0}
            suffix={`/ ${stats?.totalPumps || 0}`}
            icon={<ThunderboltOutlined />}
            color="#10B981"
          />
        </Col>
      </Row>

      {/* Charts + Feed Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-400 to-orange-600" />
                <span>{chartTitle(period)}</span>
              </div>
            }
            className="!rounded-2xl"
          >
            <RevenueChart data={stats?.revenueByHour || []} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
                <span>Recent Transactions</span>
              </div>
            }
            className="!rounded-2xl"
            bodyStyle={{ padding: 0 }}
          >
            <TransactionFeed transactions={recentTransactions} />
          </Card>
        </Col>
      </Row>

      {/* Pump Status */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <Title level={4} className="!mb-0 !text-slate-800">Pump Status</Title>
        </div>
        <Row gutter={[16, 16]}>
          {pumps.map((pump) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={pump.id}>
              <PumpCard pump={pump} />
            </Col>
          ))}
          {pumps.length === 0 && (
            <Col span={24}>
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <ThunderboltOutlined className="text-4xl text-slate-200 mb-3" />
                <Text className="!text-slate-400 block">No pumps configured for this station.</Text>
              </div>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
}
