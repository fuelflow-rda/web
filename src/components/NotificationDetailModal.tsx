'use client';

import { Modal } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Notification } from '@/types';
import { Button, StatusChip } from '@/components/ui';
import { TONE_BADGE, kigaliWhen, kindOf } from '@/components/notifications/kinds';
import { cx } from '@/lib/cx';

dayjs.extend(relativeTime);

export interface NotificationDetailModalProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
}

/** One notification in full, opened from the top bar or the Notifications page. */
export function NotificationDetailModal({ open, notification, onClose }: NotificationDetailModalProps) {
  if (!open || !notification) return null;

  const kind = kindOf(notification.type);
  const Icon = kind.icon;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <span className="flex items-start gap-3 pr-6">
          <span
            aria-hidden
            className={cx('inline-flex size-9 shrink-0 items-center justify-center rounded-full', TONE_BADGE[kind.tone])}
          >
            <Icon size={18} />
          </span>
          <span className="pt-1.5 text-16 font-semibold text-text">{notification.title}</span>
        </span>
      }
      footer={
        <Button kind="primary" onClick={onClose}>
          Close
        </Button>
      }
      centered
      destroyOnHidden
    >
      <div className="flex flex-col gap-3">
        <StatusChip tone={kind.tone} icon={kind.icon} className="self-start">
          {kind.label}
        </StatusChip>
        <p className="m-0 text-14 whitespace-pre-wrap text-text-secondary wrap-break-word">{notification.message}</p>
        {notification.createdAt ? (
          <p className="m-0 text-12 text-text-muted">
            {kigaliWhen(notification.createdAt)}, Kigali time ({dayjs(notification.createdAt).fromNow()})
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
