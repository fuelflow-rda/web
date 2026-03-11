'use client';

import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import { UserOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { Pump } from '@/types';

const { Text } = Typography;

interface PumpCardProps {
  pump: Pump;
}

const statusConfig: Record<string, { color: string; dotColor: string; label: string }> = {
  ACTIVE: { color: 'green', dotColor: '#10B981', label: 'Active' },
  INACTIVE: { color: 'default', dotColor: '#9CA3AF', label: 'Inactive' },
  MAINTENANCE: { color: 'orange', dotColor: '#F97316', label: 'Maintenance' },
};

export default function PumpCard({ pump }: PumpCardProps) {
  const config = statusConfig[pump.status] || statusConfig.INACTIVE;

  return (
    <Card
      className="!rounded-xl hover:shadow-lg transition-shadow"
      bodyStyle={{ padding: 16 }}
    >
      <div className="flex items-center justify-between mb-3">
        <Space>
          <ThunderboltOutlined
            className="text-lg"
            style={{ color: pump.fuelType === 'PETROL' ? '#F97316' : '#3B82F6' }}
          />
          <Text strong>Pump #{pump.pumpNumber}</Text>
        </Space>
        <Tag
          color={pump.fuelType === 'PETROL' ? 'orange' : 'blue'}
          className="!font-medium"
        >
          {pump.fuelType}
        </Tag>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: config.dotColor }}
        />
        <Tag color={config.color}>{config.label}</Tag>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <UserOutlined className="text-gray-400" />
        <Text type="secondary">
          {pump.currentAttendant?.name || 'No attendant assigned'}
        </Text>
      </div>
    </Card>
  );
}
