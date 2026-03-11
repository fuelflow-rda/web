'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

export default function StatsCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  color,
  trend,
}: StatsCardProps) {
  return (
    <Card className="!rounded-xl hover:shadow-lg transition-shadow" bodyStyle={{ padding: 20 }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text type="secondary" className="text-sm">{title}</Text>
          <div className="mt-1 flex items-baseline gap-1">
            {prefix && <span className="text-sm font-medium text-gray-500">{prefix}</span>}
            <span className="text-2xl font-bold" style={{ color }}>
              {value.toLocaleString()}
            </span>
            {suffix && <span className="text-sm font-medium text-gray-500">{suffix}</span>}
          </div>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trend >= 0 ? (
                <ArrowUpOutlined className="text-xs text-green-500" />
              ) : (
                <ArrowDownOutlined className="text-xs text-red-500" />
              )}
              <Text className={`!text-xs ${trend >= 0 ? '!text-green-500' : '!text-red-500'}`}>
                {Math.abs(trend)}% vs yesterday
              </Text>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
