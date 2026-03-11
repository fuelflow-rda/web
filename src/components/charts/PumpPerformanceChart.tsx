'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Empty } from 'antd';
import type { PumpReport } from '@/types';

interface PumpPerformanceChartProps {
  data: PumpReport[];
}

export default function PumpPerformanceChart({ data }: PumpPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Empty description="No performance data" />
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    'Liters Dispensed': d.litersDispensed,
    'Expected Revenue': d.expectedRevenue,
    'Recorded Revenue': d.recordedRevenue,
    Discrepancy: Math.abs(d.discrepancy),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v.toString();
          }}
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
            if (name.includes('Revenue') || name === 'Discrepancy')
              return [`RWF ${value.toLocaleString()}`, name];
            return [`${value.toLocaleString()} L`, name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="liters"
          dataKey="Liters Dispensed"
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
          barSize={30}
          opacity={0.7}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Expected Revenue"
          stroke="#F97316"
          strokeWidth={2.5}
          dot={{ fill: '#F97316', r: 3 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Recorded Revenue"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: '#10B981', r: 3 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Discrepancy"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={{ fill: '#EF4444', r: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
