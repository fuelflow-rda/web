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
import { useDesignTokens } from '@/lib/design-tokens';
import { unitLabel } from '@/lib/product-types';
import type { PumpReport } from '@/types';

interface PumpPerformanceChartProps {
  data: PumpReport[];
}

export default function PumpPerformanceChart({ data }: PumpPerformanceChartProps) {
  // Resolved values: Recharts writes SVG attributes, which cannot read var().
  const t = useDesignTokens();

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Empty description={<span className="text-ink-muted">No performance data</span>} />
      </div>
    );
  }

  // Every row here belongs to one selected pump, so the whole series shares a unit.
  const unit = unitLabel(data[0]?.unit);
  const quantityKey = `Dispensed (${unit})`;

  const chartData = data.map((d) => ({
    date: d.date,
    [quantityKey]: d.quantityDispensed,
    'Expected Revenue': d.expectedRevenue,
    'Recorded Revenue': d.recordedRevenue,
    Discrepancy: Math.abs(d.discrepancy),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="litersBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t['chart-2']} stopOpacity={0.9} />
            <stop offset="100%" stopColor={t['chart-2']} stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={t['line-subtle']} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: t['ink-muted'], fontWeight: 500 }}
          axisLine={{ stroke: t.line }}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 11, fill: t['ink-muted'], fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v.toString();
          }}
        />
        <YAxis
          yAxisId="quantity"
          orientation="right"
          tick={{ fontSize: 11, fill: t['ink-muted'], fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}${unit}`}
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
            return [`${value.toLocaleString()} ${unit}`, name];
          }}
          labelStyle={{ fontWeight: 700, marginBottom: 4 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
        <Bar
          yAxisId="quantity"
          dataKey={quantityKey}
          fill="url(#litersBarGrad)"
          radius={[6, 6, 0, 0]}
          barSize={28}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Expected Revenue"
          stroke={t['chart-1']}
          strokeWidth={2.5}
          dot={{ fill: t['chart-1'], r: 3, strokeWidth: 0 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Recorded Revenue"
          stroke={t['chart-3']}
          strokeWidth={2}
          dot={{ fill: t['chart-3'], r: 3, strokeWidth: 0 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Discrepancy"
          stroke={t['chart-4']}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={{ fill: t['chart-4'], r: 2, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
