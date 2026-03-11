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
  Tag,
} from 'antd';
import { UserOutlined, BarChartOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { useStationStore } from '@/store/station-store';
import ExportButton from '@/components/ExportButton';
import ComparisonChart from '@/components/charts/ComparisonChart';
import type { AttendantReport } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AttendantsPage() {
  const { currentStation } = useStationStore();
  const [reports, setReports] = useState<AttendantReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [selectedAttendant, setSelectedAttendant] = useState<AttendantReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const res = await api.get(`/stations/${currentStation.id}/reports/attendants`, {
        params: {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
        },
      });
      setReports(res.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [currentStation, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) setDateRange(dates as [Dayjs, Dayjs]);
            }}
          />
          <ExportButton data={reports} columns={exportColumns} filename="attendant-reports" />
        </Space>
      </div>

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

      <Card className="!rounded-xl">
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="attendantId"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} attendants` }}
          size="middle"
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
