'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Avatar,
  Popconfirm,
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  UserOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { User, Station } from '@/types';

const { Title, Text } = Typography;

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  MANAGER: 'orange',
  ATTENDANT: 'blue',
};

const API_ROLE_TO_UI: Record<string, User['role']> = { company_admin: 'ADMIN', station_manager: 'MANAGER', attendant: 'ATTENDANT' };
const UI_ROLE_TO_API: Record<string, string> = { ADMIN: 'company_admin', MANAGER: 'station_manager', ATTENDANT: 'attendant' };

function mapUserFromApi(raw: Record<string, unknown>): User {
  const station = raw.stations as Record<string, unknown> | undefined;
  return {
    id: raw.id as string,
    email: (raw.email as string) ?? '',
    name: (raw.name as string) ?? '',
    phone: raw.phone as string | undefined,
    role: API_ROLE_TO_UI[raw.role as string] ?? 'ATTENDANT',
    stationId: raw.station_id as string | undefined,
    station: station ? { id: station.id as string, name: station.name as string, companyId: station.company_id as string, location: (station.location as string) ?? '', isActive: true, createdAt: '', updatedAt: '' } as Station : undefined,
    companyId: raw.company_id as string | undefined,
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [stationFilter, setStationFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchStationsList = useCallback(async () => {
    try {
      const res = await api.get('/stations', { params: { limit: 100 } });
      const raw = (res.data as { data?: unknown[] })?.data ?? (Array.isArray(res.data) ? res.data : []);
      return raw.map((s: Record<string, unknown>) => mapStationFromApi(s));
    } catch {
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, stationsList] = await Promise.all([
        api.get('/users', {
          params: {
            search: search || undefined,
            role: roleFilter ? { ADMIN: 'company_admin', MANAGER: 'station_manager', ATTENDANT: 'attendant' }[roleFilter] : undefined,
            station_id: stationFilter,
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
  }, [search, roleFilter, stationFilter, sortBy, sortOrder, page, pageSize, fetchStationsList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
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
        });
        message.success('User updated');
      } else {
        const authUser = useAuthStore.getState().user;
        const companyId = (values.companyId as string) ?? authUser?.companyId ?? (values.stationId && stations.find((s) => s.id === values.stationId)?.companyId);
        if (!companyId) {
          message.error('Company is required. Ensure you are assigned to a company.');
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
        <Space>
          <Avatar className="!bg-fuel-orange" icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={roleColors[role]}>{role}</Tag>,
    },
    {
      title: 'Station',
      key: 'station',
      render: (_: unknown, record: User) => record.station?.name || '—',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => v || '—',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title={`${record.isActive ? 'Deactivate' : 'Activate'} this user?`}
            onConfirm={() => toggleActive(record)}
          >
            <Button
              type="text"
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              danger={record.isActive}
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
          <Text type="secondary">Manage managers, attendants, and administrators</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      <Card className="!rounded-xl">
        <div className="flex flex-wrap gap-3 mb-4">
          <Input.Search
            placeholder="Search name, email, phone"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => setPage(1)}
            className="max-w-xs"
          />
          <Select
            placeholder="Role"
            allowClear
            value={roleFilter}
            onChange={(v) => { setRoleFilter(v); setPage(1); }}
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'ATTENDANT', label: 'Attendant' },
            ]}
            className="w-36"
          />
          <Select
            placeholder="Station"
            allowClear
            value={stationFilter}
            onChange={(v) => { setStationFilter(v); setPage(1); }}
            options={stations.map((s) => ({ value: s.id, label: s.name }))}
            className="w-48"
          />
          <Select
            value={sortBy}
            onChange={(v) => { setSortBy(v); setPage(1); }}
            options={[
              { value: 'created_at', label: 'Date' },
              { value: 'name', label: 'Name' },
              { value: 'email', label: 'Email' },
              { value: 'role', label: 'Role' },
            ]}
            className="w-32"
          />
          <Select
            value={sortOrder}
            onChange={(v) => { setSortOrder(v as 'asc' | 'desc'); setPage(1); }}
            options={[
              { value: 'desc', label: 'Desc' },
              { value: 'asc', label: 'Asc' },
            ]}
            className="w-24"
          />
          <Button onClick={() => fetchData()}>Apply</Button>
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
            <Select
              options={[
                { value: 'ADMIN', label: 'Admin' },
                { value: 'MANAGER', label: 'Manager' },
                { value: 'ATTENDANT', label: 'Attendant' },
              ]}
            />
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
                      <Form.Item name="pin" label="PIN (4–6 digits)" rules={[{ required: true, len: [4, 6], message: '4–6 digits' }]}>
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
    </div>
  );
}
