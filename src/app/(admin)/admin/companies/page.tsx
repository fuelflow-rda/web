'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Card, Button, Typography, Modal, Form, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/lib/api';
import type { Company } from '@/types';
import { InitialsAvatar } from '@/components/InitialsAvatar';

const { Title, Text } = Typography;

type CompanyRow = Company & { stationCount: number; adminCount: number };

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      // Three list calls instead of one per company: counts are derived here.
      const [companiesRes, stationsRes, adminsRes] = await Promise.all([
        api.get('/companies'),
        api.get('/stations', { params: { limit: 500 } }),
        api.get('/users', { params: { role: 'company_admin', limit: 100 } }),
      ]);

      const stationsRaw =
        (stationsRes.data as { data?: unknown[] })?.data ??
        (Array.isArray(stationsRes.data) ? stationsRes.data : []);
      const adminsRaw =
        (adminsRes.data as { data?: unknown[] })?.data ??
        (Array.isArray(adminsRes.data) ? adminsRes.data : []);

      const stationCounts = new Map<string, number>();
      for (const s of stationsRaw as Array<Record<string, unknown>>) {
        const cid = s.company_id as string;
        stationCounts.set(cid, (stationCounts.get(cid) ?? 0) + 1);
      }
      const adminCounts = new Map<string, number>();
      for (const u of adminsRaw as Array<Record<string, unknown>>) {
        const cid = u.company_id as string;
        adminCounts.set(cid, (adminCounts.get(cid) ?? 0) + 1);
      }

      const raw = Array.isArray(companiesRes.data) ? companiesRes.data : [];
      setRows(
        raw.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) ?? '',
          createdAt: (c.created_at as string) ?? '',
          updatedAt: (c.updated_at as string) ?? '',
          stationCount: stationCounts.get(c.id as string) ?? 0,
          adminCount: adminCounts.get(c.id as string) ?? 0,
        })),
      );
    } catch {
      message.error('Failed to load companies');
      setRows([]);
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
      const res = await api.post('/companies', { name: values.name.trim(), country: 'RW' });
      message.success('Company created');
      setCreateOpen(false);
      createForm.resetFields();
      const id = (res.data as { id?: string })?.id;
      // Straight to the new company so the first admin can be added at once.
      if (id) router.push(`/admin/companies/${id}`);
      else fetchCompanies();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create company';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<CompanyRow> = [
    {
      title: 'Company',
      key: 'name',
      render: (_: unknown, record) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={record.name} square />
          <Text strong>{record.name}</Text>
        </div>
      ),
    },
    {
      title: 'Stations',
      dataIndex: 'stationCount',
      key: 'stationCount',
      width: 130,
      align: 'right',
      render: (n: number) => (n === 0 ? <Text type="secondary">0</Text> : n),
    },
    {
      title: 'Administrators',
      dataIndex: 'adminCount',
      key: 'adminCount',
      width: 150,
      align: 'right',
      render: (n: number) =>
        n === 0 ? (
          <Text className="!text-warn font-medium">None yet</Text>
        ) : (
          n
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (d: string) => (d ? dayjs(d).format('D MMM YYYY') : ''),
    },
    {
      key: 'open',
      width: 56,
      align: 'right',
      render: () => <RightOutlined className="text-ink-muted" aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">
            Companies
          </Title>
          <Text type="secondary">
            Each company is a tenant with its own stations, administrators and staff. Open one to
            manage its admins.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            createForm.resetFields();
            setCreateOpen(true);
          }}
        >
          New company
        </Button>
      </div>

      <Card className="!rounded-xl" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={rows.length > 20 ? { pageSize: 20, showTotal: (t) => `${t} companies` } : false}
          size="middle"
          rowClassName="cursor-pointer"
          onRow={(record) => ({
            onClick: () => router.push(`/admin/companies/${record.id}`),
          })}
          locale={{ emptyText: 'No companies yet. Create the first one to get started.' }}
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
          <Form.Item
            name="name"
            label="Company name"
            rules={[{ required: true, message: 'Enter the company name' }]}
          >
            <Input placeholder="e.g. Rubis Rwanda" autoFocus />
          </Form.Item>
          <Text type="secondary" className="block mb-4 text-sm">
            You will be taken to the company page next, where you can add its first administrator.
          </Text>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create company
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
