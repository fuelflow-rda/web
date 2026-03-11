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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pumpsRes, stationsRes] = await Promise.all([
        api.get('/admin/pumps', { params: stationFilter ? { stationId: stationFilter } : {} }),
        api.get('/admin/stations'),
      ]);
      setPumps(pumpsRes.data);
      setStations(stationsRes.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [stationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingPump(null);
    form.resetFields();
    setModalOpen(true);
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
        await api.patch(`/admin/pumps/${editingPump.id}`, values);
        message.success('Pump updated');
      } else {
        await api.post('/admin/pumps', values);
        message.success('Pump created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/pumps/${id}`);
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
        <Tag color={type === 'PETROL' ? 'orange' : 'blue'} className="!font-medium">
          {type}
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
        <Space>
          <Select
            value={stationFilter}
            onChange={setStationFilter}
            placeholder="All Stations"
            allowClear
            className="w-52"
            options={stations.map((s) => ({ value: s.id, label: s.name }))}
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
            />
          </Form.Item>
          <Form.Item
            name="pumpNumber"
            label="Pump Number"
            rules={[{ required: true, type: 'number', min: 1 }]}
          >
            <InputNumber className="!w-full" placeholder="e.g. 1" />
          </Form.Item>
          <Form.Item name="fuelType" label="Fuel Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'PETROL', label: 'Petrol' },
                { value: 'DIESEL', label: 'Diesel' },
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
