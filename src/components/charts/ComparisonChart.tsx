'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Empty } from 'antd';

interface ComparisonChartProps {
  data: Record<string, unknown>[];
  labels: string[];
}

const COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

export default function ComparisonChart({ data, labels }: ComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Empty description="No data to compare" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v.toString();
          }}
        />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
        />
        <Legend />
        {labels.map((label, idx) => (
          <Bar
            key={label}
            dataKey={label}
            fill={COLORS[idx % COLORS.length]}
            radius={[4, 4, 0, 0]}
            barSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
