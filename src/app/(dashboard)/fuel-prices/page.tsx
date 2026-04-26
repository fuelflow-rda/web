'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Typography,
  Row,
  Col,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Space,
  Statistic,
} from 'antd';
import {
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { formatRWF } from '@/lib/format';
import { fuelTypeLabel, isGasolineFuelType, normalizeTransactionFuelType } from '@/lib/fuel-type-labels';
import { LEGACY_GASOLINE_FUEL_TYPE } from '@/lib/legacy-gasoline-fuel-type';
import { useStationStore } from '@/store/station-store';
import RevenueChart from '@/components/charts/RevenueChart';
import type { FuelPrice } from '@/types';

const { Title, Text } = Typography;

export default function FuelPricesPage() {
  const { currentStation } = useStationStore();
  const [currentPrices, setCurrentPrices] = useState<{ gasoline: number; diesel: number }>({
    gasoline: 0,
    diesel: 0,
  });
  const [history, setHistory] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchPrices = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        api.get(`/fuel-prices/${currentStation.id}/current`),
        api.get(`/fuel-prices/${currentStation.id}/history`),
      ]);
      const payload = currentRes.data;
      const pricesObj = payload?.prices ?? {};
      const gasolineRow =
        pricesObj.GASOLINE ??
        pricesObj.gasoline ??
        pricesObj[LEGACY_GASOLINE_FUEL_TYPE] ??
        pricesObj[LEGACY_GASOLINE_FUEL_TYPE.toLowerCase()];
      const dieselRow = pricesObj.DIESEL ?? pricesObj.diesel;
      setCurrentPrices({
        gasoline: gasolineRow?.price_per_liter ?? gasolineRow ?? 0,
        diesel: dieselRow?.price_per_liter ?? dieselRow ?? 0,
      });
      const historyPayload = historyRes.data as { data?: unknown[] };
      const rawHistory = historyPayload?.data ?? (Array.isArray(historyRes.data) ? historyRes.data : []);
      setHistory(
        rawHistory.map((h) => {
          const r = h as Record<string, unknown>;
          const userRef = r.users as { id: string; name: string } | undefined;
          return {
            id: r.id as string,
            stationId: r.station_id as string,
            fuelType: normalizeTransactionFuelType(r.fuel_type as string | undefined),
            price: Number(r.price_per_liter) ?? 0,
            previousPrice: undefined,
            effectiveDate: (r.set_at as string) ?? (r.effectiveDate as string) ?? '',
            changedById: (r.set_by as string) ?? '',
            changedBy: userRef ? { id: userRef.id, name: userRef.name } : undefined,
            createdAt: (r.set_at as string) ?? '',
          };
        }),
      );
    } catch {
      setCurrentPrices({ gasoline: 0, diesel: 0 });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [currentStation]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleUpdatePrice = async (values: { fuelType: string; price: number }) => {
    if (!currentStation) return;
    setSubmitting(true);
    try {
      await api.post('/fuel-prices', {
        station_id: currentStation.id,
        fuel_type: values.fuelType,
        price_per_liter: Math.round(Number(values.price)) || 0,
      });
      message.success('Fuel price updated successfully');
      setModalOpen(false);
      form.resetFields();
      fetchPrices();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to update price';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const historyColumns: ColumnsType<FuelPrice> = [
    {
      title: 'Date',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      sorter: (a, b) => a.effectiveDate.localeCompare(b.effectiveDate),
      render: (date: string) => dayjs(date).format('MMM D, YYYY HH:mm'),
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type: string) => (
        <span
          className="font-semibold"
          style={{
            color: isGasolineFuelType(type) ? '#F97316' : '#3B82F6',
          }}
        >
          {fuelTypeLabel(type)}
        </span>
      ),
    },
    {
      title: 'Old Price',
      dataIndex: 'previousPrice',
      key: 'previousPrice',
      align: 'right',
      render: (v: number | undefined) => (v ? formatRWF(v) : 'N/A'),
    },
    {
      title: 'New Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (v: number) => <Text strong>{formatRWF(v)}</Text>,
    },
    {
      title: 'Change',
      key: 'change',
      align: 'right',
      render: (_: unknown, record: FuelPrice) => {
        if (!record.previousPrice) return 'N/A';
        const diff = record.price - record.previousPrice;
        const pct = ((diff / record.previousPrice) * 100).toFixed(1);
        return (
          <Space>
            {diff > 0 ? (
              <ArrowUpOutlined className="text-red-500" />
            ) : (
              <ArrowDownOutlined className="text-green-500" />
            )}
            <Text className={diff > 0 ? '!text-red-500' : '!text-green-500'}>
              {formatRWF(Math.abs(diff))} ({pct}%)
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Changed By',
      key: 'changedBy',
      render: (_: unknown, record: FuelPrice) => record.changedBy?.name || 'N/A',
    },
  ];

  const priceChartData = history
    .filter((h) => isGasolineFuelType(h.fuelType))
    .map((h) => ({
      hour: dayjs(h.effectiveDate).format('MMM D'),
      revenue: h.price,
      liters: 0,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Fuel Prices</Title>
          <Text type="secondary">Manage and track fuel price changes</Text>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => setModalOpen(true)}>
          Update Price
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card
            className="!rounded-xl !border-2"
            style={{ borderColor: '#F97316' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm uppercase tracking-wider font-semibold" style={{ color: '#F97316' }}>
                  Gasoline
                </Text>
                <Statistic
                  value={currentPrices.gasoline}
                  prefix="RWF"
                  valueStyle={{ color: '#F97316', fontSize: 36, fontWeight: 800 }}
                />
                <Text type="secondary">per liter</Text>
              </div>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#FFF7ED' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#F97316">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            className="!rounded-xl !border-2"
            style={{ borderColor: '#3B82F6' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm uppercase tracking-wider font-semibold" style={{ color: '#3B82F6' }}>
                  Diesel
                </Text>
                <Statistic
                  value={currentPrices.diesel}
                  prefix="RWF"
                  valueStyle={{ color: '#3B82F6', fontSize: 36, fontWeight: 800 }}
                />
                <Text type="secondary">per liter</Text>
              </div>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#EFF6FF' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Price Trend" className="!rounded-xl" extra={<HistoryOutlined />}>
        <RevenueChart data={priceChartData} />
      </Card>

      <Card title="Price History" className="!rounded-xl">
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
        />
      </Card>

      <Modal
        title="Update Fuel Price"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleUpdatePrice} layout="vertical">
          <Form.Item
            name="fuelType"
            label="Fuel Type"
            rules={[{ required: true, message: 'Select fuel type' }]}
          >
            <Select
              options={[
                { value: 'GASOLINE', label: 'Gasoline' },
                { value: 'DIESEL', label: 'Diesel' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="price"
            label="New Price (RWF per liter)"
            rules={[
              { required: true, message: 'Enter the new price' },
              { type: 'number', min: 1, message: 'Price must be greater than 0' },
            ]}
          >
            <InputNumber
              className="!w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/,/g, ''))}
              placeholder="e.g. 1,350"
            />
          </Form.Item>
          <Form.Item className="!mb-0 text-right">
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Update Price
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
