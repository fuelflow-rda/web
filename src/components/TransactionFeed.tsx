'use client';

import React from 'react';
import { Typography, Empty } from 'antd';
import dayjs from 'dayjs';
import { formatRWF } from '@/lib/format';
import { fuelTypeLabel, isGasolineFuelType } from '@/lib/fuel-type-labels';
import type { Transaction } from '@/types';

const { Text } = Typography;

interface TransactionFeedProps {
  transactions: Transaction[];
}

const paymentConfig: Record<string, { icon: string; color: string; bg: string }> = {
  CASH: { icon: '💵', color: '#16A34A', bg: '#F0FDF4' },
  CARD: { icon: '💳', color: '#2563EB', bg: '#EFF6FF' },
  MOMO: { icon: '📱', color: '#CA8A04', bg: '#FEFCE8' },
  CREDIT: { icon: '🏦', color: '#7C3AED', bg: '#F5F3FF' },
};

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-16">
        <Empty
          description={
            <span className="text-slate-400 text-sm">No transactions yet</span>
          }
        />
      </div>
    );
  }

  return (
    <div className="transaction-feed">
      {transactions.map((tx, index) => {
        const payment = paymentConfig[tx.paymentMethod] || paymentConfig.CASH;
        const isGasoline = isGasolineFuelType(tx.fuelType);
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50/80 hover:bg-slate-50/50 transition-colors cursor-default"
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
                    style={{
                      background: isGasoline ? '#FFF7ED' : '#EFF6FF',
                      color: isGasoline ? '#EA580C' : '#2563EB',
                    }}
                  >
                    {fuelTypeLabel(tx.fuelType)}
                  </span>
                  <Text className="!text-xs !text-slate-500 !font-medium">
                    {tx.liters.toFixed(1)} L
                  </Text>
                </div>
                <Text className="!text-[11px] !text-slate-400 block truncate mt-0.5">
                  {tx.vehiclePlate || 'No plate'} &middot; {tx.paymentMethod}
                </Text>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <Text strong className="!text-sm block !text-slate-700">{formatRWF(tx.totalAmount)}</Text>
              <Text className="!text-[11px] !text-slate-400">
                {dayjs(tx.createdAt).format('HH:mm')}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}
