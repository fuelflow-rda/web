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
import { LEGACY_GASOLINE_FUEL_TYPE } from '@/lib/legacy-gasoline-fuel-type';
import {
  PRODUCT_TYPES,
  formatUnitPrice,
  isEvProductType,
  normalizeProductType,
  productColor,
  productLabel,
  unitForProduct,
  unitLabel,
} from '@/lib/product-types';
import { useStationStore } from '@/store/station-store';
import RevenueChart from '@/components/charts/RevenueChart';
import type { FuelPrice, ProductType } from '@/types';

const { Title, Text } = Typography;

export default function FuelPricesPage() {
  const { currentStation } = useStationStore();
  const [currentPrices, setCurrentPrices] = useState<Record<ProductType, number>>(
    () => Object.fromEntries(PRODUCT_TYPES.map((p) => [p, 0])) as Record<ProductType, number>,
  );
  const [history, setHistory] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trendProduct, setTrendProduct] = useState<ProductType>('GASOLINE');
  const [form] = Form.useForm();

  const emptyPrices = useCallback(
    () => Object.fromEntries(PRODUCT_TYPES.map((p) => [p, 0])) as Record<ProductType, number>,
    [],
  );

  const fetchPrices = useCallback(async () => {
    if (!currentStation) return;
    setLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        api.get(`/fuel-prices/${currentStation.id}/current`),
        api.get(`/fuel-prices/${currentStation.id}/history`),
      ]);
      const payload = currentRes.data;
      const pricesObj = (payload?.prices ?? {}) as Record<string, unknown>;

      const next = emptyPrices();
      for (const product of PRODUCT_TYPES) {
        const row = (pricesObj[product] ??
          pricesObj[product.toLowerCase()] ??
          (product === 'GASOLINE'
            ? pricesObj[LEGACY_GASOLINE_FUEL_TYPE] ?? pricesObj[LEGACY_GASOLINE_FUEL_TYPE.toLowerCase()]
            : undefined)) as Record<string, unknown> | number | undefined;
        if (typeof row === 'number') {
          next[product] = row;
        } else if (row) {
          next[product] = Number(row.price_per_unit ?? row.price_per_liter ?? 0);
        }
      }
      setCurrentPrices(next);

      const historyPayload = historyRes.data as { data?: unknown[] };
      const rawHistory = historyPayload?.data ?? (Array.isArray(historyRes.data) ? historyRes.data : []);
      setHistory(
        rawHistory.map((h) => {
          const r = h as Record<string, unknown>;
          const userRef = r.users as { id: string; name: string } | undefined;
          const productType = normalizeProductType(
            (r.product_type as string | undefined) ?? (r.fuel_type as string | undefined),
          );
          return {
            id: r.id as string,
            stationId: r.station_id as string,
            productType,
            fuelType: productType,
            unit: unitForProduct(productType),
            price: Number(r.price_per_unit ?? r.price_per_liter) || 0,
            previousPrice: undefined,
            effectiveDate: (r.set_at as string) ?? (r.effectiveDate as string) ?? '',
            changedById: (r.set_by as string) ?? '',
            changedBy: userRef ? { id: userRef.id, name: userRef.name } : undefined,
            createdAt: (r.set_at as string) ?? '',
          };
        }),
      );
    } catch {
      setCurrentPrices(emptyPrices());
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [currentStation, emptyPrices]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleUpdatePrice = async (values: { productType: ProductType; price: number }) => {
    if (!currentStation) return;
    setSubmitting(true);
    try {
      await api.post('/fuel-prices', {
        station_id: currentStation.id,
        product_type: values.productType,
        price_per_unit: Math.round(Number(values.price)) || 0,
      });
      message.success(`${productLabel(values.productType)} price updated successfully`);
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
      title: 'Product',
      dataIndex: 'productType',
      key: 'productType',
      filters: PRODUCT_TYPES.map((p) => ({ text: productLabel(p), value: p })),
      onFilter: (value, record) => record.productType === value,
      render: (type: string) => (
        <span className="font-semibold" style={{ color: productColor(type) }}>
          {productLabel(type)}
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
      key: 'price',
      align: 'right',
      render: (_: unknown, record: FuelPrice) => (
        <Text strong>
          {formatRWF(record.price)}
          <Text type="secondary" className="!text-xs">
            {' '}
            /{unitLabel(record.unit)}
          </Text>
        </Text>
      ),
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
              <ArrowUpOutlined className="text-danger" />
            ) : (
              <ArrowDownOutlined className="text-accent" />
            )}
            <Text className={diff > 0 ? '!text-danger' : '!text-accent'}>
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
    .filter((h) => h.productType === trendProduct)
    .map((h) => ({
      hour: dayjs(h.effectiveDate).format('MMM D'),
      revenue: h.price,
      liters: 0,
      kwh: 0,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Prices</Title>
          <Text type="secondary">
            Fuel is priced per liter, EV charging per kWh — fast charging carries its own rate.
          </Text>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => setModalOpen(true)}>
          Update Price
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {PRODUCT_TYPES.map((product) => {
          const color = productColor(product);
          const isEv = isEvProductType(product);
          const price = currentPrices[product] ?? 0;
          return (
            <Col key={product} xs={24} sm={12} lg={8}>
              <Card
                className="!rounded-xl !border-2 h-full"
                style={{ borderColor: price > 0 ? color : 'var(--line)' }}
                bodyStyle={{ padding: '20px' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Text
                      className="text-xs uppercase tracking-wider font-semibold block"
                      style={{ color }}
                    >
                      {productLabel(product)}
                    </Text>
                    {price > 0 ? (
                      <Statistic
                        value={price}
                        prefix="RWF"
                        valueStyle={{ color, fontSize: 30, fontWeight: 800 }}
                      />
                    ) : (
                      <Text type="secondary" className="block !text-2xl !font-bold !mt-2">
                        Not set
                      </Text>
                    )}
                    <Text type="secondary">per {unitLabel(unitForProduct(product))}</Text>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl"
                    style={{ background: `${color}1A` }}
                    aria-hidden
                  >
                    {isEv ? '⚡' : '⛽'}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card
        title="Price Trend"
        className="!rounded-xl"
        extra={
          <Space>
            <Select
              value={trendProduct}
              onChange={setTrendProduct}
              className="w-48"
              options={PRODUCT_TYPES.map((p) => ({ value: p, label: productLabel(p) }))}
            />
            <HistoryOutlined />
          </Space>
        }
      >
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
        title="Update Price"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={handleUpdatePrice}
          layout="vertical"
          initialValues={{ productType: 'GASOLINE' }}
        >
          <Form.Item
            name="productType"
            label="Product"
            rules={[{ required: true, message: 'Select a product' }]}
          >
            <Select
              options={[
                {
                  label: 'Fuel',
                  options: PRODUCT_TYPES.filter((p) => !isEvProductType(p)).map((p) => ({
                    value: p,
                    label: productLabel(p),
                  })),
                },
                {
                  label: 'EV Charging',
                  options: PRODUCT_TYPES.filter(isEvProductType).map((p) => ({
                    value: p,
                    label: productLabel(p),
                  })),
                },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.productType !== next.productType}>
            {({ getFieldValue }) => {
              const product = (getFieldValue('productType') ?? 'GASOLINE') as ProductType;
              const unit = unitLabel(unitForProduct(product));
              return (
                <Form.Item
                  name="price"
                  label={`New Price (RWF per ${unit})`}
                  extra={
                    currentPrices[product] > 0
                      ? `Current: ${formatUnitPrice(currentPrices[product], unitForProduct(product))}`
                      : `No ${productLabel(product)} price set for this station yet.`
                  }
                  rules={[
                    { required: true, message: 'Enter the new price' },
                    { type: 'number', min: 1, message: 'Price must be greater than 0' },
                  ]}
                >
                  <InputNumber
                    className="!w-full"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/,/g, ''))}
                    placeholder={isEvProductType(product) ? 'e.g. 420' : 'e.g. 1,350'}
                  />
                </Form.Item>
              );
            }}
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
