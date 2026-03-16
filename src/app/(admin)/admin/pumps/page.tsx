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
  InputNumber,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import type { Pump, Station } from '@/types';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  MAINTENANCE: 'orange',
};

export default function AdminPumpsPage() {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPump, setEditingPump] = useState<Pump | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [stationFilter, setStationFilter] = useState<string | undefined>();

  const [pumpSearch, setPumpSearch] = useState('');
  const [pumpSortBy, setPumpSortBy] = useState('pump_number');
  const [pumpSortOrder, setPumpSortOrder] = useState<'asc' | 'desc'>('asc');

  const unwrapPumps = (raw: unknown[]): Pump[] =>
    raw.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      stationId: p.station_id as string,
      pumpNumber: Number(p.pump_number) ?? 0,
      fuelType: (p.fuel_type as Pump['fuelType']) ?? 'PETROL',
      status: (String(p.status ?? 'active').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as Pump['status'],
      createdAt: (p.created_at as string) ?? '',
      updatedAt: (p.updated_at as string) ?? '',
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const stationsRes = await api.get('/stations', { params: { limit: 100 } });
      const payload = stationsRes.data as { data?: unknown[] };
      const rawStations = payload?.data ?? (Array.isArray(stationsRes.data) ? stationsRes.data : []);
      setStations(
        rawStations.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          companyId: (s.company_id as string) ?? '',
          name: s.name as string,
          location: (s.location as string) ?? '',
          isActive: true,
          createdAt: (s.created_at as string) ?? '',
          updatedAt: (s.updated_at as string) ?? '',
        })),
      );
      const pumpParams = {
        stationId: stationFilter,
        search: pumpSearch || undefined,
        sortBy: pumpSortBy,
        sortOrder: pumpSortOrder,
      };
      if (stationFilter) {
        const pumpsRes = await api.get('/pumps', { params: pumpParams });
        const out = pumpsRes.data as { data?: unknown[] };
        const rawPumps = out?.data ?? (Array.isArray(pumpsRes.data) ? pumpsRes.data : []);
        setPumps(unwrapPumps(rawPumps as Record<string, unknown>[]));
      } else {
        const allPumps: Pump[] = [];
        for (const st of rawStations as { id: string }[]) {
          const res = await api.get('/pumps', { params: { ...pumpParams, stationId: st.id, limit: 50 } });
          const out = res.data as { data?: unknown[] };
          const list = out?.data ?? (Array.isArray(res.data) ? res.data : []);
          allPumps.push(...unwrapPumps(list as Record<string, unknown>[]));
        }
        setPumps(allPumps);
      }
    } catch {
      message.error('Failed to load pumps or stations');
    } finally {
      setLoading(false);
    }
  }, [stationFilter, pumpSearch, pumpSortBy, pumpSortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingPump(null);
    form.resetFields();
    setModalOpen(true);
    if (stationFilter) {
      form.setFieldsValue({ stationId: stationFilter });
      api.get<{ nextNumber: number }>('/pumps/next-number', { params: { stationId: stationFilter } })
        .then((res) => form.setFieldsValue({ pumpNumber: res.data?.nextNumber ?? 1, fuelType: 'PETROL' }))
        .catch(() => {});
    }
  };

  const openEdit = (pump: Pump) => {
    setEditingPump(pump);
    form.setFieldsValue({
      stationId: pump.stationId,
      pumpNumber: pump.pumpNumber,
      fuelType: pump.fuelType,
      status: pump.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (editingPump) {
        await api.patch(`/pumps/${editingPump.id}`, {
          fuel_type: values.fuelType,
          status: values.status ? String(values.status).toLowerCase() : undefined,
        });
        message.success('Pump updated');
      } else {
        await api.post('/pumps', {
          station_id: values.stationId,
          pump_number: Number(values.pumpNumber) ?? 1,
          fuel_type: values.fuelType ?? 'PETROL',
        });
        message.success('Pump created');
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

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/pumps/${id}`);
      message.success('Pump deleted');
      fetchData();
    } catch {
      message.error('Failed to delete pump');
    }
  };

  const stationMap = new Map(stations.map((s) => [s.id, s.name]));

  const columns: ColumnsType<Pump> = [
    {
      title: 'Pump',
      key: 'pump',
      render: (_: unknown, record: Pump) => (
        <Space>
          <ToolOutlined className="text-fuel-orange" />
          <Text strong>Pump #{record.pumpNumber}</Text>
        </Space>
      ),
    },
    {
      title: 'Station',
      key: 'station',
      render: (_: unknown, record: Pump) => stationMap.get(record.stationId) || '—',
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type: string) => (
        <Tag color={type === 'PETROL' ? 'orange' : type === 'DIESEL' ? 'blue' : 'green'} className="!font-medium">
          {type === 'BOTH' ? 'Petrol & Diesel' : type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Current Attendant',
      key: 'attendant',
      render: (_: unknown, record: Pump) => record.currentAttendant?.name || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Pump) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this pump?"
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Pumps</Title>
          <Text type="secondary">Manage pumps across all stations</Text>
        </div>
        <Space wrap>
          <Select
            value={stationFilter}
            onChange={setStationFilter}
            placeholder="All Stations"
            allowClear
            className="w-52"
            options={stations.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Input.Search
            placeholder="Pump # or fuel type"
            allowClear
            value={pumpSearch}
            onChange={(e) => setPumpSearch(e.target.value)}
            onSearch={() => fetchData()}
            className="w-44"
          />
          <Select
            value={pumpSortBy}
            onChange={(v) => { setPumpSortBy(v); fetchData(); }}
            options={[
              { value: 'pump_number', label: 'Pump #' },
              { value: 'fuel_type', label: 'Fuel type' },
              { value: 'created_at', label: 'Date' },
            ]}
            className="w-28"
          />
          <Select
            value={pumpSortOrder}
            onChange={(v) => { setPumpSortOrder(v as 'asc' | 'desc'); fetchData(); }}
            options={[
              { value: 'asc', label: 'Asc' },
              { value: 'desc', label: 'Desc' },
            ]}
            className="w-24"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Pump
          </Button>
        </Space>
      </div>

      <Card className="!rounded-xl">
        <Table
          columns={columns}
          dataSource={pumps}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} pumps` }}
          size="middle"
        />
      </Card>

      <Modal
        title={editingPump ? 'Edit Pump' : 'Add Pump'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="stationId" label="Station" rules={[{ required: true }]}>
            <Select
              placeholder="Select station"
              options={stations.map((s) => ({ value: s.id, label: s.name }))}
              disabled={!!editingPump}
              onChange={(stationId: string) => {
                if (!editingPump && stationId) {
                  api.get<{ nextNumber: number }>('/pumps/next-number', { params: { stationId } })
                    .then((res) => form.setFieldsValue({ pumpNumber: res.data?.nextNumber ?? 1 }))
                    .catch(() => {});
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="pumpNumber"
            label="Pump Number"
            rules={[{ required: true, type: 'number', min: 1 }]}
          >
            <InputNumber className="!w-full" min={1} placeholder="Next available (auto-filled when station selected)" />
          </Form.Item>
          <Form.Item name="fuelType" label="Fuel Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'BOTH', label: 'Petrol & Diesel' },
                { value: 'PETROL', label: 'Petrol only' },
                { value: 'DIESEL', label: 'Diesel only' },
              ]}
            />
          </Form.Item>
          {editingPump && (
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                ]}
              />
            </Form.Item>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingPump ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
