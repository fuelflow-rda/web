'use client';

import React from 'react';
import { Tag, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { Pump } from '@/types';
import { connectorLabel, isEvProductType, productColor, productLabel, productTint } from '@/lib/product-types';

const { Text } = Typography;

interface PumpCardProps {
  pump: Pump;
}

const statusConfig: Record<string, { color: string; bg: string; dotColor: string; label: string }> = {
  ACTIVE: { color: 'var(--accent)', bg: 'bg-accent-tint', dotColor: 'var(--accent)', label: 'Active' },
  INACTIVE: { color: 'var(--ink-muted)', bg: 'bg-surface-muted', dotColor: 'var(--ink-disabled)', label: 'Inactive' },
  MAINTENANCE: { color: 'var(--warn)', bg: 'bg-warn-tint', dotColor: 'var(--warn)', label: 'Maintenance' },
};

export default function PumpCard({ pump }: PumpCardProps) {
  const hasAttendantOnShift = Boolean(pump.currentAttendant?.name);
  const config = hasAttendantOnShift ? statusConfig.ACTIVE : statusConfig.INACTIVE;
  const isEv = isEvProductType(pump.productType);
  const accent = productColor(pump.productType);
  const tint = productTint(pump.productType);
  const productName = productLabel(pump.productType);

  return (
    <div className="group bg-surface rounded-card border border-line-subtle p-4 hover:border-line transition-colors duration-200 relative overflow-hidden">
      {/* Product is identified by a flat rule — the system adds no depth. */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: accent }}
      />

      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-control flex items-center justify-center text-sm font-bold"
            style={{ background: tint, color: accent }}
          >
            {pump.pumpNumber}
          </div>
          <div>
            <Text strong className="!text-sm">
              {isEv ? 'Charger' : 'Pump'} #{pump.pumpNumber}
            </Text>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.dotColor }}
              />
              <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <Tag
            className="!font-semibold !text-xs !rounded-lg !border-0 !mr-0"
            style={{ background: tint, color: accent }}
          >
            {productName}
          </Tag>
          {isEv && (
            <div className="text-[10px] text-ink-muted mt-1">
              {connectorLabel(pump.connectorType)} · {pump.powerKw ?? 0} kW
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-line-subtle">
        <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center">
          <UserOutlined className="text-xs text-ink-muted" />
        </div>
        <Text className="!text-xs !text-ink-secondary">
          {pump.currentAttendant?.name || 'No attendant assigned'}
        </Text>
      </div>
    </div>
  );
}
