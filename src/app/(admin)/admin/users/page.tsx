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
import type { User, Station } from '@/types';

const { Title, Text } = Typography;

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  MANAGER: 'orange',
  ATTENDANT: 'blue',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, stationsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stations'),
      ]);
      setUsers(usersRes.data);
      setStations(stationsRes.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, []);

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
        await api.patch(`/admin/users/${editingUser.id}`, values);
        message.success('User updated');
      } else {
        await api.post('/admin/users', values);
        message.success('User created');
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

  const toggleActive = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { isActive: !user.isActive });
      message.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
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
      filters: [
        { text: 'Admin', value: 'ADMIN' },
        { text: 'Manager', value: 'MANAGER' },
        { text: 'Attendant', value: 'ATTENDANT' },
      ],
      onFilter: (value, record) => record.role === value,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-0">Users</Title>
          <Text type="secondary">Manage managers, attendants, and administrators</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      <Card className="!rounded-xl">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} users` }}
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
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input placeholder="john@example.com" />
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
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+250 7XX XXX XXX" />
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
