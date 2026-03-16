'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  DatePicker,
  Tag,
  Button,
  Space,
  Typography,
  Tooltip,
  Modal,
  Form,
  message,
} from 'antd';
import {
  SearchOutlined,
  FlagOutlined,
  CreditCardOutlined,
  DollarOutlined,
  MobileOutlined,
  WalletOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { useStationStore } from '@/store/station-store';
import ExportButton from '@/components/ExportButton';
import type { Transaction, Pump, User } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const paymentIcons: Record<string, React.ReactNode> = {
  CASH: <DollarOutlined />,
  CARD: <CreditCardOutlined />,
  MOMO: <MobileOutlined />,
  CREDIT: <WalletOutlined />,
};

export default function TransactionsPage() {
  const { currentStation } = useStationStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [attendants, setAttendants] = useState<User[]>([]);
  const [flagModalVisible, setFlagModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [flagForm] = Form.useForm();

  const [filters, setFilters] = useState<{
    dateRange: [Dayjs, Dayjs] | null;
    pumpId: string | undefined;
    attendantId: string | undefined;
    fuelType: string | undefined;
    paymentMethod: string | undefined;
    search: string;
  }>({
    dateRange: null,
    pumpId: undefined,
    attendantId: undefined,
    fuelType: undefined,
    paymentMethod: undefined,
    search: '',
  });

  const fetchTransactions = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: pageSize,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      };
      params.station_id = currentStation.id;
      if (filters.dateRange) {
        params.from = filters.dateRange[0].startOf('day').toISOString();
        params.to = filters.dateRange[1].endOf('day').toISOString();
      }
      if (filters.pumpId) params.pump_id = filters.pumpId;
      if (filters.attendantId) params.attendant_id = filters.attendantId;
      if (filters.fuelType) params.fuel_type = filters.fuelType;
      if (filters.paymentMethod) params.payment_method = filters.paymentMethod;
      if (filters.search?.trim()) params.search = filters.search.trim();

      const res = await api.get('/transactions', { params });
      const payload = res.data as { data?: unknown[]; pagination?: { total: number } };
      const raw = Array.isArray(payload?.data) ? payload.data : [];
      setTransactions(
        raw.map((t) => {
          const r = t as Record<string, unknown>;
          const users = r.users as { id: string; name: string } | undefined;
          const pumpsRef = r.pumps as { id: string; pump_number: number; fuel_type: string } | undefined;
          return {
            id: r.id as string,
            stationId: r.station_id as string,
            pumpId: r.pump_id as string,
            attendantId: r.attendant_id as string,
            fuelType: (r.fuel_type as Transaction['fuelType']) ?? 'PETROL',
            liters: Number(r.liters) ?? 0,
            pricePerLiter: Number(r.price_per_liter) ?? 0,
            totalAmount: Number(r.total_amount) ?? 0,
            paymentMethod: (r.payment_method as Transaction['paymentMethod']) ?? 'CASH',
            isFlagged: Boolean(r.is_flagged),
            vehiclePlate: (r.vehicle_plate as string) ?? undefined,
            customerPhone: (r.customer_phone as string) ?? undefined,
            createdAt: (r.timestamp ?? r.created_at) as string,
            updatedAt: (r.updated_at ?? r.timestamp) as string,
            pump: pumpsRef ? { id: pumpsRef.id, pumpNumber: pumpsRef.pump_number, fuelType: pumpsRef.fuel_type as Pump['fuelType'], stationId: '', status: 'ACTIVE' as const, createdAt: '', updatedAt: '' } : undefined,
            attendant: users ? { id: users.id, name: users.name, email: '', role: 'ATTENDANT' as const, isActive: true, createdAt: '', updatedAt: '' } : undefined,
          };
        }),
      );
      setTotal(payload?.pagination?.total ?? raw.length);
    } catch {
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentStation, page, pageSize, filters]);

  const fetchFiltersData = useCallback(async () => {
    if (!currentStation) return;
    try {
      const [pumpsRes, attendantsRes] = await Promise.all([
        api.get('/pumps', { params: { stationId: currentStation.id } }),
        api.get(`/users/attendants/${currentStation.id}`),
      ]);
      const pumpOut = pumpsRes.data as { data?: unknown[] };
      const rawPumps = pumpOut?.data ?? (Array.isArray(pumpsRes.data) ? pumpsRes.data : []);
      setPumps(
        rawPumps.map((p) => {
          const r = p as Record<string, unknown>;
          return {
            id: r.id as string,
            stationId: r.station_id as string,
            pumpNumber: Number(r.pump_number) ?? 0,
            fuelType: (r.fuel_type as Pump['fuelType']) ?? 'PETROL',
            status: 'ACTIVE' as const,
            createdAt: (r.created_at as string) ?? '',
            updatedAt: (r.updated_at as string) ?? '',
          };
        }),
      );
      const rawAttendants = Array.isArray(attendantsRes.data) ? attendantsRes.data : [];
      setAttendants(
        rawAttendants.map((a) => {
          const r = a as Record<string, unknown>;
          return {
            id: r.id as string,
            name: (r.name as string) ?? '',
            email: '',
            role: 'ATTENDANT' as const,
            isActive: true,
            createdAt: (r.created_at as string) ?? '',
            updatedAt: (r.updated_at as string) ?? '',
          };
        }),
      );
    } catch {
      setPumps([]);
      setAttendants([]);
    }
  }, [currentStation]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  const handleFlag = async (values: { reason: string }) => {
    if (!selectedTx) return;
    try {
      await api.patch(`/transactions/${selectedTx.id}/flag`, {
        reason: values.reason,
      });
      message.success('Transaction flagged');
      setFlagModalVisible(false);
      flagForm.resetFields();
      fetchTransactions();
    } catch {
      message.error('Failed to flag transaction');
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 20);
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      render: (date: string) => dayjs(date).format('MMM D, HH:mm'),
    },
    {
      title: 'Vehicle Plate',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      width: 130,
      render: (plate: string) => plate || '—',
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'PETROL' ? 'orange' : 'blue'} className="!font-medium">
          {type}
        </Tag>
      ),
    },
    {
      title: 'Liters',
      dataIndex: 'liters',
      key: 'liters',
      width: 100,
      sorter: true,
      render: (l: number) => `${l.toFixed(1)} L`,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      sorter: true,
      render: (amt: number) => <Text strong>{formatRWF(amt)}</Text>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 110,
      render: (method: string) => (
        <Space>
          {paymentIcons[method]}
          <span>{method}</span>
        </Space>
      ),
    },
    {
      title: 'Pump',
      key: 'pump',
      width: 80,
      render: (_: unknown, record: Transaction) => `#${record.pump?.pumpNumber || '—'}`,
    },
    {
      title: 'Attendant',
      key: 'attendant',
      width: 140,
      render: (_: unknown, record: Transaction) => record.attendant?.name || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: Transaction) => (
        <Tooltip title={record.isFlagged ? 'Flagged' : 'Flag transaction'}>
          <Button
            type="text"
            icon={<FlagOutlined />}
            danger={record.isFlagged}
            onClick={() => {
              setSelectedTx(record);
              setFlagModalVisible(true);
            }}
            className={record.isFlagged ? '!text-red-500' : ''}
          />
        </Tooltip>
      ),
    },
  ];

  const exportColumns = [
    { header: 'Time', key: 'createdAt' },
    { header: 'Vehicle Plate', key: 'vehiclePlate' },
    { header: 'Fuel Type', key: 'fuelType' },
    { header: 'Liters', key: 'liters' },
    { header: 'Amount (RWF)', key: 'totalAmount' },
    { header: 'Payment', key: 'paymentMethod' },
    { header: 'Pump', key: 'pumpNumber' },
    { header: 'Attendant', key: 'attendantName' },
  ];

  const exportData = transactions.map((t) => ({
    ...t,
    createdAt: dayjs(t.createdAt).format('YYYY-MM-DD HH:mm'),
    pumpNumber: t.pump?.pumpNumber || '',
    attendantName: t.attendant?.name || '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Transactions</Title>
          <Text type="secondary">View and manage all fuel transactions</Text>
        </div>
        <ExportButton data={exportData} columns={exportColumns} filename="transactions" />
      </div>

      <Card className="!rounded-xl">
        <div className="flex flex-wrap gap-3 mb-4">
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) =>
              setFilters((f) => ({ ...f, dateRange: dates as [Dayjs, Dayjs] | null }))
            }
            className="!rounded-lg"
          />
          <Select
            value={filters.pumpId}
            onChange={(v) => setFilters((f) => ({ ...f, pumpId: v }))}
            placeholder="All Pumps"
            allowClear
            className="w-40"
            options={pumps.map((p) => ({ value: p.id, label: `Pump #${p.pumpNumber}` }))}
          />
          <Select
            value={filters.attendantId}
            onChange={(v) => setFilters((f) => ({ ...f, attendantId: v }))}
            placeholder="All Attendants"
            allowClear
            className="w-44"
            options={attendants.map((a) => ({ value: a.id, label: a.name }))}
          />
          <Select
            value={filters.fuelType}
            onChange={(v) => setFilters((f) => ({ ...f, fuelType: v }))}
            placeholder="Fuel Type"
            allowClear
            className="w-36"
            options={[
              { value: 'PETROL', label: 'Petrol' },
              { value: 'DIESEL', label: 'Diesel' },
            ]}
          />
          <Select
            value={filters.paymentMethod}
            onChange={(v) => setFilters((f) => ({ ...f, paymentMethod: v }))}
            placeholder="Payment"
            allowClear
            className="w-36"
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'CARD', label: 'Card' },
              { value: 'MOMO', label: 'MoMo' },
              { value: 'CREDIT', label: 'Credit' },
            ]}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search plate or phone..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-56 !rounded-lg"
            allowClear
          />
          <Button
            icon={<FilterOutlined />}
            onClick={() =>
              setFilters({
                dateRange: null,
                pumpId: undefined,
                attendantId: undefined,
                fuelType: undefined,
                paymentMethod: undefined,
                search: '',
              })
            }
          >
            Clear
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} transactions`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          size="middle"
          rowClassName={(record) => (record.isFlagged ? 'bg-red-50' : '')}
        />
      </Card>

      <Modal
        title="Flag Transaction"
        open={flagModalVisible}
        onCancel={() => setFlagModalVisible(false)}
        onOk={() => flagForm.submit()}
        okText="Flag"
        okButtonProps={{ danger: true }}
      >
        <Form form={flagForm} onFinish={handleFlag} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason for flagging"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={3} placeholder="Describe why this transaction is suspicious..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
