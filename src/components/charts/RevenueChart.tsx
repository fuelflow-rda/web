'use client';

import React from 'react';
import {
  AreaChart,
  Area,
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
        <Empty description={<span className="text-slate-400">No data available</span>} />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="litersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatRWF}
        />
        <YAxis
          yAxisId="liters"
          orientation="right"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}L`}
        />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: 'none',
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
            padding: '12px 16px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Revenue') return [`RWF ${value.toLocaleString()}`, name];
            return [`${value.toLocaleString()} L`, name];
          }}
          labelStyle={{ fontWeight: 700, marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
        />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#F97316"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={{ fill: '#F97316', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          yAxisId="liters"
          type="monotone"
          dataKey="liters"
          name="Liters"
          stroke="#3B82F6"
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="url(#litersGrad)"
          dot={{ fill: '#3B82F6', r: 2, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
