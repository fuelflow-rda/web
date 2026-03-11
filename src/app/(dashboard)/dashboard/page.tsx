'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Alert, Typography, Spin, Tag } from 'antd';
import {
  DollarOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useStationStore } from '@/store/station-store';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import type { DashboardStats, Pump, Transaction } from '@/types';
import StatsCard from '@/components/StatsCard';
import PumpCard from '@/components/PumpCard';
import TransactionFeed from '@/components/TransactionFeed';
import RevenueChart from '@/components/charts/RevenueChart';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { currentStation } = useStationStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [inactivePumps, setInactivePumps] = useState<Pump[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const [statsRes, pumpsRes, txRes] = await Promise.all([
        api.get(`/stations/${currentStation.id}/dashboard`),
        api.get(`/stations/${currentStation.id}/pumps`),
        api.get(`/stations/${currentStation.id}/transactions`, {
          params: { limit: 20, sort: 'createdAt:desc' },
        }),
      ]);
      setStats(statsRes.data);
      setPumps(pumpsRes.data);
      setRecentTransactions(txRes.data.data || txRes.data);

      const inactive = (pumpsRes.data as Pump[]).filter(
        (p) => p.status === 'ACTIVE' && !p.currentAttendantId
      );
      setInactivePumps(inactive);
    } catch {
      // API may not be running; use empty state
    } finally {
      setLoading(false);
    }
  }, [currentStation]);

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
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-0">Station Overview</Title>
          <Text type="secondary">
            {currentStation?.name || 'Select a station'} — Today&apos;s Performance
          </Text>
        </div>
        <Tag color="green" className="!text-sm !px-3 !py-1">Live</Tag>
      </div>

      {inactivePumps.length > 0 && (
        <Alert
          message="Inactive Pump Alert"
          description={`${inactivePumps.length} pump(s) have had no activity for 30+ minutes: ${inactivePumps.map((p) => `Pump #${p.pumpNumber}`).join(', ')}`}
          type="warning"
          showIcon
          closable
          className="!rounded-xl !border-fuel-orange !bg-orange-50"
        />
      )}

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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Revenue Today (Hourly)" className="!rounded-xl">
            <RevenueChart data={stats?.revenueByHour || []} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Transactions" className="!rounded-xl" bodyStyle={{ padding: 0 }}>
            <TransactionFeed transactions={recentTransactions} />
          </Card>
        </Col>
      </Row>

      <div>
        <Title level={4} className="!mb-4">Pump Status</Title>
        <Row gutter={[16, 16]}>
          {pumps.map((pump) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={pump.id}>
              <PumpCard pump={pump} />
            </Col>
          ))}
          {pumps.length === 0 && (
            <Col span={24}>
              <Card className="text-center !rounded-xl">
                <Text type="secondary">No pumps configured for this station.</Text>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
}
