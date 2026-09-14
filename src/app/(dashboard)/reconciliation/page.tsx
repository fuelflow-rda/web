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
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { formatQuantity, productLabel, productTagColor, unitLabel } from '@/lib/product-types';
import { useStationStore } from '@/store/station-store';
import ExportButton from '@/components/ExportButton';
import type {
  ReconciliationReport,
  PumpReconciliation,
  PaymentBreakdown,
  AttendantReconciliation,
} from '@/types';

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
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const res = await api.get(`/reconciliation/${currentStation.id}/${dateStr}`);
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

  const handleDateChange = (d: Dayjs | null) => {
    if (!d) return;
    setSelectedDate(d);
    if (currentStation) {
      setLoading(true);
      const dateStr = d.format('YYYY-MM-DD');
      api
        .get(`/reconciliation/${currentStation.id}/${dateStr}`)
        .then((res) => setReport(res.data))
        .catch(() => setReport(null))
        .finally(() => setLoading(false));
    }
  };

  const handleGenerate = async () => {
    if (!currentStation) return;
    setGenerating(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const res = await api.post(`/reconciliation/${currentStation.id}/generate`, {}, {
        params: { date: dateStr },
      });
      setReport(res.data);
      message.success(`Report for ${selectedDate.format('MMM D, YYYY')} generated`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      message.error(ax?.response?.data?.message ?? 'Failed to generate report');
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
          <Tag color={productTagColor(record.productType)}>{productLabel(record.productType)}</Tag>
        </Space>
      ),
    },
    {
      title: 'Dispensed',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (v: number, record: PumpReconciliation) => formatQuantity(v, record.unit),
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
        <Text strong className={v !== 0 ? '!text-danger' : '!text-accent'}>
          {formatRWF(v)}
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

  const attendantColumns: ColumnsType<AttendantReconciliation> = [
    {
      title: 'Attendant',
      dataIndex: 'attendantName',
      key: 'attendantName',
      render: (name: string) => (
        <Space>
          <UserOutlined className="text-ink-muted" />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Transactions',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      align: 'right',
    },
    {
      title: 'Dispensed',
      key: 'liters',
      align: 'right',
      render: (_: unknown, record: AttendantReconciliation) => (
        <div className="leading-tight">
          <div>{Number(record.liters).toLocaleString()} L</div>
          {record.kwh > 0 && (
            <div className="text-xs text-accent font-semibold">
              {Number(record.kwh).toLocaleString()} kWh
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (v: number) => <Text strong>{formatRWF(v)}</Text>,
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
    pump: `#${p.pumpNumber} (${productLabel(p.productType)})`,
    quantity: p.quantity,
    unit: unitLabel(p.unit),
    expectedRevenue: p.expectedRevenue,
    recordedRevenue: p.recordedRevenue,
    difference: p.difference,
    status: p.status,
  }));

  const exportPumpColumns = [
    { header: 'Pump', key: 'pump' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Unit', key: 'unit' },
    { header: 'Expected (RWF)', key: 'expectedRevenue' },
    { header: 'Recorded (RWF)', key: 'recordedRevenue' },
    { header: 'Difference (RWF)', key: 'difference' },
    { header: 'Status', key: 'status' },
  ];

  const reportDateLabel = selectedDate.format('MMMM D, YYYY');
  const exportData = [
    ...(report?.pumpBreakdown || []).map((p) => ({
      section: 'Pump',
      label: `#${p.pumpNumber} (${productLabel(p.productType)})`,
      quantity: p.quantity,
      unit: unitLabel(p.unit),
      expectedRevenue: p.expectedRevenue,
      recordedRevenue: p.recordedRevenue,
      difference: p.difference,
      status: p.status,
    })),
    ...(report?.attendantBreakdown || []).map((a) => ({
      section: 'Attendant',
      label: a.attendantName,
      transactionCount: a.transactionCount,
      liters: a.liters,
      kwh: a.kwh,
      revenue: a.revenue,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Reconciliation</Title>
          <Text type="secondary">End of day revenue reconciliation · Select a date, then generate</Text>
        </div>
        <Space wrap align="center">
          <span className="text-ink-secondary text-sm font-medium flex items-center gap-1.5">
            <CalendarOutlined />
            Report date
          </span>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            disabledDate={(d) => d.isAfter(dayjs())}
            allowClear={false}
          />
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handleGenerate}
            loading={generating}
          >
            Generate report for {selectedDate.format('MMM D')}
          </Button>
          <ExportButton
            data={report ? exportData : exportPumpData}
            columns={
              report
                ? [
                    { header: 'Section', key: 'section' },
                    { header: 'Label', key: 'label' },
                    { header: 'Transactions', key: 'transactionCount' },
                    { header: 'Liters', key: 'liters' },
                    { header: 'kWh', key: 'kwh' },
                    { header: 'Quantity', key: 'quantity' },
                    { header: 'Unit', key: 'unit' },
                    { header: 'Revenue (RWF)', key: 'revenue' },
                    { header: 'Expected (RWF)', key: 'expectedRevenue' },
                    { header: 'Recorded (RWF)', key: 'recordedRevenue' },
                    { header: 'Difference', key: 'difference' },
                    { header: 'Status', key: 'status' },
                  ]
                : exportPumpColumns
            }
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
          <div className="flex items-center gap-2 pb-2 border-b border-line-subtle">
            <CalendarOutlined className="text-ink-muted" />
            <Text strong className="text-ink-secondary">
              Report for {reportDateLabel}
            </Text>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card className="!rounded-xl">
                <Statistic
                  title="Expected Revenue"
                  value={report.expectedRevenue}
                  prefix="RWF"
                  valueStyle={{ color: 'var(--ink-secondary)' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="!rounded-xl">
                <Statistic
                  title="Recorded Revenue"
                  value={report.recordedRevenue}
                  prefix="RWF"
                  valueStyle={{ color: 'var(--accent)' }}
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
                      color: report.status === 'BALANCED' ? 'var(--accent)' : 'var(--warn)',
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

          <Card
            title={
              <span className="flex items-center gap-2">
                <UserOutlined />
                Attendants who worked
              </span>
            }
            className="!rounded-xl"
          >
            <Table
              columns={attendantColumns}
              dataSource={report.attendantBreakdown ?? []}
              rowKey="attendantId"
              pagination={false}
              size="middle"
              locale={{ emptyText: 'No attendant activity for this date' }}
            />
          </Card>

          <Card title="Breakdown by Pump" className="!rounded-xl">
            <Table
              columns={pumpColumns}
              dataSource={report.pumpBreakdown}
              rowKey="pumpId"
              pagination={false}
              size="middle"
              rowClassName={(record) =>
                record.status === 'DISCREPANCY' ? 'bg-warn-tint' : ''
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
          <FileTextOutlined className="text-5xl text-ink-disabled mb-4" />
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
