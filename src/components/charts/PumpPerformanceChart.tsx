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
        <Empty description={<span className="text-slate-400">No performance data</span>} />
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
        <defs>
          <linearGradient id="litersBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v.toString();
          }}
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
            if (name.includes('Revenue') || name === 'Discrepancy')
              return [`RWF ${value.toLocaleString()}`, name];
            return [`${value.toLocaleString()} L`, name];
          }}
          labelStyle={{ fontWeight: 700, marginBottom: 4 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
        <Bar
          yAxisId="liters"
          dataKey="Liters Dispensed"
          fill="url(#litersBarGrad)"
          radius={[6, 6, 0, 0]}
          barSize={28}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Expected Revenue"
          stroke="#F97316"
          strokeWidth={2.5}
          dot={{ fill: '#F97316', r: 3, strokeWidth: 0 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Recorded Revenue"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Discrepancy"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={{ fill: '#EF4444', r: 2, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
