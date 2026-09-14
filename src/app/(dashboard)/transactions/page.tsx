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
  Popconfirm,
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
import {
  PRODUCT_TYPES,
  formatQuantity,
  normalizeProductType,
  productLabel,
  productTagColor,
  unitForProduct,
  unitLabel,
} from '@/lib/product-types';
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
    productType: string | undefined;
    paymentMethod: string | undefined;
    flagStatus: 'all' | 'flagged' | 'unflagged';
    search: string;
  }>({
    dateRange: null,
    pumpId: undefined,
    attendantId: undefined,
    productType: undefined,
    paymentMethod: undefined,
    flagStatus: 'all',
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
      if (filters.productType) params.product_type = filters.productType;
      if (filters.paymentMethod) params.payment_method = filters.paymentMethod;
      if (filters.flagStatus !== 'all') params.flag_status = filters.flagStatus;
      if (filters.search?.trim()) params.search = filters.search.trim();

      const res = await api.get('/transactions', { params });
      const payload = res.data as { data?: unknown[]; pagination?: { total: number } };
      const raw = Array.isArray(payload?.data) ? payload.data : [];
      setTransactions(
        raw.map((t) => {
          const r = t as Record<string, unknown>;
          const users = r.users as { id: string; name: string } | undefined;
          const pumpsRef = r.pumps as
            | {
                id: string;
                pump_number: number;
                product_type?: string;
                fuel_type?: string;
                connector_type?: string | null;
                power_kw?: number | null;
              }
            | undefined;
          const productType = normalizeProductType(
            (r.product_type as string | undefined) ?? (r.fuel_type as string | undefined),
          );
          const quantity = Number(r.quantity ?? r.liters) || 0;
          const unitPrice = Number(r.unit_price ?? r.price_per_liter) || 0;
          const pumpProduct = normalizeProductType(pumpsRef?.product_type ?? pumpsRef?.fuel_type);
          return {
            id: r.id as string,
            stationId: r.station_id as string,
            pumpId: r.pump_id as string,
            attendantId: r.attendant_id as string,
            productType,
            fuelType: productType,
            unit: unitForProduct(productType),
            quantity,
            unitPrice,
            liters: quantity,
            pricePerLiter: unitPrice,
            totalAmount: Number(r.total_amount) ?? 0,
            paymentMethod: (r.payment_method as Transaction['paymentMethod']) ?? 'CASH',
            isFlagged: Boolean(r.is_flagged),
            flagReason: (r.flag_reason as string | null)?.trim() || undefined,
            vehiclePlate: (r.vehicle_plate as string) ?? undefined,
            customerPhone: (r.customer_phone as string) ?? undefined,
            createdAt: (r.timestamp ?? r.created_at) as string,
            updatedAt: (r.updated_at ?? r.timestamp) as string,
            pump: pumpsRef
              ? {
                  id: pumpsRef.id,
                  pumpNumber: pumpsRef.pump_number,
                  productType: pumpProduct,
                  fuelType: pumpProduct,
                  connectorType: (pumpsRef.connector_type as Pump['connectorType']) ?? null,
                  powerKw: pumpsRef.power_kw == null ? null : Number(pumpsRef.power_kw),
                  stationId: '',
                  status: 'ACTIVE' as const,
                  createdAt: '',
                  updatedAt: '',
                }
              : undefined,
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
          const productType = normalizeProductType(
            (r.product_type as string | undefined) ?? (r.fuel_type as string | undefined),
          );
          return {
            id: r.id as string,
            stationId: r.station_id as string,
            pumpNumber: Number(r.pump_number) ?? 0,
            productType,
            fuelType: productType,
            connectorType: (r.connector_type as Pump['connectorType']) ?? null,
            powerKw: r.power_kw == null ? null : Number(r.power_kw),
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

  useEffect(() => {
    setPage(1);
  }, [
    filters.dateRange,
    filters.pumpId,
    filters.attendantId,
    filters.productType,
    filters.paymentMethod,
    filters.flagStatus,
  ]);

  const openFlagModal = (tx: Transaction) => {
    setSelectedTx(tx);
    flagForm.setFieldsValue({ reason: tx.flagReason ?? '' });
    setFlagModalVisible(true);
  };

  const closeFlagModal = () => {
    setFlagModalVisible(false);
    setSelectedTx(null);
    flagForm.resetFields();
  };

  const handleFlag = async (values: { reason: string }) => {
    if (!selectedTx) return;
    const reason = values.reason.trim();
    try {
      await api.patch(`/transactions/${selectedTx.id}/flag`, { reason });
      message.success(selectedTx.isFlagged ? 'Flag reason updated' : 'Transaction flagged');
      closeFlagModal();
      fetchTransactions();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to flag transaction');
    }
  };

  const handleUnflag = async () => {
    if (!selectedTx) return;
    try {
      await api.delete(`/transactions/${selectedTx.id}/flag`);
      message.success('Flag removed');
      closeFlagModal();
      fetchTransactions();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to remove flag');
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
      width: 200,
      sorter: true,
      render: (date: string, record: Transaction) => (
        <div>
          <div>{dayjs(date).format('MMM D, HH:mm')}</div>
          {record.isFlagged && (
            <div className="mt-0.5 flex items-start gap-1 text-xs font-medium text-danger leading-snug">
              <FlagOutlined className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{record.flagReason ?? 'Flagged, no reason recorded'}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Vehicle Plate',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      width: 130,
      render: (plate: string) => plate || <Text type="secondary">No plate</Text>,
    },
    {
      title: 'Product',
      dataIndex: 'productType',
      key: 'productType',
      width: 140,
      render: (type: string) => (
        <Tag color={productTagColor(type)} className="!font-medium">
          {productLabel(type)}
        </Tag>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      sorter: true,
      align: 'right',
      render: (q: number, record: Transaction) => formatQuantity(q, record.unit, 1),
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
      render: (_: unknown, record: Transaction) => `#${record.pump?.pumpNumber ?? '?'}`,
    },
    {
      title: 'Attendant',
      key: 'attendant',
      width: 140,
      render: (_: unknown, record: Transaction) =>
        record.attendant?.name || <Text type="secondary">Unknown</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: Transaction) => (
        <Tooltip
          title={
            record.isFlagged
              ? `Flagged: ${record.flagReason ?? 'no reason recorded'}. Click to edit or remove.`
              : 'Flag this transaction'
          }
        >
          <Button
            type="text"
            icon={<FlagOutlined />}
            danger={record.isFlagged}
            aria-label={record.isFlagged ? 'Edit flag' : 'Flag transaction'}
            onClick={() => openFlagModal(record)}
            className={record.isFlagged ? '!text-danger' : ''}
          />
        </Tooltip>
      ),
    },
  ];

  const exportColumns = [
    { header: 'Time', key: 'createdAt' },
    { header: 'Vehicle Plate', key: 'vehiclePlate' },
    { header: 'Product', key: 'productType' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Unit', key: 'unitLabel' },
    { header: 'Amount (RWF)', key: 'totalAmount' },
    { header: 'Payment', key: 'paymentMethod' },
    { header: 'Pump', key: 'pumpNumber' },
    { header: 'Attendant', key: 'attendantName' },
    { header: 'Flagged', key: 'flaggedLabel' },
    { header: 'Flag reason', key: 'flagReason' },
  ];

  const exportData = transactions.map((t) => ({
    ...t,
    productType: productLabel(t.productType),
    unitLabel: unitLabel(t.unit),
    createdAt: dayjs(t.createdAt).format('YYYY-MM-DD HH:mm'),
    pumpNumber: t.pump?.pumpNumber || '',
    attendantName: t.attendant?.name || '',
    flaggedLabel: t.isFlagged ? 'Yes' : 'No',
    flagReason: t.flagReason ?? '',
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
            value={filters.productType}
            onChange={(v) => setFilters((f) => ({ ...f, productType: v }))}
            placeholder="Product"
            allowClear
            className="w-44"
            options={PRODUCT_TYPES.map((p) => ({ value: p, label: productLabel(p) }))}
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
          <Select
            value={filters.flagStatus}
            onChange={(v) => setFilters((f) => ({ ...f, flagStatus: v as 'all' | 'flagged' | 'unflagged' }))}
            className="w-44"
            options={[
              { value: 'all', label: 'All transactions' },
              { value: 'flagged', label: 'Flagged only' },
              { value: 'unflagged', label: 'Not flagged' },
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
                productType: undefined,
                paymentMethod: undefined,
                flagStatus: 'all',
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
          rowClassName={(record) => (record.isFlagged ? 'bg-danger-tint' : '')}
        />
      </Card>

      <Modal
        title={selectedTx?.isFlagged ? 'Edit flag' : 'Flag transaction'}
        open={flagModalVisible}
        onCancel={closeFlagModal}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={closeFlagModal}>
            Cancel
          </Button>,
          ...(selectedTx?.isFlagged
            ? [
                <Popconfirm
                  key="unflag"
                  title="Remove the flag from this transaction?"
                  description="The reason will be deleted with it."
                  onConfirm={handleUnflag}
                  okText="Remove flag"
                >
                  <Button danger>Remove flag</Button>
                </Popconfirm>,
              ]
            : []),
          <Button key="save" type="primary" danger={!selectedTx?.isFlagged} onClick={() => flagForm.submit()}>
            {selectedTx?.isFlagged ? 'Save reason' : 'Flag transaction'}
          </Button>,
        ]}
      >
        {selectedTx && (
          <Text type="secondary" className="block mb-4">
            {dayjs(selectedTx.createdAt).format('MMM D, HH:mm')}, pump #
            {selectedTx.pump?.pumpNumber ?? '?'}, {formatRWF(selectedTx.totalAmount)}
            {selectedTx.attendant?.name ? `, recorded by ${selectedTx.attendant.name}` : ''}.
          </Text>
        )}
        <Form form={flagForm} onFinish={handleFlag} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason"
            extra="Shown on the transaction and in exports, so write what the next person needs to check."
            rules={[
              { required: true, message: 'A reason is required to flag a transaction' },
              {
                validator: (_, value: string) =>
                  value && value.trim().length >= 5
                    ? Promise.resolve()
                    : Promise.reject(new Error('Give a reason of at least 5 characters')),
              },
              { max: 500, message: 'Keep the reason under 500 characters' },
            ]}
          >
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder="For example: volume does not match the pump meter reading"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
