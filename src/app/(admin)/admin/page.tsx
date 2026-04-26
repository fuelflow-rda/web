'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Statistic,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Space,
} from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { formatRWF } from '@/lib/format';
import ComparisonChart from '@/components/charts/ComparisonChart';
import type { StationOverview } from '@/types';

const { Title, Text } = Typography;

type CompanyRow = {
  id: string;
  name: string;
  country?: string;
  created_at?: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  created_at?: string;
};

function SuperAdminOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [recentAdmins, setRecentAdmins] = useState<AdminUserRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesRes, countRes, adminsRes] = await Promise.all([
        api.get('/companies'),
        api.get('/users', { params: { page: 1, limit: 1 } }),
        api.get('/users', {
          params: {
            page: 1,
            limit: 12,
            sortBy: 'created_at',
            sortOrder: 'desc',
            role: 'company_admin',
          },
        }),
      ]);

      const compRaw = Array.isArray(companiesRes.data) ? companiesRes.data : [];
      setCompanies(
        compRaw.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) ?? '',
          country: (c.country as string) ?? undefined,
          created_at: (c.created_at as string) ?? undefined,
        })),
      );

      const countPayload = countRes.data as { pagination?: { total?: number } };
      setUserTotal(countPayload?.pagination?.total ?? 0);

      const adminsPayload = adminsRes.data as { data?: Record<string, unknown>[] };
      const rawAdmins = adminsPayload?.data ?? (Array.isArray(adminsRes.data) ? adminsRes.data : []);
      setRecentAdmins(
        (rawAdmins as Record<string, unknown>[]).map((u) => {
          const companies = u.companies as { name?: string } | null | undefined;
          return {
            id: u.id as string,
            name: (u.name as string) ?? '',
            email: (u.email as string) ?? '',
            role: (u.role as string) ?? '',
            companyName: companies?.name,
            created_at: (u.created_at as string) ?? undefined,
          };
        }),
      );
    } catch {
      setCompanies([]);
      setUserTotal(0);
      setRecentAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const companyColumns: ColumnsType<CompanyRow> = [
    {
      title: 'Company',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" className="text-xs">
            {r.country || '—'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (d: string | undefined) => (d ? dayjs(d).format('MMM D, YYYY') : '—'),
    },
  ];

  const adminColumns: ColumnsType<AdminUserRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined className="text-fuel-orange" />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (n: string | undefined) => n || '—',
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (d: string | undefined) => (d ? dayjs(d).format('MMM D, YYYY') : '—'),
    },
  ];

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
          <Title level={3} className="!mb-0">
            Overview
          </Title>
          <Text type="secondary">Companies and platform users — station metrics are for company admins</Text>
        </div>
        <Space wrap>
          <Button type="primary" icon={<ApartmentOutlined />} onClick={() => router.push('/admin/companies')}>
            Companies
          </Button>
          <Button icon={<TeamOutlined />} onClick={() => router.push('/admin/users')}>
            Users
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="!rounded-xl">
            <Statistic
              title="Companies"
              value={companies.length}
              prefix={<ApartmentOutlined />}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="!rounded-xl">
            <Statistic
              title="Users (all roles)"
              value={userTotal}
              prefix={<TeamOutlined />}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Companies" className="!rounded-xl" extra={<Button type="link" onClick={() => router.push('/admin/companies')}>Open full list</Button>}>
        <Table
          columns={companyColumns}
          dataSource={companies}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (t) => `${t} companies` }}
          size="middle"
          locale={{ emptyText: 'No companies yet. Create one from Companies.' }}
        />
      </Card>

      <Card
        title="Recent company admins"
        className="!rounded-xl"
        extra={<Button type="link" onClick={() => router.push('/admin/users')}>Open users</Button>}
      >
        <Table
          columns={adminColumns}
          dataSource={recentAdmins}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: 'No company admins yet. Invite one from Companies → Add admin.' }}
        />
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, initialized } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [stations, setStations] = useState<StationOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('stationName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchOverview = useCallback(async () => {
    if (isSuperAdmin) return;
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
  }, [search, sortBy, sortOrder, isSuperAdmin]);

  useEffect(() => {
    if (!initialized || !user) return;
    if (isSuperAdmin) {
      setLoading(false);
      return;
    }
    fetchOverview();
  }, [fetchOverview, initialized, user, isSuperAdmin]);

  if (isSuperAdmin) {
    return <SuperAdminOverview />;
  }

  const totalRevenue = stations.reduce((sum, s) => sum + s.todayRevenue, 0);
  const totalTransactions = stations.reduce((sum, s) => sum + s.todayTransactions, 0);

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
