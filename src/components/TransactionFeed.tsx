'use client';

import React from 'react';
import { Tag, Typography, Empty } from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  MobileOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatRWF } from '@/lib/format';
import type { Transaction } from '@/types';

const { Text } = Typography;

interface TransactionFeedProps {
  transactions: Transaction[];
}

const paymentIcons: Record<string, React.ReactNode> = {
  CASH: <DollarOutlined className="text-green-500" />,
  CARD: <CreditCardOutlined className="text-blue-500" />,
  MOMO: <MobileOutlined className="text-yellow-500" />,
  CREDIT: <WalletOutlined className="text-purple-500" />,
};

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-12">
        <Empty description="No recent transactions" />
      </div>
    );
  }

  return (
    <div className="transaction-feed">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              {paymentIcons[tx.paymentMethod] || paymentIcons.CASH}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Tag
                  color={tx.fuelType === 'PETROL' ? 'orange' : 'blue'}
                  className="!text-xs !px-1.5 !py-0 !m-0"
                >
                  {tx.fuelType}
                </Tag>
                <Text className="!text-xs text-gray-500">
                  {tx.liters.toFixed(1)} L
                </Text>
              </div>
              <Text type="secondary" className="!text-xs block truncate">
                {tx.vehiclePlate || 'No plate'} • {tx.paymentMethod}
              </Text>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <Text strong className="!text-sm block">{formatRWF(tx.totalAmount)}</Text>
            <Text type="secondary" className="!text-xs">
              {dayjs(tx.createdAt).format('HH:mm')}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}
