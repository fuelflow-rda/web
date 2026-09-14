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
  Segmented,
  Progress,
  Alert,
} from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  RightOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { formatRWF } from '@/lib/format';
import ComparisonChart from '@/components/charts/ComparisonChart';
import PlatformTrendChart, { type PlatformTrendPoint } from '@/components/charts/PlatformTrendChart';
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
  companyId?: string;
  companyName?: string;
  created_at?: string;
};

/** A demo request from the public site, delivered as a notification. */
type LeadRow = {
  id: string;
  company: string;
  details: string;
  isRead: boolean;
  createdAt: string;
};

const LEAD_TITLE_PREFIX = 'Demo request: ';

type PlatformTotals = {
  companies: number;
  stations: number;
  pumps: number;
  ev_points: number;
  users: number;
  attendants: number;
  managers: number;
  company_admins: number;
  active_shifts: number;
  revenue: number;
  transactions: number;
  liters: number;
  kwh: number;
  avg_ticket: number;
};

type CompanyRank = {
  company_id: string;
  company_name: string;
  stations: number;
  revenue: number;
  transactions: number;
  liters: number;
  kwh: number;
};

/** Ranking row joined with the registry details (country, created date). */
type CompanyMerged = CompanyRank & {
  country?: string;
  created_at?: string;
};

const num = (v: unknown) => Number(v ?? 0) || 0;

/**
 * A stat tile that navigates. Rendered as a real <button> so it is keyboard reachable
 * and announced as a control — a div with onClick looks identical and is neither.
 */
function StatTile({
  title,
  value,
  hint,
  icon,
  onClick,
  accent,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
}) {
  const card = (
    <Card
      className={`!rounded-xl h-full ${onClick ? 'hover:shadow-lg hover:border-accent transition-all' : ''}`}
      bodyStyle={{ padding: 16 }}
    >
      <Statistic
        title={<span className="text-xs uppercase tracking-wide">{title}</span>}
        value={value as string | number}
        prefix={icon}
        valueStyle={{
          fontWeight: 700,
          fontSize: 21,
          ...(accent ? { color: 'var(--accent)' } : {}),
        }}
      />
      {hint && (
        <Text type="secondary" className="!text-xs block mt-1">
          {hint}
        </Text>
      )}
    </Card>
  );

  if (!onClick) return card;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full h-full text-left bg-transparent border-0 p-0 cursor-pointer"
    >
      {card}
    </button>
  );
}

/**
 * One inventory count inside the shared strip.
 *
 * These four were previously four full cards taking a whole row for four numbers.
 * Grouped into a single strip they read as one set — "what exists on the platform" —
 * and give the tables back the vertical space.
 */
