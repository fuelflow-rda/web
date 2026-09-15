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
import { useDesignTokens } from '@/lib/design-tokens';

interface RevenueChartProps {
  data: { hour: string; revenue: number; liters: number; kwh?: number }[];
  timeRange?: string;
  /** Called with the index of the clicked point in `data`. */
  onPointClick?: (index: number) => void;
}

const formatRWF = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

export default function RevenueChart({ data, onPointClick }: RevenueChartProps) {
  // Resolved values: Recharts writes SVG attributes, which cannot read var().
  const t = useDesignTokens();

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <Empty description={<span className="text-ink-muted">No data available</span>} />
      </div>
    );
  }

  // kWh gets its own series rather than joining the liters line — different unit.
  const hasKwh = data.some((d) => (d.kwh ?? 0) > 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        // The tooltip already snaps to the nearest point, so a click anywhere in the
        // plot means that point; nobody has to land on a 3px dot.
        onClick={
          onPointClick
            ? (state) => {
                if (typeof state?.activeTooltipIndex === 'number') onPointClick(state.activeTooltipIndex);
              }
            : undefined
        }
        style={onPointClick ? { cursor: 'pointer' } : undefined}
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t['chart-1']} stopOpacity={0.2} />
            <stop offset="100%" stopColor={t['chart-1']} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="litersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t['chart-2']} stopOpacity={0.15} />
            <stop offset="100%" stopColor={t['chart-2']} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t['chart-3']} stopOpacity={0.15} />
            <stop offset="100%" stopColor={t['chart-3']} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={t['line-subtle']} vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: t['ink-muted'], fontWeight: 500 }}
          axisLine={{ stroke: t.line }}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 11, fill: t['ink-muted'], fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatRWF}
        />
        <YAxis
          yAxisId="liters"
          orientation="right"
          tick={{ fontSize: 11, fill: t['ink-muted'], fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (hasKwh ? `${v}` : `${v}L`)}
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
            if (name === 'kWh') return [`${value.toLocaleString()} kWh`, name];
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
          stroke={t['chart-1']}
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={{ fill: t['chart-1'], r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          yAxisId="liters"
          type="monotone"
          dataKey="liters"
          name="Liters"
          stroke={t['chart-2']}
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="url(#litersGrad)"
          dot={{ fill: t['chart-2'], r: 2, strokeWidth: 0 }}
        />
        {hasKwh && (
          <Area
            yAxisId="liters"
            type="monotone"
            dataKey="kwh"
            name="kWh"
            stroke={t['chart-3']}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#kwhGrad)"
            dot={{ fill: t['chart-3'], r: 2, strokeWidth: 0 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
