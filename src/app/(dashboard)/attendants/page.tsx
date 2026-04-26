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
import { UserOutlined, BarChartOutlined, PlusOutlined, ThunderboltOutlined, PhoneOutlined, CalendarOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { fuelTypeLabel } from '@/lib/fuel-type-labels';
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
  const [pinResetLoading, setPinResetLoading] = useState(false);
  const [form] = Form.useForm();
  const [assignPumpForm] = Form.useForm();
  const [pinResetForm] = Form.useForm();

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
        phone?: string | null;
        is_active?: boolean;
        created_at?: string | null;
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
          ? `Pump #${pump.pump_number} (${fuelTypeLabel(String(pump.fuel_type))})`
          : att.assigned_pump_id
            ? 'Assigned'
            : null;
        const assignedPumpShort = pump ? `#${pump.pump_number}` : att.assigned_pump_id ? 'Assigned' : null;
        return {
          attendantId: att.id,
          attendantName: att.name ?? 'Unknown',
          phone: att.phone ?? null,
          isActive: att.is_active ?? true,
          createdAt: att.created_at ?? null,
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

  const handleResetPin = async (values: { newPin: string }) => {
    if (!selectedAttendant) return;
    setPinResetLoading(true);
    try {
      await api.patch(`/users/${selectedAttendant.attendantId}`, {
        pin: values.newPin,
      });
      message.success(`PIN updated for ${selectedAttendant.attendantName}.`);
      pinResetForm.resetFields();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset PIN';
      message.error(msg);
    } finally {
      setPinResetLoading(false);
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
      width: 40,
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
      width: 180,
      ellipsis: true,
      sorter: (a, b) => a.attendantName.localeCompare(b.attendantName),
      render: (name: string, record: AttendantReport) => (
        <div>
          <Space>
            <UserOutlined />
            <Text strong>{name}</Text>
          </Space>
          {record.phone && (
            <div className="text-xs text-slate-400 mt-0.5 ml-5">{record.phone}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Txns',
      dataIndex: 'totalTransactions',
      key: 'totalTransactions',
      sorter: (a, b) => a.totalTransactions - b.totalTransactions,
      align: 'right',
      width: 80,
    },
    {
      title: 'Liters',
      dataIndex: 'totalLiters',
      key: 'totalLiters',
      sorter: (a, b) => a.totalLiters - b.totalLiters,
      align: 'right',
      width: 100,
      render: (v: number) => `${v.toLocaleString()} L`,
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      align: 'right',
      width: 130,
      render: (v: number) => <Text strong>{formatRWF(v)}</Text>,
    },
    {
      title: 'Pump',
      key: 'assignedPump',
      width: 140,
      render: (_: unknown, record: AttendantReport) => (
        <div className="flex items-center gap-1 flex-nowrap">
          <span className="text-slate-500 shrink-0">
            {record.assignedPumpShort ? (
              <Tooltip title={record.assignedPumpLabel ?? record.assignedPumpShort}>
                {record.assignedPumpShort === 'Assigned' ? 'Assigned' : `Pump ${record.assignedPumpShort}`}
              </Tooltip>
            ) : (
              'Not assigned'
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
      title: 'Status',
      key: 'status',
      width: 80,
      render: (_: unknown, record: AttendantReport) => (
        <Tag color={record.isActive !== false ? 'green' : 'red'}>
          {record.isActive !== false ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
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
        title={assigningAttendant ? `Assign pump: ${assigningAttendant.attendantName}` : 'Assign pump'}
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
                  label: `Pump #${p.pumpNumber} (${fuelTypeLabel(p.fuelType)})`,
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
          <Form.Item name="pin" label="PIN (4 to 6 digits)" rules={[{ required: true, min: 4, max: 6, message: 'Enter 4 to 6 digits' }]}>
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
          scroll={{ x: 800 }}
        />
      </Card>

      <Drawer
        title={selectedAttendant?.attendantName || 'Attendant Details'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); pinResetForm.resetFields(); }}
        width={480}
      >
        {selectedAttendant && (
          <div className="space-y-6">
            {/* Profile Info */}
            <Card size="small" className="!rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-slate-400" />
                  <Text className="w-24 text-slate-500">Name</Text>
                  <Text strong>{selectedAttendant.attendantName}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-slate-400" />
                  <Text className="w-24 text-slate-500">Phone</Text>
                  <Text strong>{selectedAttendant.phone || 'Not set'}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <ThunderboltOutlined className="text-slate-400" />
                  <Text className="w-24 text-slate-500">Pump</Text>
                  <Text strong>{selectedAttendant.assignedPumpLabel || 'Not assigned'}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <SafetyOutlined className="text-slate-400" />
                  <Text className="w-24 text-slate-500">Status</Text>
                  <Tag color={selectedAttendant.isActive !== false ? 'green' : 'red'}>
                    {selectedAttendant.isActive !== false ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
                {selectedAttendant.createdAt && (
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-slate-400" />
                    <Text className="w-24 text-slate-500">Joined</Text>
                    <Text>{dayjs(selectedAttendant.createdAt).format('MMM D, YYYY')}</Text>
                  </div>
                )}
              </div>
            </Card>

            {/* Performance Stats */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Total Revenue" value={selectedAttendant.totalRevenue} prefix="RWF" />
              </Col>
              <Col span={12}>
                <Statistic title="Total Liters" value={selectedAttendant.totalLiters} suffix="L" precision={1} />
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

            {/* Payment Breakdown */}
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

            {/* Reset PIN */}
            <Card
              title={<span><LockOutlined className="mr-2" />Reset PIN</span>}
              size="small"
              className="!rounded-lg"
            >
              <Form form={pinResetForm} layout="vertical" onFinish={handleResetPin}>
                <Form.Item
                  name="newPin"
                  label="New PIN (4 to 6 digits)"
                  rules={[
                    { required: true, message: 'Enter a new PIN' },
                    { min: 4, max: 6, message: 'PIN must be 4 to 6 digits' },
                    { pattern: /^\d+$/, message: 'PIN must be numbers only' },
                  ]}
                >
                  <Input.Password placeholder="e.g. 1234" maxLength={6} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={pinResetLoading}
                  danger
                  block
                >
                  Reset PIN
                </Button>
              </Form>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
