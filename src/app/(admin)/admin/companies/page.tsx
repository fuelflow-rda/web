'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  TeamOutlined,
  BankOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/lib/api';
import type { Company } from '@/types';

const { Title, Text } = Typography;

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCompany, setInviteCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [inviteForm] = Form.useForm();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies');
      const raw = Array.isArray(res.data) ? res.data : [];
      setCompanies(
        raw.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) ?? '',
          country: (c.country as string) ?? undefined,
          createdAt: (c.created_at as string) ?? '',
          updatedAt: (c.updated_at as string) ?? '',
        })),
      );
    } catch {
      message.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreate = async (values: { name: string }) => {
    setSubmitting(true);
    try {
      await api.post('/companies', {
        name: values.name.trim(),
        country: 'RW',
      });
      message.success('Company created');
      setCreateOpen(false);
      createForm.resetFields();
      fetchCompanies();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed')
          : 'Failed to create company';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openInvite = (company: Company) => {
    setInviteCompany(company);
    inviteForm.resetFields();
    inviteForm.setFieldsValue({
      send_invite_email: true,
    });
    setInviteOpen(true);
  };

  const handleInvite = async (values: {
    name: string;
    email: string;
    password?: string;
    send_invite_email: boolean;
  }) => {
    if (!inviteCompany) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        company_id: inviteCompany.id,
        name: values.name.trim(),
        email: values.email.trim(),
        send_invite_email: values.send_invite_email,
      };
      if (values.password?.trim()) body.password = values.password.trim();

      const res = await api.post('/users/company-admins', body);
      const data = res.data as {
        emailSent?: boolean;
        temporary_password?: string;
      };

      if (data.temporary_password) {
        Modal.success({
          title: data.emailSent === false && values.send_invite_email ? 'Admin created (email not sent)' : 'Admin created',
          width: 520,
          content: (
            <div className="space-y-2 text-left">
              <p>Copy this temporary password now. It will not be shown again.</p>
              <Input readOnly value={data.temporary_password} className="font-mono" />
              {values.send_invite_email && !data.emailSent && (
                <p className="text-amber-700 text-sm">
                  Email was not sent. Configure RESEND_API_KEY and MAIL_FROM on the API, or share the password manually.
                </p>
              )}
            </div>
          ),
        });
      } else {
        message.success('Company admin created. Check their inbox for login details.');
      }
      setInviteOpen(false);
      inviteForm.resetFields();
      setInviteCompany(null);
      fetchCompanies();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed')
          : 'Failed to create admin';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/companies/${id}`);
      message.success('Company deleted');
      fetchCompanies();
    } catch {
      message.error('Failed to delete company (remove stations and users first if constrained)');
    }
  };

  const columns: ColumnsType<Company> = [
    {
      title: 'Company',
      key: 'name',
      render: (_: unknown, record: Company) => (
        <Space>
          <BankOutlined className="text-fuel-orange" />
          <div>
            <Text strong>{record.name}</Text>
            {record.country && (
              <>
                <br />
                <Text type="secondary" className="text-xs">
                  <GlobalOutlined /> {record.country}
                </Text>
              </>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => (d ? dayjs(d).format('MMM D, YYYY') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: Company) => (
        <Space>
          <Button type="link" icon={<TeamOutlined />} onClick={() => openInvite(record)}>
            Add admin
          </Button>
          <Popconfirm
            title="Delete this company?"
            description="This may fail if stations or users still exist."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">
            Companies
          </Title>
          <Text type="secondary">Create tenants, then invite a company admin by email</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
          New company
        </Button>
      </div>

      <Card className="!rounded-xl">
        <div className="mb-3">
          <Tag color="blue">Superadmin</Tag>
          <Text type="secondary" className="ml-2">
            Admins receive credentials by email when Resend is configured on the API.
          </Text>
        </div>
        <Table
          columns={columns}
          dataSource={companies}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} companies` }}
          size="middle"
        />
      </Card>

      <Modal
        title="New company"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Company name" rules={[{ required: true }]}>
            <Input placeholder="e.g. StationIQ Rwanda Ltd" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={inviteCompany ? `Invite company admin — ${inviteCompany.name}` : 'Invite company admin'}
        open={inviteOpen}
        onCancel={() => { setInviteOpen(false); setInviteCompany(null); }}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInvite}>
          <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
            <Input placeholder="Admin name" />
          </Form.Item>
          <Form.Item name="email" label="Work email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@company.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password (optional)"
            tooltip="Leave blank to auto-generate a strong password."
          >
            <Input.Password placeholder="Min. 8 characters, or leave empty" />
          </Form.Item>
          <Form.Item
            name="send_invite_email"
            label="Send credentials by email"
            valuePropName="checked"
            initialValue={true}
            extra="Requires RESEND_API_KEY, MAIL_FROM, and WEB_APP_LOGIN_URL on the API."
          >
            <Switch />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setInviteOpen(false); setInviteCompany(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create admin
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
