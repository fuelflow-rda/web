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
        <Empty description={<span className="text-slate-400">No data to compare</span>} />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v.toString();
          }}
        />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: 'none',
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
            padding: '12px 16px',
          }}
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          labelStyle={{ fontWeight: 700, marginBottom: 4 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
        {labels.map((label, idx) => (
          <Bar
            key={label}
            dataKey={label}
            fill={COLORS[idx % COLORS.length]}
            radius={[6, 6, 0, 0]}
            barSize={36}
            opacity={0.9}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
