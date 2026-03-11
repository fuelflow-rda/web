'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Empty } from 'antd';

interface RevenueChartProps {
  data: { hour: string; revenue: number; liters: number }[];
  timeRange?: string;
}

const formatRWF = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Empty description="No data available" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={formatRWF}
        />
        <YAxis
          yAxisId="liters"
          orientation="right"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(v) => `${v}L`}
        />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Revenue') return [`RWF ${value.toLocaleString()}`, name];
            return [`${value.toLocaleString()} L`, name];
          }}
        />
        <Legend />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#F97316"
          strokeWidth={2.5}
          dot={{ fill: '#F97316', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="liters"
          type="monotone"
          dataKey="liters"
          name="Liters"
          stroke="#3B82F6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: '#3B82F6', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
