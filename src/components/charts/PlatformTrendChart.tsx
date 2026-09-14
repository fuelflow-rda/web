'use client';

import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Empty } from 'antd';
import { useDesignTokens, categoricalSeries } from '@/lib/design-tokens';

export interface PlatformTrendPoint {
  day: string;
  revenue: number;
  transactions: number;
}

const compact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
};

/**
 * Platform revenue per day with transaction count alongside.
 *
 * Two axes rather than one: revenue is in RWF and runs to millions, transactions are a
 * count in the tens. On a shared axis the transaction line would be pinned flat to
 * zero and tell you nothing.
 */
export default function PlatformTrendChart({
  data,
  height = 300,
}: {
  data: PlatformTrendPoint[];
  height?: number;
}) {
  // Resolved values: Recharts writes SVG attributes, which cannot read var().
  const t = useDesignTokens();
  const [revenueColor, txColor] = categoricalSeries(t);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Empty description={<span className="text-ink-muted">No activity in this period</span>} />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="platformRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={revenueColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={revenueColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={t['line-subtle']} vertical={false} />
        <XAxis
          dataKey="day"
          stroke={t['ink-muted']}
          tick={{ fontSize: 12, fill: t['ink-muted'] }}
          tickLine={false}
          axisLine={{ stroke: t['line-subtle'] }}
          minTickGap={24}
        />
        <YAxis
          yAxisId="revenue"
          stroke={t['ink-muted']}
          tick={{ fontSize: 12, fill: t['ink-muted'] }}
          tickLine={false}
          axisLine={false}
          tickFormatter={compact}
        />
        <YAxis
          yAxisId="tx"
          orientation="right"
          stroke={t['ink-muted']}
          tick={{ fontSize: 12, fill: t['ink-muted'] }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: t['surface'],
            border: `1px solid ${t['line']}`,
            borderRadius: 12,
            color: t['ink'],
          }}
          formatter={(value: number, name: string) =>
            name === 'Revenue'
              ? [`RWF ${value.toLocaleString('en-US')}`, name]
              : [value.toLocaleString('en-US'), name]
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={revenueColor}
          strokeWidth={2}
          fill="url(#platformRevenueFill)"
        />
        <Line
          yAxisId="tx"
          type="monotone"
          dataKey="transactions"
          name="Transactions"
          stroke={txColor}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
