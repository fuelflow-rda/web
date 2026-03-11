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
} from 'antd';
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

  const fetchData = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const [reportsRes, pumpsRes] = await Promise.all([
        api.get(`/stations/${currentStation.id}/reports/pumps`, {
          params: { period: viewMode, pumpId: selectedPumpId },
        }),
        api.get(`/stations/${currentStation.id}/pumps`),
      ]);
      setReports(reportsRes.data);
      setPumps(pumpsRes.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [currentStation, viewMode, selectedPumpId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <Tag color={record.fuelType === 'PETROL' ? 'orange' : 'blue'}>
            {record.fuelType}
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
          <Text type="secondary">Performance and discrepancy tracking per pump</Text>
        </div>
        <ExportButton data={reports} columns={exportColumns} filename="pump-reports" />
      </div>

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
          rowKey={(record) => `${record.pumpId}-${record.date}`}
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
