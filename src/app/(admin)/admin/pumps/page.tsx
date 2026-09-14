'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import {
  CONNECTOR_TYPES,
  PRODUCT_TYPES,
  connectorLabel,
  isEvProductType,
  normalizeProductType,
  productLabel,
  productTagColor,
} from '@/lib/product-types';
import type { Pump, Station } from '@/types';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  MAINTENANCE: 'orange',
};

export default function AdminPumpsPage() {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPump, setEditingPump] = useState<Pump | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [stationFilter, setStationFilter] = useState<string | undefined>();

  const [pumpSearch, setPumpSearch] = useState('');
  const [pumpSortBy, setPumpSortBy] = useState('pump_number');
  const [pumpSortOrder, setPumpSortOrder] = useState<'asc' | 'desc'>('asc');

  const unwrapPumps = (raw: unknown[]): Pump[] =>
    raw.map((p) => {
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
        status: (String(r.status ?? 'active').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as Pump['status'],
        createdAt: (r.created_at as string) ?? '',
        updatedAt: (r.updated_at as string) ?? '',
      };
    });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const stationsRes = await api.get('/stations', { params: { limit: 500 } });
      const payload = stationsRes.data as { data?: unknown[] };
      const rawStations = payload?.data ?? (Array.isArray(stationsRes.data) ? stationsRes.data : []);
      setStations(
        rawStations.map((s: Record<string, unknown>) => {
          const comp = s.companies as { name?: string } | null | undefined;
          return {
            id: s.id as string,
            companyId: (s.company_id as string) ?? '',
            companyName: comp?.name,
            name: s.name as string,
            location: (s.location as string) ?? '',
            isActive: true,
            createdAt: (s.created_at as string) ?? '',
            updatedAt: (s.updated_at as string) ?? '',
          };
        }),
      );
      const pumpParams = {
        stationId: stationFilter,
        search: pumpSearch || undefined,
        sortBy: pumpSortBy,
        sortOrder: pumpSortOrder,
      };
      if (stationFilter) {
        const pumpsRes = await api.get('/pumps', { params: pumpParams });
        const out = pumpsRes.data as { data?: unknown[] };
        const rawPumps = out?.data ?? (Array.isArray(pumpsRes.data) ? pumpsRes.data : []);
        setPumps(unwrapPumps(rawPumps as Record<string, unknown>[]));
      } else {
        const allPumps: Pump[] = [];
        for (const st of rawStations as { id: string }[]) {
          const res = await api.get('/pumps', { params: { ...pumpParams, stationId: st.id, limit: 50 } });
          const out = res.data as { data?: unknown[] };
          const list = out?.data ?? (Array.isArray(res.data) ? res.data : []);
          allPumps.push(...unwrapPumps(list as Record<string, unknown>[]));
        }
        setPumps(allPumps);
      }
    } catch {
      message.error('Failed to load pumps or stations');
    } finally {
      setLoading(false);
    }
  }, [stationFilter, pumpSearch, pumpSortBy, pumpSortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingPump(null);
    form.resetFields();
    setModalOpen(true);
    if (stationFilter) {
      form.setFieldsValue({ stationId: stationFilter });
      api.get<{ nextNumber: number }>('/pumps/next-number', { params: { stationId: stationFilter } })
        .then((res) => form.setFieldsValue({ pumpNumber: res.data?.nextNumber ?? 1, productType: 'GASOLINE' }))
        .catch(() => {});
    }
  };

  const openEdit = (pump: Pump) => {
    setEditingPump(pump);
    form.setFieldsValue({
      stationId: pump.stationId,
      pumpNumber: pump.pumpNumber,
      productType: pump.productType,
      connectorType: pump.connectorType ?? undefined,
      powerKw: pump.powerKw ?? undefined,
      status: pump.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const productType = String(values.productType ?? 'GASOLINE');
      const isEv = isEvProductType(productType);
      // The API rejects connector/power on a fuel pump, and clears them when a charge
      // point is switched back to fuel, so only send them for EV products.
      const evFields = isEv
        ? { connector_type: values.connectorType, power_kw: Number(values.powerKw) }
        : {};

      if (editingPump) {
        await api.patch(`/pumps/${editingPump.id}`, {
          product_type: productType,
          ...evFields,
          status: values.status ? String(values.status).toLowerCase() : undefined,
        });
        message.success(isEv ? 'Charge point updated' : 'Pump updated');
      } else {
        await api.post('/pumps', {
          station_id: values.stationId,
          pump_number: Number(values.pumpNumber) ?? 1,
          product_type: productType,
          ...evFields,
        });
        message.success(isEv ? 'Charge point created' : 'Pump created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Operation failed';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/pumps/${id}`);
      message.success('Pump deleted');
      fetchData();
    } catch {
      message.error('Failed to delete pump');
    }
  };

  const stationMap = new Map(
    stations.map((s) => [s.id, s.companyName ? `${s.name} · ${s.companyName}` : s.name]),
  );

  const columns: ColumnsType<Pump> = [
    {
      title: 'Pump',
      key: 'pump',
      render: (_: unknown, record: Pump) => (
        <Space>
          <ToolOutlined className="text-accent" />
          <Text strong>Pump #{record.pumpNumber}</Text>
        </Space>
      ),
    },
    {
      title: 'Station',
      key: 'station',
      render: (_: unknown, record: Pump) => stationMap.get(record.stationId) || 'N/A',
    },
    {
      title: 'Product',
      dataIndex: 'productType',
      key: 'productType',
      render: (type: string, record: Pump) => (
        <Space direction="vertical" size={2}>
          <Tag color={productTagColor(type)} className="!font-medium">
            {productLabel(type)}
          </Tag>
          {isEvProductType(type) && (
            <Text type="secondary" className="!text-xs">
              {connectorLabel(record.connectorType)} · {record.powerKw ?? 0} kW
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Current Attendant',
      key: 'attendant',
      render: (_: unknown, record: Pump) => record.currentAttendant?.name || 'None',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Pump) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this pump?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">Pumps</Title>
          <Text type="secondary">Manage pumps across all stations</Text>
        </div>
        <Space wrap>
          <Select
            value={stationFilter}
            onChange={setStationFilter}
            placeholder="All Stations"
            allowClear
            className="w-52"
            options={stations.map((s) => ({
              value: s.id,
              label: s.companyName ? `${s.name} (${s.companyName})` : s.name,
            }))}
          />
          <Input.Search
            placeholder="Pump # or fuel type"
            allowClear
            value={pumpSearch}
            onChange={(e) => setPumpSearch(e.target.value)}
            onSearch={() => fetchData()}
            className="w-44"
          />
          <Select
            value={pumpSortBy}
            onChange={(v) => { setPumpSortBy(v); fetchData(); }}
            options={[
              { value: 'pump_number', label: 'Pump #' },
              { value: 'product_type', label: 'Product' },
              { value: 'created_at', label: 'Date' },
            ]}
            className="w-28"
          />
          <Select
            value={pumpSortOrder}
            onChange={(v) => { setPumpSortOrder(v as 'asc' | 'desc'); fetchData(); }}
            options={[
              { value: 'asc', label: 'Asc' },
              { value: 'desc', label: 'Desc' },
            ]}
            className="w-24"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Pump
          </Button>
        </Space>
      </div>

      <Card className="!rounded-xl">
        <Table
          columns={columns}
          dataSource={pumps}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} pumps` }}
          size="middle"
        />
      </Card>

      <Modal
        title={editingPump ? 'Edit Pump' : 'Add Pump'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="stationId" label="Station" rules={[{ required: true }]}>
            <Select
              placeholder="Select station"
              options={stations.map((s) => ({
                value: s.id,
                label: s.companyName ? `${s.name} (${s.companyName})` : s.name,
              }))}
              disabled={!!editingPump}
              onChange={(stationId: string) => {
                if (!editingPump && stationId) {
                  api.get<{ nextNumber: number }>('/pumps/next-number', { params: { stationId } })
                    .then((res) => form.setFieldsValue({ pumpNumber: res.data?.nextNumber ?? 1 }))
                    .catch(() => {});
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="pumpNumber"
            label="Pump Number"
            rules={[{ required: true, type: 'number', min: 1 }]}
          >
            <InputNumber className="!w-full" min={1} placeholder="Next available (auto-filled when station selected)" />
          </Form.Item>
          <Form.Item name="productType" label="Product" rules={[{ required: true }]}>
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

          {/* A charge point is identified by its connector and rated power. */}
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.productType !== next.productType}>
            {({ getFieldValue }) =>
              isEvProductType(getFieldValue('productType')) ? (
                <>
                  <Form.Item
                    name="connectorType"
                    label="Connector"
                    rules={[{ required: true, message: 'Select the connector this charge point uses' }]}
                  >
                    <Select
                      placeholder="e.g. CCS Combo"
                      options={CONNECTOR_TYPES.map((c) => ({ value: c, label: connectorLabel(c) }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="powerKw"
                    label="Rated Power (kW)"
                    rules={[{ required: true, type: 'number', min: 0.1, message: 'Enter the rated output in kW' }]}
                  >
                    <InputNumber className="!w-full" placeholder="e.g. 60" min={0.1} step={1} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          {editingPump && (
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                ]}
              />
            </Form.Item>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingPump ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
