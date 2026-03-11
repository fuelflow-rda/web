'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Space,
  message,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { useStationStore } from '@/store/station-store';
import ExportButton from '@/components/ExportButton';
import type { ReconciliationReport, PumpReconciliation, PaymentBreakdown } from '@/types';

const { Title, Text } = Typography;

export default function ReconciliationPage() {
  const { currentStation } = useStationStore();
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const fetchReport = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const res = await api.get(`/stations/${currentStation.id}/reconciliation`, {
        params: { date: selectedDate.format('YYYY-MM-DD') },
      });
      setReport(res.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [currentStation, selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleGenerate = async () => {
    if (!currentStation) return;
    setGenerating(true);
    try {
      const res = await api.post(`/stations/${currentStation.id}/reconciliation`, {
        date: selectedDate.format('YYYY-MM-DD'),
      });
      setReport(res.data);
      message.success('Reconciliation report generated');
    } catch {
      message.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const pumpColumns: ColumnsType<PumpReconciliation> = [
    {
      title: 'Pump',
      key: 'pump',
      render: (_: unknown, record: PumpReconciliation) => (
        <Space>
          <Text strong>#{record.pumpNumber}</Text>
          <Tag color={record.fuelType === 'PETROL' ? 'orange' : 'blue'}>
            {record.fuelType}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Liters',
      dataIndex: 'litersDispensed',
      key: 'litersDispensed',
      align: 'right',
      render: (v: number) => `${v.toLocaleString()} L`,
    },
    {
      title: 'Expected',
      dataIndex: 'expectedRevenue',
      key: 'expectedRevenue',
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'Recorded',
      dataIndex: 'recordedRevenue',
      key: 'recordedRevenue',
      align: 'right',
      render: (v: number) => formatRWF(v),
    },
    {
      title: 'Difference',
      dataIndex: 'difference',
      key: 'difference',
      align: 'right',
      render: (v: number) => (
        <Text strong className={v !== 0 ? '!text-red-500' : '!text-green-600'}>
          {v === 0 ? '—' : formatRWF(v)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'BALANCED' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Balanced</Tag>
        ) : (
          <Tag icon={<WarningOutlined />} color="warning">Discrepancy</Tag>
        ),
    },
  ];

  const paymentColumns: ColumnsType<PaymentBreakdown> = [
    {
      title: 'Payment Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Text strong>{method}</Text>,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v: number) => <Text strong>{formatRWF(v)}</Text>,
    },
  ];

  const exportPumpData = (report?.pumpBreakdown || []).map((p) => ({
    pump: `#${p.pumpNumber} (${p.fuelType})`,
    litersDispensed: p.litersDispensed,
    expectedRevenue: p.expectedRevenue,
    recordedRevenue: p.recordedRevenue,
    difference: p.difference,
    status: p.status,
  }));

  const exportPumpColumns = [
    { header: 'Pump', key: 'pump' },
    { header: 'Liters', key: 'litersDispensed' },
    { header: 'Expected (RWF)', key: 'expectedRevenue' },
    { header: 'Recorded (RWF)', key: 'recordedRevenue' },
    { header: 'Difference (RWF)', key: 'difference' },
    { header: 'Status', key: 'status' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Reconciliation</Title>
          <Text type="secondary">End of day revenue reconciliation</Text>
        </div>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(d) => d && setSelectedDate(d)}
            disabledDate={(d) => d.isAfter(dayjs())}
          />
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handleGenerate}
            loading={generating}
          >
            Generate Report
          </Button>
          <ExportButton
            data={exportPumpData}
            columns={exportPumpColumns}
            filename={`reconciliation-${selectedDate.format('YYYY-MM-DD')}`}
          />
        </Space>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : report ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card className="!rounded-xl">
                <Statistic
                  title="Expected Revenue"
                  value={report.expectedRevenue}
                  prefix="RWF"
                  valueStyle={{ color: '#3B82F6' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="!rounded-xl">
                <Statistic
                  title="Recorded Revenue"
                  value={report.recordedRevenue}
                  prefix="RWF"
                  valueStyle={{ color: '#10B981' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="!rounded-xl">
                <div className="flex items-center justify-between">
                  <Statistic
                    title="Difference"
                    value={report.difference}
                    prefix="RWF"
                    valueStyle={{
                      color: report.status === 'BALANCED' ? '#10B981' : '#F97316',
                    }}
                  />
                  {report.status === 'BALANCED' ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" className="!text-base !px-4 !py-1">
                      Balanced
                    </Tag>
                  ) : (
                    <Tag icon={<WarningOutlined />} color="warning" className="!text-base !px-4 !py-1">
                      Discrepancy
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="Breakdown by Pump" className="!rounded-xl">
            <Table
              columns={pumpColumns}
              dataSource={report.pumpBreakdown}
              rowKey="pumpId"
              pagination={false}
              size="middle"
              rowClassName={(record) =>
                record.status === 'DISCREPANCY' ? 'bg-orange-50' : ''
              }
            />
          </Card>

          <Card title="Breakdown by Payment Method" className="!rounded-xl">
            <Table
              columns={paymentColumns}
              dataSource={report.paymentBreakdown}
              rowKey="method"
              pagination={false}
              size="middle"
            />
          </Card>
        </>
      ) : (
        <Card className="!rounded-xl text-center py-12">
          <FileTextOutlined className="text-5xl text-gray-300 mb-4" />
          <Title level={4} type="secondary">No Report Found</Title>
          <Text type="secondary">
            No reconciliation report for {selectedDate.format('MMMM D, YYYY')}.
            Click &ldquo;Generate Report&rdquo; to create one.
          </Text>
        </Card>
      )}
    </div>
  );
}
