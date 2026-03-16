'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Card,
  Typography,
  Radio,
  Tag,
  Space,
  Select,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { useStationStore } from '@/store/station-store';
import ExportButton from '@/components/ExportButton';
import PumpPerformanceChart from '@/components/charts/PumpPerformanceChart';
import type { PumpReport, Pump } from '@/types';

const { Title, Text } = Typography;

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function PumpsPage() {
  const { currentStation } = useStationStore();
  const [reports, setReports] = useState<PumpReport[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedPumpId, setSelectedPumpId] = useState<string | undefined>();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchPumps = useCallback(async () => {
    if (!currentStation) return;
    try {
      const pumpsRes = await api.get('/pumps', { params: { stationId: currentStation.id } });
      const out = pumpsRes.data as { data?: unknown[] };
      const raw = out?.data ?? (Array.isArray(pumpsRes.data) ? pumpsRes.data : []);
      const mapped = (
        Array.isArray(raw) ? raw : []
      ).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        stationId: p.station_id as string,
        pumpNumber: Number(p.pump_number) ?? 0,
        fuelType: (p.fuel_type as Pump['fuelType']) ?? 'BOTH',
        status: (String(p.status ?? 'active').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as Pump['status'],
        createdAt: (p.created_at as string) ?? '',
        updatedAt: (p.updated_at as string) ?? '',
      }));
      setPumps(mapped);
    } catch {
      setPumps([]);
    }
  }, [currentStation]);

  useEffect(() => {
    if (pumps.length > 0 && !selectedPumpId) setSelectedPumpId(pumps[0].id);
  }, [pumps, selectedPumpId]);

  const fetchReports = useCallback(async () => {
    if (!currentStation || !selectedPumpId) {
      setReports([]);
      return;
    }
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date();
      if (viewMode === 'daily') from.setDate(from.getDate() - 30);
      else if (viewMode === 'weekly') from.setDate(from.getDate() - 90);
      else from.setMonth(from.getMonth() - 12);
      const res = await api.get(`/reports/pump/${selectedPumpId}`, {
        params: { from: from.toISOString(), to: to.toISOString() },
      });
      const payload = res.data as { transactions?: Array<{ liters?: number; total_amount?: number; timestamp?: string; fuel_type?: string }> };
      const tx = Array.isArray(payload?.transactions) ? payload.transactions : [];
      const pump = pumps.find((p) => p.id === selectedPumpId);
      const totalLiters = tx.reduce((s, t) => s + parseFloat(String(t.liters ?? 0)), 0);
      const totalRev = tx.reduce((s, t) => s + (t.total_amount ?? 0), 0);
      const summaryRow: PumpReport = {
        date: from.toISOString().slice(0, 10) + ' – ' + to.toISOString().slice(0, 10),
        pumpId: selectedPumpId,
        pumpNumber: pump?.pumpNumber ?? 0,
        fuelType: (pump?.fuelType as PumpReport['fuelType']) ?? 'BOTH',
        litersDispensed: totalLiters,
        expectedRevenue: totalRev,
        recordedRevenue: totalRev,
        discrepancy: 0,
      };
      const transactionRows: PumpReport[] = tx.map((t, i) => {
        const liters = parseFloat(String(t.liters ?? 0));
        const amt = t.total_amount ?? 0;
        const dateStr = t.timestamp ? new Date(t.timestamp).toISOString().slice(0, 10) : to.toISOString().slice(0, 10);
        return {
          date: dateStr,
          pumpId: selectedPumpId,
          pumpNumber: pump?.pumpNumber ?? 0,
          fuelType: (t.fuel_type as PumpReport['fuelType']) ?? pump?.fuelType ?? 'BOTH',
          litersDispensed: liters,
          expectedRevenue: amt,
          recordedRevenue: amt,
          discrepancy: 0,
        };
      });
      setReports(transactionRows.length > 0 ? transactionRows : (totalLiters > 0 || totalRev > 0 ? [summaryRow] : []));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [currentStation, viewMode, selectedPumpId, pumps]);

  useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  useEffect(() => {
    if (selectedPumpId && pumps.length > 0) fetchReports();
    else setReports([]);
  }, [selectedPumpId, pumps.length, viewMode, fetchReports]);

  useEffect(() => {
    if (addModalOpen && currentStation?.id) {
      api.get<{ nextNumber: number }>('/pumps/next-number', { params: { stationId: currentStation.id } })
        .then((res) => {
          const next = res.data?.nextNumber ?? (pumps.length > 0 ? Math.max(...pumps.map((p) => p.pumpNumber), 0) + 1 : 1);
          form.setFieldsValue({ pumpNumber: next, fuelType: 'PETROL' });
        })
        .catch(() => {
          const nextNum = pumps.length > 0 ? Math.max(...pumps.map((p) => p.pumpNumber), 0) + 1 : 1;
          form.setFieldsValue({ pumpNumber: nextNum, fuelType: 'PETROL' });
        });
    }
  }, [addModalOpen, currentStation?.id, pumps, form]);

  const handleAddPump = async (values: { pumpNumber: number; fuelType: string }) => {
    if (!currentStation) return;
    setSubmitting(true);
    try {
      await api.post('/pumps', {
        station_id: currentStation.id,
        pump_number: Number(values.pumpNumber) ?? 1,
        fuel_type: values.fuelType ?? 'PETROL',
      });
      message.success('Pump added.');
      setAddModalOpen(false);
      form.resetFields();
      fetchPumps();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const msg = Array.isArray(ax?.response?.data?.message)
        ? ax.response.data.message[0]
        : (ax?.response?.data?.message as string) || 'Failed to add pump';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<PumpReport> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Pump',
      key: 'pump',
      render: (_: unknown, record: PumpReport) => (
        <Space>
          <Text strong>#{record.pumpNumber}</Text>
          <Tag color={record.fuelType === 'PETROL' ? 'orange' : record.fuelType === 'DIESEL' ? 'blue' : 'green'}>
            {record.fuelType === 'BOTH' ? 'Petrol & Diesel' : record.fuelType}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Liters Dispensed',
      dataIndex: 'litersDispensed',
      key: 'litersDispensed',
      sorter: (a, b) => a.litersDispensed - b.litersDispensed,
      align: 'right',
      render: (v: number) => `${v.toLocaleString()} L`,
    },
    {
      title: 'Expected Revenue',
      dataIndex: 'expectedRevenue',
      key: 'expectedRevenue',
      sorter: (a, b) => a.expectedRevenue - b.expectedRevenue,
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'Recorded Revenue',
      dataIndex: 'recordedRevenue',
      key: 'recordedRevenue',
      sorter: (a, b) => a.recordedRevenue - b.recordedRevenue,
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'Discrepancy',
      dataIndex: 'discrepancy',
      key: 'discrepancy',
      sorter: (a, b) => a.discrepancy - b.discrepancy,
      align: 'right',
      render: (v: number) => (
        <Text
          strong
          className={Math.abs(v) > 0 ? '!text-red-500' : '!text-green-600'}
        >
          {v === 0 ? '—' : formatRWF(v)}
        </Text>
      ),
    },
  ];

  const exportColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Pump #', key: 'pumpNumber' },
    { header: 'Fuel Type', key: 'fuelType' },
    { header: 'Liters', key: 'litersDispensed' },
    { header: 'Expected (RWF)', key: 'expectedRevenue' },
    { header: 'Recorded (RWF)', key: 'recordedRevenue' },
    { header: 'Discrepancy (RWF)', key: 'discrepancy' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Pump Reports</Title>
          <Text type="secondary">
            Pumps are assigned to the current station. Use &quot;Add Pump&quot; to create a new pump here; select a pump below to view reports.
          </Text>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)} disabled={!currentStation}>
            Add Pump
          </Button>
          <ExportButton data={reports} columns={exportColumns} filename="pump-reports" />
        </Space>
      </div>

      <Modal title="Add Pump" open={addModalOpen} onCancel={() => { setAddModalOpen(false); form.resetFields(); }} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAddPump}>
          <Form.Item name="pumpNumber" label="Pump Number" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber className="!w-full" placeholder="e.g. 1" min={1} />
          </Form.Item>
          <Form.Item name="fuelType" label="Fuel Type" rules={[{ required: true }]} initialValue="BOTH">
            <Select options={[
              { value: 'BOTH', label: 'Petrol & Diesel' },
              { value: 'PETROL', label: 'Petrol only' },
              { value: 'DIESEL', label: 'Diesel only' },
            ]} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Add Pump</Button>
          </div>
        </Form>
      </Modal>

      <Card className="!rounded-xl">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="daily">Daily</Radio.Button>
            <Radio.Button value="weekly">Weekly</Radio.Button>
            <Radio.Button value="monthly">Monthly</Radio.Button>
          </Radio.Group>
          <Select
            value={selectedPumpId}
            onChange={setSelectedPumpId}
            placeholder="All Pumps"
            allowClear
            className="w-44"
            options={pumps.map((p) => ({
              value: p.id,
              label: `Pump #${p.pumpNumber} (${p.fuelType})`,
            }))}
          />
        </div>

        <PumpPerformanceChart data={reports} />
      </Card>

      <Card className="!rounded-xl" title="Detailed Report">
        <Table
          columns={columns}
          dataSource={reports}
          rowKey={(_, index) => `report-${selectedPumpId}-${index}`}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} records` }}
          size="middle"
          rowClassName={(record) =>
            Math.abs(record.discrepancy) > 0 ? 'bg-red-50' : ''
          }
        />
      </Card>
    </div>
  );
}
