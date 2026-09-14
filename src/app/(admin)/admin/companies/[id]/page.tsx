'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';

const { Title, Text } = Typography;

type CompanyDetail = {
  id: string;
  name: string;
  createdAt: string;
  stations: Array<{ id: string; name: string; location: string; createdAt: string }>;
};

type Person = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

function StatTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-surface rounded-card border border-line-subtle p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export default function AdminCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, usersRes] = await Promise.all([
        api.get(`/companies/${id}`),
        api.get('/users', { params: { company_id: id, limit: 100 } }),
      ]);
      const c = companyRes.data as Record<string, unknown>;
      const stationsRaw = (c.stations as Array<Record<string, unknown>>) ?? [];
      setCompany({
        id: c.id as string,
        name: (c.name as string) ?? '',
        createdAt: (c.created_at as string) ?? '',
        stations: stationsRaw
          .map((s) => ({
            id: s.id as string,
            name: (s.name as string) ?? '',
            location: (s.location as string) ?? '',
            createdAt: (s.created_at as string) ?? '',
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
      const usersRaw =
        (usersRes.data as { data?: unknown[] })?.data ??
        (Array.isArray(usersRes.data) ? usersRes.data : []);
      setPeople(
        (usersRaw as Array<Record<string, unknown>>).map((u) => ({
          id: u.id as string,
          name: (u.name as string) ?? '',
          email: (u.email as string) ?? '',
          phone: u.phone as string | undefined,
          role: u.role as string,
          isActive: u.is_active !== false,
          createdAt: (u.created_at as string) ?? '',
        })),
      );
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const admins = people.filter((p) => p.role === 'company_admin');
  const managers = people.filter((p) => p.role === 'station_manager').length;
  const attendants = people.filter((p) => p.role === 'attendant').length;

  const openInvite = () => {
    inviteForm.resetFields();
    inviteForm.setFieldsValue({ send_invite_email: true });
    setInviteOpen(true);
  };

  const handleInvite = async (values: {
    name: string;
    email: string;
    password?: string;
    send_invite_email: boolean;
  }) => {
    if (!company) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        company_id: company.id,
        name: values.name.trim(),
        email: values.email.trim(),
        send_invite_email: values.send_invite_email,
      };
      if (values.password?.trim()) body.password = values.password.trim();

      const res = await api.post('/users/company-admins', body);
      const data = res.data as { emailSent?: boolean; temporary_password?: string };

      if (data.temporary_password) {
        Modal.success({
          title:
            data.emailSent === false && values.send_invite_email
              ? 'Admin created (email not sent)'
              : 'Admin created',
          width: 520,
          content: (
            <div className="space-y-2 text-left">
              <p>Copy this temporary password now. It will not be shown again.</p>
              <Input readOnly value={data.temporary_password} className="font-mono" />
              {values.send_invite_email && !data.emailSent && (
                <p className="text-warn text-sm">
                  Email was not sent. Configure RESEND_API_KEY and MAIL_FROM on the API, or share
                  the password manually.
                </p>
              )}
            </div>
          ),
        });
      } else {
        message.success('Administrator created. Login details are on their way by email.');
      }
      setInviteOpen(false);
      inviteForm.resetFields();
      load();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/companies/${id}`);
      message.success('Company deleted');
      router.replace('/admin/companies');
    } catch (err: unknown) {
      message.error(
        err instanceof Error
          ? err.message
          : 'Failed to delete company. Remove its stations and users first.',
      );
    }
  };

  if (loading && !company) return <AppLoadingScreen />;

  if (notFound || !company) {
    return (
      <div className="space-y-4">
        <Link href="/admin/companies" className="inline-flex items-center gap-2 text-accent">
          <ArrowLeftOutlined /> Companies
        </Link>
        <Card className="!rounded-xl">
          <Text>This company could not be found. It may have been deleted.</Text>
        </Card>
      </div>
    );
  }

  const adminColumns: ColumnsType<Person> = [
    {
      title: 'Administrator',
      key: 'person',
      render: (_: unknown, p) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={p.name} />
          <div className="min-w-0">
            <Text strong className="block truncate">
              {p.name}
            </Text>
            <Text type="secondary" className="text-xs block truncate">
              {p.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 170,
      render: (v?: string) => v || <Text type="secondary">Not set</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => (d ? dayjs(d).format('D MMM YYYY') : ''),
    },
  ];

  const stationColumns: ColumnsType<CompanyDetail['stations'][number]> = [
    {
      title: 'Station',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (v: string) => v || <Text type="secondary">Not set</Text>,
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => (d ? dayjs(d).format('D MMM YYYY') : ''),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-accent"
        >
          <ArrowLeftOutlined /> Companies
        </Link>
        <div className="mt-3 flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <InitialsAvatar name={company.name} size={52} square />
            <div>
              <Title level={3} className="!mb-0">
                {company.name}
              </Title>
              <Text type="secondary">
                Created {company.createdAt ? dayjs(company.createdAt).format('D MMMM YYYY') : ''}
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popconfirm
              title="Delete this company?"
              description="Stations and users must be removed first. This cannot be undone."
              onConfirm={handleDelete}
              okText="Delete company"
              okButtonProps={{ danger: true }}
            >
              <Button danger>Delete company</Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={openInvite}>
              Add administrator
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Stations" value={company.stations.length} />
        <StatTile
          label="Administrators"
          value={admins.length}
          hint={admins.length === 0 ? 'Add one so the company can sign in' : undefined}
        />
        <StatTile label="Station managers" value={managers} />
        <StatTile label="Attendants" value={attendants} />
      </div>

      <Card
        className="!rounded-xl"
        title="Administrators"
        extra={
          <Link href={`/admin/users?company_id=${company.id}&role=ADMIN`} className="text-accent">
            Edit or reset passwords in Users
          </Link>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={adminColumns}
          dataSource={admins}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{
            emptyText: (
              <div className="py-6">
                <Text type="secondary">No administrators yet.</Text>
                <div className="mt-3">
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openInvite}>
                    Add administrator
                  </Button>
                </div>
              </div>
            ),
          }}
        />
      </Card>

      <Card
        className="!rounded-xl"
        title="Stations"
        extra={
          <Link href={`/admin/stations?company_id=${company.id}`} className="text-accent">
            Manage in Stations
          </Link>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={stationColumns}
          dataSource={company.stations}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{ emptyText: 'No stations yet. Add them from the Stations page.' }}
        />
      </Card>

      <Modal
        title={`Add administrator to ${company.name}`}
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInvite}>
          <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Enter their name' }]}>
            <Input placeholder="Admin name" autoFocus />
          </Form.Item>
          <Form.Item
            name="email"
            label="Work email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input placeholder="admin@company.rw" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password (optional)"
            tooltip="Leave blank to generate a strong password."
          >
            <Input.Password placeholder="Minimum 8 characters, or leave empty" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="send_invite_email"
            label="Send login details by email"
            valuePropName="checked"
            initialValue={true}
            extra="Requires RESEND_API_KEY, MAIL_FROM and WEB_APP_LOGIN_URL on the API. Left off, the password is shown to you once."
          >
            <Switch />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create administrator
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
