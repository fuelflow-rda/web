'use client';

import React from 'react';
import { Tag, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { Pump } from '@/types';

const { Text } = Typography;

interface PumpCardProps {
  pump: Pump;
}

const statusConfig: Record<string, { color: string; bg: string; dotColor: string; label: string }> = {
  ACTIVE: { color: '#10B981', bg: 'bg-emerald-50', dotColor: '#10B981', label: 'Active' },
  INACTIVE: { color: '#94A3B8', bg: 'bg-slate-50', dotColor: '#94A3B8', label: 'Inactive' },
  MAINTENANCE: { color: '#F97316', bg: 'bg-orange-50', dotColor: '#F97316', label: 'Maintenance' },
};

export default function PumpCard({ pump }: PumpCardProps) {
  const hasAttendantOnShift = Boolean(pump.currentAttendant?.name);
  const config = hasAttendantOnShift ? statusConfig.ACTIVE : statusConfig.INACTIVE;
  const isPetrol = pump.fuelType === 'PETROL';
  const isBoth = pump.fuelType === 'BOTH';
  const fuelLabel = isBoth ? 'Petrol & Diesel' : pump.fuelType;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
      {/* Subtle top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{
          background: isBoth
            ? 'linear-gradient(90deg, #F97316, #3B82F6)'
            : isPetrol
              ? 'linear-gradient(90deg, #F97316, #FB923C)'
              : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
        }}
      />

      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: isPetrol ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
          >
            {pump.pumpNumber}
          </div>
          <div>
            <Text strong className="!text-sm">Pump #{pump.pumpNumber}</Text>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.dotColor }}
              />
              <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
            </div>
          </div>
        </div>
        <Tag
          color={isPetrol ? 'orange' : isBoth ? 'green' : 'blue'}
          className="!font-semibold !text-xs !rounded-lg !border-0"
          style={{
            background: isBoth ? '#ECFDF5' : isPetrol ? '#FFF7ED' : '#EFF6FF',
            color: isBoth ? '#059669' : isPetrol ? '#EA580C' : '#2563EB',
          }}
        >
          {fuelLabel}
        </Tag>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
          <UserOutlined className="text-xs text-slate-400" />
        </div>
        <Text className="!text-xs !text-slate-500">
          {pump.currentAttendant?.name || 'No attendant assigned'}
        </Text>
      </div>
    </div>
  );
}
