'use client';

import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  /** Extra line under the main value (e.g. fuel-type breakdown). */
  detail?: React.ReactNode;
  /** When set, formats the main value with at most this many fraction digits. */
  maximumFractionDigits?: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const colorMap: Record<string, { gradient: string; bg: string; shadow: string }> = {
  '#F97316': {
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    shadow: 'shadow-orange-500/20',
  },
  '#3B82F6': {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    shadow: 'shadow-blue-500/20',
  },
  '#8B5CF6': {
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    shadow: 'shadow-violet-500/20',
  },
  '#10B981': {
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    shadow: 'shadow-emerald-500/20',
  },
};

export default function StatsCard({
  title,
  value,
  prefix,
  suffix,
  detail,
  maximumFractionDigits,
  icon,
  color,
  trend,
}: StatsCardProps) {
  const palette = colorMap[color] || colorMap['#F97316'];

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${palette.gradient} flex items-center justify-center text-white text-lg shadow-lg ${palette.shadow}`}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend >= 0
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-red-600 bg-red-50'
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpOutlined style={{ fontSize: 10 }} />
            ) : (
              <ArrowDownOutlined style={{ fontSize: 10 }} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{title}</p>
      <div className="flex items-baseline gap-1.5">
        {prefix && <span className="text-sm font-medium text-slate-400">{prefix}</span>}
        <span className="text-2xl font-extrabold text-slate-800 tabular-nums">
          {maximumFractionDigits !== undefined
            ? value.toLocaleString(undefined, {
                maximumFractionDigits: maximumFractionDigits,
                minimumFractionDigits: 0,
              })
            : value.toLocaleString()}
        </span>
        {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
      </div>
      {detail ? <div className="mt-2">{detail}</div> : null}
    </div>
  );
}
