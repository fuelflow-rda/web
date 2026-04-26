'use client';

import React from 'react';
import { Modal, Typography, Tag, Space, Button } from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Notification } from '@/types';

dayjs.extend(relativeTime);

export const notificationTypeVisuals: Record<
  string,
  { icon: React.ReactNode; color: string; tagColor: string }
> = {
  ALERT: { icon: <ExclamationCircleOutlined />, color: '#EF4444', tagColor: 'red' },
  WARNING: { icon: <WarningOutlined />, color: '#F97316', tagColor: 'orange' },
  INFO: { icon: <InfoCircleOutlined />, color: '#3B82F6', tagColor: 'blue' },
  SUCCESS: { icon: <CheckCircleOutlined />, color: '#10B981', tagColor: 'green' },
};

export interface NotificationDetailModalProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
}

export function NotificationDetailModal({
  open,
  notification,
  onClose,
}: NotificationDetailModalProps) {
  if (!open || !notification) {
    return null;
  }

  const cfg = notificationTypeVisuals[notification.type] || notificationTypeVisuals.INFO;
  const created = dayjs(notification.createdAt);

  return (
    <Modal
      title={
        <Space align="start" className="!items-start">
          <span
            className="inline-flex w-9 h-9 rounded-lg items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
          >
            {cfg.icon}
          </span>
          <span className="text-base font-semibold text-slate-800 leading-snug pr-6">
            {notification.title}
          </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose} className="!rounded-lg">
          Close
        </Button>
      }
      width={420}
      centered
      destroyOnClose
      classNames={{ body: '!pt-2' }}
    >
      <div className="space-y-3">
        <Space wrap>
          <Tag color={cfg.tagColor}>{notification.type}</Tag>
          {!notification.isRead && <Tag color="orange">Unread</Tag>}
        </Space>
        <Typography.Paragraph className="!mb-0 !text-slate-600 whitespace-pre-wrap break-words">
          {notification.message}
        </Typography.Paragraph>
        <Typography.Text type="secondary" className="!text-xs">
          {created.format('MMM D, YYYY h:mm A')} ({created.fromNow()})
        </Typography.Text>
      </div>
    </Modal>
  );
}
