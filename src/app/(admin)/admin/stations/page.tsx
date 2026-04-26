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
  Popconfirm,
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Company, Station } from '@/types';

const { Title, Text } = Typography;

function mapStationFromApi(raw: Record<string, unknown>): Station {
  const companies = raw.companies as { id?: string; name?: string } | null | undefined;
  return {
    id: raw.id as string,
    companyId: (raw.company_id as string) ?? '',
    companyName: companies?.name,
    name: (raw.name as string) ?? '',
    location: (raw.location as string) ?? '',
    address: raw.address as string | undefined,
    phone: raw.phone as string | undefined,
    isActive: true,
    createdAt: (raw.created_at as string) ?? '',
    updatedAt: (raw.updated_at as string) ?? '',
  };
}

export default function AdminStationsPage() {
  const authUser = useAuthStore((s) => s.user);
  const isSuperAdmin = authUser?.role === 'SUPERADMIN';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterCompanyId, setFilterCompanyId] = useState<string | undefined>(undefined);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stations', {
        params: {
          search: search || undefined,
          sortBy,
          sortOrder,
          page,
          limit: pageSize,
          ...(isSuperAdmin && filterCompanyId ? { company_id: filterCompanyId } : {}),
        },
      });
      const payload = res.data as { data?: unknown[]; pagination?: { total: number } };
      const raw = payload?.data ?? (Array.isArray(res.data) ? res.data : []);
      setTotal(payload?.pagination?.total ?? raw.length);
      setStations(raw.map((s: Record<string, unknown>) => mapStationFromApi(s)));
    } catch {
      message.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, page, pageSize, isSuperAdmin, filterCompanyId]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        const res = await api.get('/companies');
        const raw = Array.isArray(res.data) ? res.data : [];
        setCompanies(
          raw.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: (c.name as string) ?? '',
            createdAt: (c.created_at as string) ?? '',
            updatedAt: (c.updated_at as string) ?? '',
          })),
        );
      } catch {
        setCompanies([]);
      }
    })();
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const openCreate = () => {
    setEditingStation(null);
    form.resetFields();
    if (isSuperAdmin && filterCompanyId) {
      form.setFieldsValue({ companyId: filterCompanyId });
    }
    setModalOpen(true);
  };

  const openEdit = (station: Station) => {
    setEditingStation(station);
    form.setFieldsValue({
      name: station.name,
      location: station.location,
      address: station.address,
      phone: station.phone,
      isActive: station.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (editingStation) {
        await api.patch(`/stations/${editingStation.id}`, { name: values.name, location: values.location });
        message.success('Station updated');
      } else {
        const companyId =
          (values.companyId as string | undefined) || useAuthStore.getState().user?.companyId;
        if (!companyId) {
          message.error(
            isSuperAdmin ? 'Select a company for this station.' : 'You must be assigned to a company to create stations.',
          );
          setSubmitting(false);
          return;
        }
        await api.post('/stations', { name: values.name, company_id: companyId, location: values.location ?? '' });
        message.success('Station created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchStations();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Operation failed';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/stations/${id}`);
      message.success('Station deleted');
      fetchStations();
    } catch {
      message.error('Failed to delete station');
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current);
    if (pagination.pageSize) setPageSize(pagination.pageSize);
  };

  const columns: ColumnsType<Station> = [
    ...(isSuperAdmin
      ? [
          {
            title: 'Company',
            dataIndex: 'companyName',
            key: 'companyName',
            width: 160,
            render: (name: string | undefined) => name || '—',
          } as const,
        ]
      : []),
    {
      title: 'Station',
      key: 'name',
      render: (_: unknown, record: Station) => (
        <Space>
          <BankOutlined className="text-fuel-orange" />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className="text-xs">
              <EnvironmentOutlined /> {record.location}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (v: string) => v || 'N/A',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => v || 'N/A',
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Station) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this station?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-0">Stations</Title>
          <Text type="secondary">Manage all fuel stations</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Station
        </Button>
      </div>

      <Card className="!rounded-xl">
        <div className="flex flex-wrap gap-3 mb-4">
          {isSuperAdmin && (
            <Select
              placeholder="All companies"
              allowClear
              className="min-w-[200px]"
              value={filterCompanyId}
              onChange={(v) => {
                setFilterCompanyId(v);
                setPage(1);
              }}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
          <Input.Search
            placeholder="Search name or location"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => setPage(1)}
            className="max-w-xs"
          />
          <Select
            value={sortBy}
            onChange={(v) => { setSortBy(v); setPage(1); }}
            options={[
              { value: 'created_at', label: 'Date' },
              { value: 'name', label: 'Name' },
              { value: 'location', label: 'Location' },
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
        </div>
        <Table
          columns={columns}
          dataSource={stations}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `${t} stations`,
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>

      <Modal
        title={editingStation ? 'Edit Station' : 'Create Station'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingStation && isSuperAdmin && (
            <Form.Item
              name="companyId"
              label="Company"
              rules={[{ required: true, message: 'Select the company this station belongs to' }]}
            >
              <Select
                placeholder="Select company"
                showSearch
                optionFilterProp="label"
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          )}
          <Form.Item name="name" label="Station Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. FuelFlow Kigali Central" />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input placeholder="e.g. Kigali, Nyarugenge" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="Full street address" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+250 7XX XXX XXX" />
          </Form.Item>
          {editingStation && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingStation ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
