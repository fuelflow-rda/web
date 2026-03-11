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
  Switch,
  message,
  Popconfirm,
} from 'antd';
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
import type { Station } from '@/types';

const { Title, Text } = Typography;

export default function AdminStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stations');
      setStations(res.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const openCreate = () => {
    setEditingStation(null);
    form.resetFields();
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
        await api.patch(`/admin/stations/${editingStation.id}`, values);
        message.success('Station updated');
      } else {
        await api.post('/admin/stations', values);
        message.success('Station created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchStations();
    } catch {
      message.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/stations/${id}`);
      message.success('Station deleted');
      fetchStations();
    } catch {
      message.error('Failed to delete station');
    }
  };

  const columns: ColumnsType<Station> = [
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
      render: (v: string) => v || '—',
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
        <Table
          columns={columns}
          dataSource={stations}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} stations` }}
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
