'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Spin, Statistic, Table, Tag, Input, Select } from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import ComparisonChart from '@/components/charts/ComparisonChart';
import type { StationOverview } from '@/types';

const { Title, Text } = Typography;

export default function AdminDashboardPage() {
  const [stations, setStations] = useState<StationOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('stationName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/overview', {
        params: { search: search || undefined, sortBy, sortOrder },
      });
      setStations(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const totalRevenue = stations.reduce((sum, s) => sum + s.todayRevenue, 0);
  const totalTransactions = stations.reduce((sum, s) => sum + s.todayTransactions, 0);
  const totalLiters = stations.reduce((sum, s) => sum + s.todayLiters, 0);

  const columns: ColumnsType<StationOverview> = [
    {
      title: 'Station',
      dataIndex: 'stationName',
      key: 'stationName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Today's Revenue",
      dataIndex: 'todayRevenue',
      key: 'todayRevenue',
      sorter: (a, b) => a.todayRevenue - b.todayRevenue,
      align: 'right',
      render: (v: number) => <Text strong>{formatRWF(v)}</Text>,
    },
    {
      title: 'Transactions',
      dataIndex: 'todayTransactions',
      key: 'todayTransactions',
      sorter: (a, b) => a.todayTransactions - b.todayTransactions,
      align: 'right',
    },
    {
      title: 'Liters Sold',
      dataIndex: 'todayLiters',
      key: 'todayLiters',
      sorter: (a, b) => a.todayLiters - b.todayLiters,
      align: 'right',
      render: (v: number) => `${v.toLocaleString()} L`,
    },
    {
      title: 'Active Pumps',
      dataIndex: 'activePumps',
      key: 'activePumps',
      align: 'center',
      render: (v: number) => <Tag color={v > 0 ? 'green' : 'default'}>{v}</Tag>,
    },
  ];

  const chartData = stations.map((s) => ({
    name: s.stationName,
    Revenue: s.todayRevenue,
    Transactions: s.todayTransactions,
    Liters: s.todayLiters,
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-0">Company Overview</Title>
          <Text type="secondary">Cross-station performance for today</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input.Search
            placeholder="Search station name"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => fetchOverview()}
            className="w-48"
          />
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            options={[
              { value: 'stationName', label: 'Station' },
              { value: 'todayRevenue', label: 'Revenue' },
              { value: 'todayTransactions', label: 'Transactions' },
              { value: 'todayLiters', label: 'Liters' },
              { value: 'activePumps', label: 'Active pumps' },
            ]}
            className="w-36"
          />
          <Select
            value={sortOrder}
            onChange={(v) => setSortOrder(v as 'asc' | 'desc')}
            options={[
              { value: 'asc', label: 'Asc' },
              { value: 'desc', label: 'Desc' },
            ]}
            className="w-24"
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="!rounded-xl">
            <Statistic
              title="Total Revenue Today"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              suffix="RWF"
              valueStyle={{ color: '#F97316', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="!rounded-xl">
            <Statistic
              title="Total Transactions"
              value={totalTransactions}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="!rounded-xl">
            <Statistic
              title="Active Stations"
              value={stations.length}
              prefix={<BankOutlined />}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {stations.map((station) => (
          <Col xs={24} sm={12} lg={8} key={station.stationId}>
            <Card className="!rounded-xl hover:shadow-lg transition-shadow" bodyStyle={{ padding: 20 }}>
              <div className="flex items-center justify-between mb-3">
                <Text strong className="text-base">{station.stationName}</Text>
                <Tag color={station.activePumps > 0 ? 'green' : 'default'}>
                  {station.activePumps} pumps active
                </Tag>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Revenue"
                    value={station.todayRevenue}
                    prefix="RWF"
                    valueStyle={{ fontSize: 18, fontWeight: 600 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Transactions"
                    value={station.todayTransactions}
                    valueStyle={{ fontSize: 18, fontWeight: 600 }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Station Comparison" className="!rounded-xl">
        <ComparisonChart data={chartData} labels={['Revenue', 'Transactions', 'Liters']} />
      </Card>

      <Card title="Station Details" className="!rounded-xl">
        <Table
          columns={columns}
          dataSource={stations}
          rowKey="stationId"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
