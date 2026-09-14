'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Alert,
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';
import type { User, Station } from '@/types';
import { InitialsAvatar } from '@/components/InitialsAvatar';

const { Title, Text } = Typography;

/* Plain words, not codes: the role column is read far more often than filtered. */
const roleLabels: Record<string, string> = {
  ADMIN: 'Company admin',
  MANAGER: 'Station manager',
  ATTENDANT: 'Attendant',
};

const API_ROLE_TO_UI: Record<string, User['role']> = { company_admin: 'ADMIN', station_manager: 'MANAGER', attendant: 'ATTENDANT' };
const UI_ROLE_TO_API: Record<string, string> = { ADMIN: 'company_admin', MANAGER: 'station_manager', ATTENDANT: 'attendant' };

function roleFormSelectOptions(isSuperAdmin: boolean, editingUser: User | null) {
  const all = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ATTENDANT', label: 'Attendant' },
  ];
  if (isSuperAdmin) return all;
  const withoutCompanyAdmin = all.filter((o) => o.value !== 'ADMIN');
  if (editingUser?.role === 'ADMIN') {
    return [{ value: 'ADMIN' as const, label: 'Admin', disabled: true }, ...withoutCompanyAdmin];
  }
  return withoutCompanyAdmin;
}

function mapUserFromApi(raw: Record<string, unknown>): User {
  const station = raw.stations as Record<string, unknown> | undefined;
  const companies = raw.companies as { id?: string; name?: string } | null | undefined;
  return {
    id: raw.id as string,
    email: (raw.email as string) ?? '',
    name: (raw.name as string) ?? '',
    phone: raw.phone as string | undefined,
    role: API_ROLE_TO_UI[raw.role as string] ?? 'ATTENDANT',
    stationId: raw.station_id as string | undefined,
    station: station ? { id: station.id as string, name: station.name as string, companyId: station.company_id as string, location: (station.location as string) ?? '', isActive: true, createdAt: '', updatedAt: '' } as Station : undefined,
    companyId: raw.company_id as string | undefined,
    companyName: companies?.name,
    isActive: raw.is_active !== false,
    createdAt: (raw.created_at as string) ?? '',
    updatedAt: (raw.updated_at as string) ?? '',
  };
}

function mapStationFromApi(raw: Record<string, unknown>): Station {
  return {
    id: raw.id as string,
    companyId: (raw.company_id as string) ?? '',
    name: (raw.name as string) ?? '',
    location: (raw.location as string) ?? '',
    isActive: true,
    createdAt: (raw.created_at as string) ?? '',
    updatedAt: (raw.updated_at as string) ?? '',
  };
}