function CountCell({
  label,
  value,
  hint,
  icon,
  onClick,
  last,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  /** Omitted where a superadmin has no page to go to — see the note at the call site. */
  onClick?: () => void;
  last?: boolean;
}) {
  const shared = `flex-1 min-w-[150px] text-left px-5 py-4 ${
    last ? '' : 'md:border-r md:border-line-subtle'
  }`;

  const body = (
    <>
      <div className="flex items-center gap-2 text-ink-muted text-xs uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className="text-ink text-2xl font-bold leading-none">{value.toLocaleString()}</div>
      {hint && <div className="text-ink-muted text-xs mt-1.5">{hint}</div>}
    </>
  );

  // Only render a control when there is somewhere to go. A button that looks clickable
  // and does nothing is worse than plain text.
  if (!onClick) return <div className={shared}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shared} bg-transparent border-0 cursor-pointer hover:bg-surface-muted transition-colors`}
    >
      {body}
    </button>
  );
}

function SuperAdminOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [recentAdmins, setRecentAdmins] = useState<AdminUserRow[]>([]);
  const [totals, setTotals] = useState<PlatformTotals | null>(null);
  const [today, setToday] = useState<PlatformTotals | null>(null);
  const [ranking, setRanking] = useState<CompanyRank[]>([]);
  const [series, setSeries] = useState<PlatformTrendPoint[]>([]);
  const [statsError, setStatsError] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  const markLeadHandled = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, isRead: true } : l)));
    } catch {
      // The row simply stays unread; nothing else depends on it.
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setStatsError(false);
    try {
      const [companiesRes, adminsRes, statsRes, leadsRes] = await Promise.all([
        api.get('/companies'),
        api.get('/users', {
          params: {
            page: 1,
            limit: 12,
            sortBy: 'created_at',
            sortOrder: 'desc',
            role: 'company_admin',
          },
        }),
        api.get('/admin/platform-stats', { params: { days } }).catch(() => null),
        api
          .get('/notifications', { params: { search: LEAD_TITLE_PREFIX, limit: 20 } })
          .catch(() => null),
      ]);

      const leadsPayload = leadsRes?.data as { data?: Record<string, unknown>[] } | undefined;
      const rawLeads = leadsPayload?.data ?? (Array.isArray(leadsRes?.data) ? leadsRes!.data : []);
      setLeads(
        (rawLeads as Record<string, unknown>[])
          .filter((n) => String(n.title ?? '').startsWith(LEAD_TITLE_PREFIX))
          .map((n) => ({
            id: n.id as string,
            company: String(n.title).slice(LEAD_TITLE_PREFIX.length),
            details: (n.message as string) ?? '',
            isRead: Boolean(n.is_read ?? n.isRead),
            createdAt: (n.created_at ?? n.createdAt) as string,
          })),
      );

      const compRaw = Array.isArray(companiesRes.data) ? companiesRes.data : [];
      setCompanies(
        compRaw.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) ?? '',
          country: (c.country as string) ?? undefined,
          created_at: (c.created_at as string) ?? undefined,
        })),
      );

      const adminsPayload = adminsRes.data as { data?: Record<string, unknown>[] };
      const rawAdmins = adminsPayload?.data ?? (Array.isArray(adminsRes.data) ? adminsRes.data : []);
      setRecentAdmins(
        (rawAdmins as Record<string, unknown>[]).map((u) => {
          const company = u.companies as { name?: string } | null | undefined;
          return {
            id: u.id as string,
            name: (u.name as string) ?? '',
            email: (u.email as string) ?? '',
            role: (u.role as string) ?? '',
            companyId: (u.company_id as string) ?? undefined,
            companyName: company?.name,
            created_at: (u.created_at as string) ?? undefined,
          };
        }),
      );

      // Stats come from a separate endpoint and are allowed to fail on their own: the
      // company and user lists are still worth showing if the aggregate query is down.
      if (!statsRes) {
        setStatsError(true);
        setTotals(null);
        setToday(null);
        setRanking([]);
        setSeries([]);
      } else {
        const payload = statsRes.data as {
          window?: { bucket?: string };
          totals?: PlatformTotals;
          today?: PlatformTotals;
          companies?: CompanyRank[];
          series?: { bucket: string; revenue: number; transactions: number }[];
        };
        setTotals(payload.totals ?? null);
        setToday(payload.today ?? null);
        setRanking(payload.companies ?? []);
        // The API widens the bucket for long windows, so the label has to follow:
        // "Mar 14" is misleading on a point that represents the whole of March.
        const grain = payload.window?.bucket ?? 'day';
        const labelFormat = grain === 'month' ? 'MMM YYYY' : 'MMM D';
        setSeries(
          (payload.series ?? []).map((p) => ({
            day: dayjs(p.bucket).format(labelFormat),
            revenue: num(p.revenue),
            transactions: num(p.transactions),
          })),
        );
      }
    } catch {
      setCompanies([]);
      setRecentAdmins([]);
      setStatsError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  // The ranking and the plain company list were two cards showing the same five
  // companies. Joined into one: performance columns plus the registry details that
  // only the /companies payload carries.
  const mergedCompanies: CompanyMerged[] = (
    ranking.length > 0
      ? ranking
      : companies.map((c) => ({
          company_id: c.id,
          company_name: c.name,
          stations: 0,
          revenue: 0,
          transactions: 0,
          liters: 0,
          kwh: 0,
        }))
  ).map((r) => {
    const detail = companies.find((c) => c.id === r.company_id);
    return { ...r, country: detail?.country, created_at: detail?.created_at };
  });

  const companyColumns: ColumnsType<CompanyMerged> = [
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (name: string, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" className="text-xs">
            {r.country || '—'} · {num(r.stations)}{' '}
            {num(r.stations) === 1 ? 'station' : 'stations'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      sorter: (a, b) => num(a.revenue) - num(b.revenue),
      defaultSortOrder: 'descend',
      render: (v: number, r) => (
        <Space direction="vertical" size={0} className="!items-end">
          <Text strong>{formatRWF(num(v))}</Text>
          <Text type="secondary" className="text-xs">
            {num(r.transactions).toLocaleString()} tx · {num(r.liters).toLocaleString()} L
            {num(r.kwh) > 0 ? ` · ${num(r.kwh).toLocaleString()} kWh` : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Added',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      responsive: ['xl'],
      render: (d: string | undefined) => (d ? dayjs(d).format('MMM D, YYYY') : '—'),
    },
    {
      title: '',
      key: 'go',
      width: 32,
      align: 'right',
      render: () => <RightOutlined className="text-ink-disabled text-xs" />,
    },
  ];

  const adminColumns: ColumnsType<AdminUserRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined className="text-accent" />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (n: string | undefined, r) => (
        <Space direction="vertical" size={0}>
          <Text>{n || '—'}</Text>
          <Text type="secondary" className="text-xs">
            {r.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      responsive: ['xl'],
      render: (d: string | undefined) => (d ? dayjs(d).format('MMM D, YYYY') : '—'),
    },
    {
      title: '',
      key: 'go',
      width: 32,
      align: 'right',
      render: () => <RightOutlined className="text-ink-disabled text-xs" />,
    },
  ];

  // A row that navigates needs to look and behave like one: pointer cursor, and the
  // destination reachable by keyboard via the Enter key.
  const clickableRow = (onClick: () => void) => ({
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') onClick();
    },
    tabIndex: 0,
    className: 'cursor-pointer',
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const windowLabel = days === 365 ? 'last 12 months' : `last ${days} days`;
  // A window with no sales is ordinary early on, but it reads as a broken page. Say so
  // explicitly when the platform has stations but this particular window is empty.
  const emptyWindow =
    !statsError && num(totals?.transactions) === 0 && num(totals?.stations) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-0">
            Platform overview
          </Title>
          <Text type="secondary">
            Every company, station and sale across Relai — {windowLabel}
          </Text>
        </div>
        <Space wrap>
          <Segmented
            value={days}
            onChange={(v) => setDays(v as number)}
            options={[
              { label: '7d', value: 7 },
              { label: '30d', value: 30 },
              { label: '90d', value: 90 },
              { label: '12m', value: 365 },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={load} aria-label="Refresh" />
          <Button type="primary" icon={<ApartmentOutlined />} onClick={() => router.push('/admin/companies')}>
            Companies
          </Button>
          <Button icon={<TeamOutlined />} onClick={() => router.push('/admin/users')}>
            Users
          </Button>
        </Space>
      </div>

      {statsError && (
        <Alert
          type="warning"
          showIcon
          className="!rounded-xl"
          message="Platform statistics unavailable"
          description="The aggregate query did not respond. Companies and users below are still current."
        />
      )}

      {emptyWindow && (
        <Alert
          type="info"
          showIcon
          className="!rounded-xl"
          message={`No sales recorded in the ${windowLabel}`}
          description="Counts below are current. Widen the range to see earlier activity."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatTile
            title={`Revenue · ${windowLabel}`}
            value={formatRWF(num(totals?.revenue))}
            hint={`${formatRWF(num(today?.revenue))} today`}
            icon={<DollarOutlined />}
            accent
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatTile
            title="Transactions"
            value={num(totals?.transactions).toLocaleString()}
            hint={`${num(today?.transactions).toLocaleString()} today · avg ${formatRWF(num(totals?.avg_ticket))}`}
            icon={<ShoppingCartOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatTile
            title="Volume dispensed"
            value={`${num(totals?.liters).toLocaleString()} L`}
            hint={num(totals?.kwh) > 0 ? `${num(totals?.kwh).toLocaleString()} kWh charged` : 'No EV charging yet'}
            icon={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatTile
            title="Shifts open now"
            value={num(totals?.active_shifts)}
            hint="Attendants currently on duty"
            icon={<ClockCircleOutlined />}
          />
        </Col>
      </Row>

      <Card className="!rounded-xl" bodyStyle={{ padding: 0 }}>
        <div className="flex flex-wrap divide-y md:divide-y-0 divide-line-subtle">
          <CountCell
            label="Companies"
            value={num(totals?.companies) || companies.length}
            hint="Registered on the platform"
            icon={<ApartmentOutlined />}
            onClick={() => router.push('/admin/companies')}
          />
          {/* Stations and pumps are not clickable for a superadmin: /admin/stations and
              /admin/pumps are station-scoped pages that the admin layout redirects
              superadmins away from (STATION_SCOPED_ADMIN_PATHS). They stay as counts. */}
          <CountCell
            label="Stations"
            value={num(totals?.stations)}
            hint="Across all companies"
            icon={<BankOutlined />}
          />
          <CountCell
            label="Dispensing points"
            value={num(totals?.pumps)}
            hint={
              num(totals?.ev_points) > 0
                ? `${num(totals?.ev_points)} EV charge points`
                : 'All fuel pumps'
            }
            icon={<DashboardOutlined />}
          />
          <CountCell
            label="Active users"
            value={num(totals?.users)}
            hint={`${num(totals?.attendants)} attendants · ${num(totals?.managers)} managers · ${num(totals?.company_admins)} admins`}
            icon={<TeamOutlined />}
            onClick={() => router.push('/admin/users')}
            last
          />
        </div>
      </Card>

      {/* Chart and the company table share a row on wide screens: the chart wants width,
          the table is only a handful of rows, and stacking them wasted both. */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={`Revenue and transactions · ${windowLabel}`}
            className="!rounded-xl h-full"
            bodyStyle={{ paddingTop: 8 }}
          >
            <PlatformTrendChart data={series} height={268} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title={`Companies · ${windowLabel}`}
            className="!rounded-xl h-full"
            extra={
              <Button type="link" size="small" onClick={() => router.push('/admin/companies')}>
                Manage
              </Button>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={companyColumns}
              dataSource={mergedCompanies}
              rowKey="company_id"
              pagination={mergedCompanies.length > 6 ? { pageSize: 6, size: 'small' } : false}
              size="small"
              onRow={(r) =>
                clickableRow(() => router.push(`/admin/users?company_id=${r.company_id}`))
              }
              locale={{ emptyText: 'No companies yet. Create one from Companies.' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            Demo requests
            {leads.some((l) => !l.isRead) && (
              <Tag color="orange" className="ml-2">
                {leads.filter((l) => !l.isRead).length} new
              </Tag>
            )}
          </span>
        }
        className="!rounded-xl"
        extra={
          <Text type="secondary" className="!text-xs">
            Sent from the website contact form
          </Text>
        }
      >
        {leads.length === 0 ? (
          <Text type="secondary">No demo requests yet.</Text>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-line-subtle">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className={`py-3 flex items-start justify-between gap-4 ${lead.isRead ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Text strong>{lead.company}</Text>
                    <Text type="secondary" className="!text-xs">
                      {lead.createdAt ? dayjs(lead.createdAt).format('D MMM, HH:mm') : ''}
                    </Text>
                  </div>
                  <pre className="m-0 mt-1 whitespace-pre-wrap font-sans text-sm text-ink-secondary">
                    {lead.details}
                  </pre>
                </div>
                {!lead.isRead && (
                  <Button size="small" onClick={() => markLeadHandled(lead.id)}>
                    Mark handled
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="Recent company admins"
            className="!rounded-xl h-full"
            extra={
              <Button type="link" size="small" onClick={() => router.push('/admin/users')}>
                Open users
              </Button>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={adminColumns}
              dataSource={recentAdmins}
              rowKey="id"
              pagination={false}
              size="small"
              onRow={(r) =>
                clickableRow(() =>
                  router.push(
                    r.companyId
                      ? `/admin/users?company_id=${r.companyId}&role=ADMIN`
                      : '/admin/users?role=ADMIN',
                  ),
                )
              }
              locale={{ emptyText: 'No company admins yet. Invite one from Companies → Add admin.' }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Platform mix" className="!rounded-xl h-full">
            <Space direction="vertical" size={16} className="w-full">
              <div>
                <Text type="secondary" className="!text-xs uppercase tracking-wide">
                  Companies with sales · {windowLabel}
                </Text>
                <div className="mt-1.5">
                  <Text className="!text-xl !font-bold">
                    {mergedCompanies.filter((c) => num(c.revenue) > 0).length}
                  </Text>
                  <Text type="secondary"> of {mergedCompanies.length}</Text>
                </div>
                <Progress
                  percent={
                    mergedCompanies.length
                      ? Math.round(
                          (mergedCompanies.filter((c) => num(c.revenue) > 0).length /
                            mergedCompanies.length) *
                            100,
                        )
                      : 0
                  }
                  showInfo={false}
                  strokeColor="var(--accent)"
                  size="small"
                />
              </div>

              <div>
                <Text type="secondary" className="!text-xs uppercase tracking-wide">
                  Fuel vs EV
                </Text>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <Text className="!text-xl !font-bold">
                    {num(totals?.pumps) - num(totals?.ev_points)}
                  </Text>
                  <Text type="secondary">fuel pumps</Text>
                  <Text className="!text-xl !font-bold !ml-3">{num(totals?.ev_points)}</Text>
                  <Text type="secondary">charge points</Text>
                </div>
                <Progress
                  percent={
                    num(totals?.pumps)
                      ? Math.round((num(totals?.ev_points) / num(totals?.pumps)) * 100)
                      : 0
                  }
                  showInfo={false}
                  strokeColor="var(--product-ev-dc-fast)"
                  size="small"
                />
              </div>

              <div>
                <Text type="secondary" className="!text-xs uppercase tracking-wide">
                  Busiest company · {windowLabel}
                </Text>
                <div className="mt-1.5">
                  <Text className="!text-base !font-semibold">
                    {mergedCompanies[0]?.company_name ?? '—'}
                  </Text>
                  <br />
                  <Text type="secondary" className="!text-xs">
                    {formatRWF(num(mergedCompanies[0]?.revenue))} ·{' '}
                    {num(mergedCompanies[0]?.transactions).toLocaleString()} transactions
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
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
              valueStyle={{ color: 'var(--accent)', fontWeight: 700 }}
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
