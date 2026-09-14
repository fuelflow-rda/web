'use client';

import React from 'react';
import { Typography, Empty } from 'antd';
import dayjs from 'dayjs';
import { formatRWF } from '@/lib/format';
import { formatQuantity, productColor, productLabel, productTint } from '@/lib/product-types';
import type { Transaction } from '@/types';

const { Text } = Typography;

interface TransactionFeedProps {
  transactions: Transaction[];
}

const paymentConfig: Record<string, { icon: string; color: string; bg: string }> = {
  CASH: { icon: '💵', color: 'var(--accent)', bg: 'var(--accent-tint)' },
  CARD: { icon: '💳', color: 'var(--ink-secondary)', bg: 'var(--surface-muted)' },
  MOMO: { icon: '📱', color: 'var(--warn)', bg: 'var(--warn-tint)' },
  CREDIT: { icon: '🏦', color: 'var(--product-ev-ac)', bg: 'var(--accent-tint)' },
};

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-16">
        <Empty
          description={
            <span className="text-ink-muted text-sm">No transactions yet</span>
          }
        />
      </div>
    );
  }

  return (
    <div className="transaction-feed">
      {transactions.map((tx, index) => {
        const payment = paymentConfig[tx.paymentMethod] || paymentConfig.CASH;
        const accent = productColor(tx.productType);
        const tint = productTint(tx.productType);
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle hover:bg-surface-sunken transition-colors cursor-default"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: payment.bg }}
              >
                {payment.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: tint, color: accent }}
                  >
                    {productLabel(tx.productType)}
                  </span>
                  <Text className="!text-xs !text-ink-secondary !font-medium">
                    {formatQuantity(tx.quantity, tx.unit, 1)}
                  </Text>
                </div>
                <Text className="!text-[11px] !text-ink-muted block truncate mt-0.5">
                  {tx.vehiclePlate || 'No plate'} &middot; {tx.paymentMethod}
                </Text>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <Text strong className="!text-sm block !text-ink">{formatRWF(tx.totalAmount)}</Text>
              <Text className="!text-[11px] !text-ink-muted">
                {dayjs(tx.createdAt).format('HH:mm')}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}