function AdminUsersPageInner() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setCurrentStationById = useStationStore((s) => s.setCurrentStationById);
  const isSuperAdmin = authUser?.role === 'SUPERADMIN';
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const searchParams = useSearchParams();
  // Deep link target for "Admins" on the Companies page, so that button can land
  // here already narrowed instead of dropping the superadmin into every user.
  const [companyFilter, setCompanyFilter] = useState<string | undefined>(
    () => searchParams.get('company_id') ?? undefined,
  );
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(
    () => searchParams.get('role') ?? undefined,
  );
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetForm] = Form.useForm();
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);
  const [stationFilter, setStationFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchStationsList = useCallback(async () => {
    try {
      const res = await api.get('/stations', {
        params: { limit: 500, ...(isSuperAdmin && companyFilter ? { company_id: companyFilter } : {}) },
      });
      const raw = (res.data as { data?: unknown[] })?.data ?? (Array.isArray(res.data) ? res.data : []);
      return raw.map((s: Record<string, unknown>) => mapStationFromApi(s));
    } catch {
      return [];
    }
  }, [isSuperAdmin, companyFilter]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        const res = await api.get('/companies');
        const raw = Array.isArray(res.data) ? res.data : [];
        setCompanies(raw.map((c: Record<string, unknown>) => ({ id: c.id as string, name: (c.name as string) ?? '' })));
      } catch {
        setCompanies([]);
      }
    })();
  }, [isSuperAdmin]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, stationsList] = await Promise.all([
        api.get('/users', {
          params: {
            search: search || undefined,
            role: roleFilter ? { ADMIN: 'company_admin', MANAGER: 'station_manager', ATTENDANT: 'attendant' }[roleFilter] : undefined,
            station_id: stationFilter,
            company_id: isSuperAdmin ? companyFilter : undefined,
            sortBy,
            sortOrder,
            page,
            limit: pageSize,
          },
        }),
        fetchStationsList(),
      ]);
      setStations(stationsList);
      const payload = usersRes.data as { data?: unknown[]; pagination?: { total: number } };
      const rawUsers = payload?.data ?? (Array.isArray(usersRes.data) ? usersRes.data : []);
      setTotal(payload?.pagination?.total ?? rawUsers.length);
      setUsers(
        rawUsers.map((u: Record<string, unknown>) => {
          const mapped = mapUserFromApi(u);
          if (mapped.stationId) {
            const st = stationsList.find((s) => s.id === mapped.stationId);
            if (st) mapped.station = st;
          }
          return mapped;
        }),
      );
    } catch {
      message.error('Failed to load users or stations');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, stationFilter, companyFilter, sortBy, sortOrder, page, pageSize, fetchStationsList, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    if (isSuperAdmin && companyFilter) {
      form.setFieldsValue({ companyId: companyFilter });
    }
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      stationId: user.stationId,
      isActive: user.isActive,
      // Company is required whenever an admin is in the form. Leaving it unset
      // made every edit fail validation on a field the update never sends.
      companyId: user.companyId,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, {
          name: values.name,
          station_id: values.stationId,
          phone: values.phone,
          pin: values.pin,
          is_active: values.isActive,
          // Attendants have no email; sending one back would be rejected outright.
          ...(editingUser.role === 'ATTENDANT' ? {} : { email: values.email }),
        });
        message.success('User updated');
      } else {
        const authUserNow = useAuthStore.getState().user;
        const companyId =
          (values.companyId as string) ??
          authUserNow?.companyId ??
          (values.stationId && stations.find((s) => s.id === values.stationId)?.companyId);
        if (!companyId) {
          message.error(
            isSuperAdmin ? 'Select a company (or pick a station so we can infer it).' : 'Company is required. Ensure you are assigned to a company.',
          );
          setSubmitting(false);
          return;
        }
        const body: Record<string, unknown> = {
          name: values.name,
          company_id: companyId,
          station_id: ['MANAGER', 'ATTENDANT'].includes(values.role as string) ? values.stationId : undefined,
          role: UI_ROLE_TO_API[values.role as string] ?? 'attendant',
        };
        if (values.role === 'ATTENDANT') {
          body.phone = values.phone ?? '';
          body.pin = String(values.pin ?? '').padEnd(4, '0').slice(0, 6);
          if (!body.phone || !body.pin) {
            message.error('Attendants require phone and PIN');
            setSubmitting(false);
            return;
          }
        } else {
          body.email = values.email;
          body.password = values.password;
          if (values.phone) body.phone = values.phone;
          if (!body.email || !body.password) {
            message.error('Admins and managers require email and password');
            setSubmitting(false);
            return;
          }
        }
        await api.post('/users', body);
        message.success('User created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Operation failed';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const previewManagerStation = (record: User) => {
    const sid = record.stationId;
    if (!sid) {
      message.warning('This manager has no station assigned yet.');
      return;
    }
    setCurrentStationById(sid);
    message.info(`Opening manager view for ${record.station?.name ?? 'station'}…`);
    router.push('/dashboard');
  };

  const openReset = (user: User) => {
    setResetUser(user);
    setIssuedPassword(null);
    resetForm.resetFields();
    resetForm.setFieldsValue({ sendEmail: false });
  };

  const handleReset = async (values: { password?: string; sendEmail?: boolean }) => {
    if (!resetUser) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/users/${resetUser.id}/reset-password`, {
        ...(values.password?.trim() ? { password: values.password.trim() } : {}),
        send_email: !!values.sendEmail,
      });
      const data = res.data as { emailSent?: boolean; temporary_password?: string };
      if (data.emailSent) {
        message.success(`New password emailed to ${resetUser.email}`);
        setResetUser(null);
      } else if (data.temporary_password) {
        // Held on screen rather than dropped into a toast: this is the only time
        // the password is visible, and whoever ran the reset has to pass it on.
        setIssuedPassword(data.temporary_password);
      } else {
        message.success('Password updated');
        setResetUser(null);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
                'Failed to reset password',
            )
          : 'Failed to reset password';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.isActive });
      message.success(`User ${user.isActive ? 'Deactivated' : 'Activated'}`);
      fetchData();
    } catch {
      message.error('Failed to update user');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={record.name} />
          <div className="min-w-0">
            <Text strong className="block truncate">{record.name}</Text>
            <Text type="secondary" className="text-xs block truncate">
              {record.email || record.phone || 'No contact details'}
            </Text>
          </div>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            title: 'Company',
            dataIndex: 'companyName',
            key: 'companyName',
            width: 180,
            render: (name: string | undefined) =>
              name ? (
                <span className="whitespace-nowrap">{name}</span>
              ) : (
                <Text type="secondary">Not assigned</Text>
              ),
          } as const,
        ]
      : []),
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role: string) => <Tag>{roleLabels[role] ?? role}</Tag>,
    },
    {
      title: 'Station',
      key: 'station',
      render: (_: unknown, record: User) =>
        record.station?.name || (
          <Text type="secondary">{record.role === 'ADMIN' ? 'All stations' : 'Not assigned'}</Text>
        ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (v: string) => v || <Text type="secondary">Not set</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active: boolean) => (
        <span className="inline-flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full ${active ? 'bg-accent' : 'bg-ink-disabled'}`}
          />
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (d: string) => (
        <span className="whitespace-nowrap">{d ? dayjs(d).format('D MMM YYYY') : ''}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isSuperAdmin ? 200 : 240,
      render: (_: unknown, record: User) => (
        <Space>
          {record.role === 'MANAGER' && (
            <Tooltip title="Open the station dashboard as a manager would see it (same data scope)">
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => previewManagerStation(record)}>
                Preview
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label="Edit user" onClick={() => openEdit(record)} />
          </Tooltip>
          {record.role !== 'ATTENDANT' && (
            <Tooltip title="Set a new sign-in password">
              <Button type="text" icon={<KeyOutlined />} aria-label="Reset password" onClick={() => openReset(record)} />
            </Tooltip>
          )}
          <Popconfirm
            title={`${record.isActive ? 'Deactivate' : 'Activate'} this user?`}
            onConfirm={() => toggleActive(record)}
          >
            <Button
              type="text"
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              danger={record.isActive}
              aria-label={record.isActive ? 'Deactivate user' : 'Activate user'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current);
    if (pagination.pageSize) setPageSize(pagination.pageSize);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Users</Title>
          <Text type="secondary">
            {isSuperAdmin
              ? 'Manage managers, attendants, and company administrators'
              : 'Add managers and attendants; use Preview on a manager row to open their station dashboard'}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      <Card className="!rounded-xl">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input.Search
            placeholder="Search name, email or phone"
            allowClear
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-72"
          />
          <Select
            placeholder="All roles"
            allowClear
            value={roleFilter}
            onChange={(v) => { setRoleFilter(v); setPage(1); }}
            options={[
              { value: 'ADMIN', label: 'Company admins' },
              { value: 'MANAGER', label: 'Station managers' },
              { value: 'ATTENDANT', label: 'Attendants' },
            ]}
            className="w-44"
          />
          {isSuperAdmin && (
            <Select
              placeholder="All companies"
              allowClear
              showSearch
              optionFilterProp="label"
              value={companyFilter}
              onChange={(v) => { setCompanyFilter(v); setStationFilter(undefined); setPage(1); }}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              className="w-52"
            />
          )}
          <Select
            placeholder="All stations"
            allowClear
            showSearch
            optionFilterProp="label"
            value={stationFilter}
            onChange={(v) => { setStationFilter(v); setPage(1); }}
            options={stations.map((s) => ({ value: s.id, label: s.name }))}
            className="w-48"
          />
          <Select
            value={`${sortBy}:${sortOrder}`}
            onChange={(v: string) => {
              const [by, order] = v.split(':');
              setSortBy(by);
              setSortOrder(order as 'asc' | 'desc');
              setPage(1);
            }}
            options={[
              { value: 'created_at:desc', label: 'Newest first' },
              { value: 'created_at:asc', label: 'Oldest first' },
              { value: 'name:asc', label: 'Name, A to Z' },
              { value: 'name:desc', label: 'Name, Z to A' },
              { value: 'role:asc', label: 'By role' },
            ]}
            className="w-40"
          />
          {(search || roleFilter || stationFilter || (isSuperAdmin && companyFilter)) && (
            <Button
              type="link"
              onClick={() => {
                setSearch('');
                setRoleFilter(undefined);
                setStationFilter(undefined);
                if (isSuperAdmin) setCompanyFilter(undefined);
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `${t} users`,
          }}
          onChange={handleTableChange}
          size="middle"
          locale={{ emptyText: 'No users match these filters.' }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={roleFormSelectOptions(isSuperAdmin, editingUser)} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.role !== c.role}>
            {({ getFieldValue }) =>
              isSuperAdmin && getFieldValue('role') === 'ADMIN' ? (
                <Form.Item
                  name="companyId"
                  label="Company"
                  rules={[{ required: true, message: 'Select company for this admin' }]}
                >
                  <Select
                    placeholder="Select company"
                    showSearch
                    optionFilterProp="label"
                    /* Fixed once the account exists: update has no path for moving
                       an admin to another company. */
                    disabled={!!editingUser}
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Form.Item>
              ) : null}
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.role !== cur.role}
          >
            {({ getFieldValue }) =>
              ['MANAGER', 'ATTENDANT'].includes(getFieldValue('role')) ? (
                <Form.Item name="stationId" label="Assign to Station" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select a station"
                    options={stations.map((s) => ({ value: s.id, label: s.name }))}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.role !== cur.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              if (role === 'ATTENDANT') {
                return (
                  <>
                    <Form.Item name="phone" label="Phone number" rules={[{ required: !editingUser }]}>
                      <Input placeholder="e.g. +250 788 123 456" />
                    </Form.Item>
                    {!editingUser && (
                      <Form.Item name="pin" label="PIN (4 to 6 digits)" rules={[{ required: true, min: 4, max: 6, message: 'Enter 4 to 6 digits' }]}>
                        <Input.Password placeholder="1234" maxLength={6} />
                      </Form.Item>
                    )}
                  </>
                );
              }
              if (['ADMIN', 'MANAGER'].includes(role)) {
                return (
                  <>
                    <Form.Item name="phone" label="Phone number">
                      <Input placeholder="e.g. +250 788 123 456" />
                    </Form.Item>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[{ required: !editingUser, type: 'email' }]}
                    >
                      <Input placeholder="admin@example.com" />
                    </Form.Item>
                    {!editingUser && (
                      <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
                      >
                        <Input.Password placeholder="Minimum 8 characters" />
                      </Form.Item>
                    )}
                  </>
                );
              }
              return null;
            }}
          </Form.Item>
          {editingUser && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!resetUser}
        title={`Reset password — ${resetUser?.name ?? ''}`}
        onCancel={() => setResetUser(null)}
        footer={
          issuedPassword
            ? [
                <Button key="done" type="primary" onClick={() => setResetUser(null)}>
                  Done
                </Button>,
              ]
            : null
        }
        destroyOnClose
      >
        {issuedPassword ? (
          <Alert
            type="success"
            showIcon
            message="Password updated"
            description={
              <div className="space-y-2">
                <div>
                  Give this to <strong>{resetUser?.name}</strong>. It is shown once and
                  cannot be retrieved later.
                </div>
                <Input.TextArea
                  readOnly
                  autoSize
                  value={issuedPassword}
                  onFocus={(e) => e.currentTarget.select()}
                  className="!font-mono"
                />
              </div>
            }
          />
        ) : (
          <Form form={resetForm} layout="vertical" onFinish={handleReset}>
            <Text type="secondary" className="block mb-4">
              Signs in as {resetUser?.email}. Their current password stops working
              immediately.
            </Text>
            <Form.Item
              name="password"
              label="New password"
              extra="Leave blank to generate a strong one."
              rules={[{ min: 8, message: 'At least 8 characters' }]}
            >
              <Input.Password placeholder="Generate automatically" autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="sendEmail" label="Email it to them" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Text type="secondary" className="block mb-4 text-xs">
              Emailing requires RESEND_API_KEY and MAIL_FROM on the API. Left off, the
              password is shown here for you to pass on.
            </Text>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setResetUser(null)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting} danger>
                Reset password
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}

/**
 * `useSearchParams` opts the tree into client-side rendering, and Next needs the
 * boundary spelled out or the static build of this route fails.
 */
export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersPageInner />
    </Suspense>
  );
}
