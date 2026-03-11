'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  List,
  Typography,
  Tag,
  Button,
  Space,
  Select,
  Badge,
  Empty,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '@/lib/api';
import type { Notification } from '@/types';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const typeConfig: Record<string, { icon: React.ReactNode; color: string; tagColor: string }> = {
  ALERT: { icon: <ExclamationCircleOutlined />, color: '#EF4444', tagColor: 'red' },
  WARNING: { icon: <WarningOutlined />, color: '#F97316', tagColor: 'orange' },
  INFO: { icon: <InfoCircleOutlined />, color: '#3B82F6', tagColor: 'blue' },
  SUCCESS: { icon: <CheckCircleOutlined />, color: '#10B981', tagColor: 'green' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/notifications', { params });
      setNotifications(res.data);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      message.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success('All notifications marked as read');
    } catch {
      message.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-0">
            <Space>
              <BellOutlined />
              Notifications
              {unreadCount > 0 && (
                <Badge count={unreadCount} className="ml-2" />
              )}
            </Space>
          </Title>
          <Text type="secondary">Stay updated with station alerts and events</Text>
        </div>
        <Space>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            allowClear
            className="w-36"
            options={[
              { value: 'ALERT', label: 'Alerts' },
              { value: 'WARNING', label: 'Warnings' },
              { value: 'INFO', label: 'Info' },
              { value: 'SUCCESS', label: 'Success' },
            ]}
          />
          {unreadCount > 0 && (
            <Button icon={<CheckOutlined />} onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </Space>
      </div>

      <Card className="!rounded-xl" bodyStyle={{ padding: 0 }}>
        <List
          loading={loading}
          dataSource={filteredNotifications}
          locale={{ emptyText: <Empty description="No notifications" className="py-12" /> }}
          renderItem={(notification) => {
            const config = typeConfig[notification.type] || typeConfig.INFO;
            return (
              <List.Item
                className={`!px-6 !py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-orange-50/50' : ''
                }`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                actions={[
                  !notification.isRead && (
                    <Button
                      key="read"
                      type="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      Mark read
                    </Button>
                  ),
                ].filter(Boolean) as React.ReactNode[]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: `${config.color}15`, color: config.color }}
                    >
                      {config.icon}
                    </div>
                  }
                  title={
                    <Space>
                      {!notification.isRead && <Badge status="processing" />}
                      <Text strong={!notification.isRead}>{notification.title}</Text>
                      <Tag color={config.tagColor} className="!text-xs">
                        {notification.type}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">{notification.message}</Text>
                      <br />
                      <Text type="secondary" className="!text-xs">
                        {dayjs(notification.createdAt).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
