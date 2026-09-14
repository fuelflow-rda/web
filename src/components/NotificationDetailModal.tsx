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
  ALERT: { icon: <ExclamationCircleOutlined />, color: 'var(--danger)', tagColor: 'red' },
  WARNING: { icon: <WarningOutlined />, color: 'var(--warn)', tagColor: 'orange' },
  INFO: { icon: <InfoCircleOutlined />, color: 'var(--ink-secondary)', tagColor: 'blue' },
  SUCCESS: { icon: <CheckCircleOutlined />, color: 'var(--accent)', tagColor: 'green' },
  /**
   * The API emits lower-case types of its own. Anything unlisted falls back to INFO,
   * which is right for the routine ones; a site that has recorded nothing for a full
   * day is not routine, so it is called out as a warning rather than a notice.
   */
  station_dormant: { icon: <WarningOutlined />, color: 'var(--warn)', tagColor: 'orange' },
  /** An attendant cut a shift short and gave a reason — worth a manager's attention. */
  shift_early_end: { icon: <WarningOutlined />, color: 'var(--warn)', tagColor: 'orange' },
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
          <span className="text-base font-semibold text-ink leading-snug pr-6">
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
        <Typography.Paragraph className="!mb-0 !text-ink-secondary whitespace-pre-wrap break-words">
          {notification.message}
        </Typography.Paragraph>
        <Typography.Text type="secondary" className="!text-xs">
          {created.format('MMM D, YYYY h:mm A')} ({created.fromNow()})
        </Typography.Text>
      </div>
    </Modal>
  );
}
