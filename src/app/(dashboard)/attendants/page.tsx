'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Card,
  DatePicker,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Drawer,
  Statistic,
  Checkbox,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Tooltip,
} from 'antd';
import { UserOutlined, BarChartOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { useStationStore } from '@/store/station-store';
import { useAuthStore } from '@/store/auth-store';
import ExportButton from '@/components/ExportButton';
import ComparisonChart from '@/components/charts/ComparisonChart';
import type { AttendantReport } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AttendantsPage() {
  const { currentStation } = useStationStore();
  const authUser = useAuthStore((s) => s.user);
  const [reports, setReports] = useState<AttendantReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [selectedAttendant, setSelectedAttendant] = useState<AttendantReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignPumpModalOpen, setAssignPumpModalOpen] = useState(false);
  const [assigningAttendant, setAssigningAttendant] = useState<AttendantReport | null>(null);
  const [pumps, setPumps] = useState<Array<{ id: string; pumpNumber: number; fuelType: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [assignPumpForm] = Form.useForm();

  const fetchPumps = useCallback(async () => {
    if (!currentStation) return;
    try {
      const res = await api.get('/pumps', { params: { stationId: currentStation.id } });
      const payload = res.data as { data?: unknown[] };
      const raw = payload?.data ?? (Array.isArray(res.data) ? res.data : []);
      setPumps((raw as { id: string; pump_number: number; fuel_type: string }[]).map((p) => ({
        id: p.id,
        pumpNumber: p.pump_number,
        fuelType: p.fuel_type,
      })));
    } catch {
      setPumps([]);
    }
  }, [currentStation]);

  const fetchReports = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const [attendantsRes, reportRes] = await Promise.all([
        api.get(`/users/attendants/${currentStation.id}`),
        api.get(`/reports/station/${currentStation.id}`, {
          params: { from: dateRange[0].toISOString(), to: dateRange[1].toISOString() },
        }),
      ]);
      const attendants = (Array.isArray(attendantsRes.data) ? attendantsRes.data : []) as Array<{
        id: string;
        name: string;
        assigned_pump_id?: string | null;
        pumps?: { id: string; pump_number: number; fuel_type: string } | null;
      }>;
      const perfList = (reportRes.data?.attendant_performance ?? []) as Array<{
        id: string;
        name: string;
        transactions: number;
        revenue: number;
        liters: number;
        cash: number;
        card: number;
        momo: number;
      }>;
      const perfByAtt = new Map(perfList.map((p) => [p.id, p]));
      const rows: AttendantReport[] = attendants.map((att) => {
        const p = perfByAtt.get(att.id);
        const pump = att.pumps;
        const assignedPumpLabel = pump
          ? `Pump #${pump.pump_number} (${pump.fuel_type === 'BOTH' ? 'Petrol & Diesel' : pump.fuel_type})`
          : att.assigned_pump_id
            ? 'Assigned'
            : null;
        const assignedPumpShort = pump ? `#${pump.pump_number}` : att.assigned_pump_id ? 'Assigned' : null;
        return {
          attendantId: att.id,
          attendantName: att.name ?? '—',
          assignedPumpId: att.assigned_pump_id ?? null,
          assignedPumpLabel: assignedPumpLabel ?? null,
          assignedPumpShort: assignedPumpShort ?? null,
          totalTransactions: p?.transactions ?? 0,
          totalLiters: p?.liters ?? 0,
          totalRevenue: p?.revenue ?? 0,
          cashAmount: p?.cash ?? 0,
          cardAmount: p?.card ?? 0,
          momoAmount: p?.momo ?? 0,
        };
      });
      setReports(rows);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [currentStation, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  const handleAssignPump = async (values: { pumpId: string | null }) => {
    if (!assigningAttendant) return;
    setSubmitting(true);
    try {
      await api.patch(`/users/${assigningAttendant.attendantId}`, {
        assigned_pump_id: values.pumpId || null,
      });
      message.success('Pump assignment updated.');
      setAssignPumpModalOpen(false);
      setAssigningAttendant(null);
      assignPumpForm.resetFields();
      fetchReports();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string }; status?: number } };
      const status = ax?.response?.status;
      const msg = ax?.response?.data?.message ?? 'Failed to assign pump';
      if (status === 404) {
        message.warning('This attendant is no longer in the system. Refreshing the list.');
        fetchReports();
      } else {
        message.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignPumpModal = (record: AttendantReport) => {
    setAssigningAttendant(record);
    assignPumpForm.setFieldsValue({ pumpId: record.assignedPumpId || undefined });
    setAssignPumpModalOpen(true);
  };

  const handleAddAttendant = async (values: { name: string; phone: string; pin: string }) => {
    if (!currentStation || !authUser?.companyId) {
      message.error('Station or company not set.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', {
        name: values.name,
        company_id: authUser.companyId,
        station_id: currentStation.id,
        role: 'attendant',
        phone: values.phone?.trim() || undefined,
        pin: String(values.pin || '').padEnd(4, '0').slice(0, 6),
      });
      message.success('Attendant added. They can log in on the mobile app with phone + PIN.');
      setAddModalOpen(false);
      form.resetFields();
      fetchReports();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to add attendant';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const columns: ColumnsType<AttendantReport> = [
    {
      title: '',
      key: 'compare',
      width: 50,
      render: (_: unknown, record: AttendantReport) => (
        <Checkbox
          checked={compareIds.includes(record.attendantId)}
          onChange={() => toggleCompare(record.attendantId)}
        />
      ),
    },
    {
      title: 'Attendant',
      dataIndex: 'attendantName',
      key: 'attendantName',
      sorter: (a, b) => a.attendantName.localeCompare(b.attendantName),
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Transactions',
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      sorter: (a, b) => a.totalTransactions - b.totalTransactions,
      align: 'right',
    },
    {
      title: 'Total Liters',
      dataIndex: 'totalLiters',
      key: 'totalLiters',
      sorter: (a, b) => a.totalLiters - b.totalLiters,
      align: 'right',
      render: (v: number) => `${v.toLocaleString()} L`,
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      align: 'right',
      render: (v: number) => <Text strong>{formatRWF(v)}</Text>,
    },
    {
      title: 'Cash',
      dataIndex: 'cashAmount',
      key: 'cashAmount',
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'Card',
      dataIndex: 'cardAmount',
      key: 'cardAmount',
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'MoMo',
      dataIndex: 'momoAmount',
      key: 'momoAmount',
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'Pump',
      key: 'assignedPump',
      width: 120,
      align: 'left',
      render: (_: unknown, record: AttendantReport) => (
        <div className="flex items-center gap-1 flex-nowrap">
          <span className="text-slate-500 shrink-0">
            {record.assignedPumpShort ? (
              <Tooltip title={record.assignedPumpLabel ?? record.assignedPumpShort}>
                {record.assignedPumpShort === 'Assigned' ? 'Assigned' : `Pump ${record.assignedPumpShort}`}
              </Tooltip>
            ) : (
              '—'
            )}
          </span>
          <Button
            type="link"
            size="small"
            className="!p-0 !min-w-0 !h-auto"
            icon={<ThunderboltOutlined />}
            onClick={() => openAssignPumpModal(record)}
          >
            {record.assignedPumpId ? 'Change' : 'Assign'}
          </Button>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: AttendantReport) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedAttendant(record);
            setDrawerOpen(true);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  const exportColumns = [
    { header: 'Attendant', key: 'attendantName' },
    { header: 'Transactions', key: 'totalTransactions' },
    { header: 'Liters', key: 'totalLiters' },
    { header: 'Revenue (RWF)', key: 'totalRevenue' },
    { header: 'Cash (RWF)', key: 'cashAmount' },
    { header: 'Card (RWF)', key: 'cardAmount' },
    { header: 'MoMo (RWF)', key: 'momoAmount' },
  ];

  const comparedAttendants = reports.filter((r) => compareIds.includes(r.attendantId));

  const chartData = comparedAttendants.map((a) => ({
    name: a.attendantName,
    Revenue: a.totalRevenue,
    Liters: a.totalLiters,
    Transactions: a.totalTransactions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Attendant Reports</Title>
          <Text type="secondary">Performance breakdown by attendant</Text>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            Add Attendant
          </Button>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) setDateRange(dates as [Dayjs, Dayjs]);
            }}
          />
          <ExportButton data={reports} columns={exportColumns} filename="attendant-reports" />
        </Space>
      </div>

      <Modal
        title={assigningAttendant ? `Assign pump – ${assigningAttendant.attendantName}` : 'Assign pump'}
        open={assignPumpModalOpen}
        onCancel={() => { setAssignPumpModalOpen(false); setAssigningAttendant(null); assignPumpForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={assignPumpForm} layout="vertical" onFinish={handleAssignPump}>
          <Form.Item name="pumpId" label="Pump">
            <Select
              allowClear
              placeholder="Select a pump (or clear assignment)"
              options={[
                ...pumps.map((p) => ({
                  value: p.id,
                  label: `Pump #${p.pumpNumber} (${p.fuelType === 'BOTH' ? 'Petrol & Diesel' : p.fuelType})`,
                })),
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setAssignPumpModalOpen(false); setAssigningAttendant(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Save</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Add Attendant"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddAttendant}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Jean Paul" />
          </Form.Item>
          <Form.Item name="phone" label="Phone number" rules={[{ required: true }]}>
            <Input placeholder="e.g. +250 788 123 456" />
          </Form.Item>
          <Form.Item name="pin" label="PIN (4–6 digits)" rules={[{ required: true, len: [4, 6], message: '4–6 digits' }]}>
            <Input.Password placeholder="1234" maxLength={6} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Add Attendant</Button>
          </div>
        </Form>
      </Modal>

      {compareIds.length === 2 && (
        <Card className="!rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <Space>
              <BarChartOutlined />
              <Text strong>
                Comparing: {comparedAttendants.map((a) => a.attendantName).join(' vs ')}
              </Text>
            </Space>
            <Button size="small" onClick={() => setCompareIds([])}>
              Clear Comparison
            </Button>
          </div>
          <ComparisonChart data={chartData} labels={['Revenue', 'Liters', 'Transactions']} />
        </Card>
      )}

      {compareIds.length === 1 && (
        <Tag color="orange" className="!text-sm !px-3 !py-1">
          Select one more attendant to compare
        </Tag>
      )}

      <Card className="!rounded-xl overflow-hidden">
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="attendantId"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} attendants` }}
          size="middle"
          tableLayout="fixed"
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={selectedAttendant?.attendantName || 'Attendant Details'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
      >
        {selectedAttendant && (
          <div className="space-y-6">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Total Revenue" value={selectedAttendant.totalRevenue} prefix="RWF" />
              </Col>
              <Col span={12}>
                <Statistic title="Total Liters" value={selectedAttendant.totalLiters} suffix="L" />
              </Col>
              <Col span={12}>
                <Statistic title="Transactions" value={selectedAttendant.totalTransactions} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Avg per Transaction"
                  value={
                    selectedAttendant.totalTransactions > 0
                      ? Math.round(selectedAttendant.totalRevenue / selectedAttendant.totalTransactions)
                      : 0
                  }
                  prefix="RWF"
                />
              </Col>
            </Row>

            <Card title="Payment Breakdown" size="small" className="!rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text>Cash</Text>
                  <Text strong>{formatRWF(selectedAttendant.cashAmount)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text>Card</Text>
                  <Text strong>{formatRWF(selectedAttendant.cardAmount)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text>Mobile Money</Text>
                  <Text strong>{formatRWF(selectedAttendant.momoAmount)}</Text>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
