'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Select,
  Dropdown,
  Avatar,
  Badge,
  Typography,
  Spin,
  Button,
  Popover,
  List,
  Tag,
  Empty,
} from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  ToolOutlined,
  AuditOutlined,
  DollarOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';
import type { Notification } from '@/types';
import {
  NotificationDetailModal,
  notificationTypeVisuals,
} from '@/components/NotificationDetailModal';

dayjs.extend(relativeTime);

function roleLabel(role: string): string {
  const map: Record<string, string> = { ADMIN: 'Admin', MANAGER: 'Manager', ATTENDANT: 'Attendant' };
  return map[role] ?? role;
}

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Overview' },
      { key: '/transactions', icon: <UnorderedListOutlined />, label: 'Transactions' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { key: '/attendants', icon: <TeamOutlined />, label: 'Attendants' },
      { key: '/pumps', icon: <ToolOutlined />, label: 'Pumps' },
      { key: '/reconciliation', icon: <AuditOutlined />, label: 'Reconciliation' },
      { key: '/fuel-prices', icon: <DollarOutlined />, label: 'Fuel Prices' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
      { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize, logout, isAdmin } = useAuthStore();
  const { stations, currentStation, fetchStations, setCurrentStationById } = useStationStore();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifDetail, setNotifDetail] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = React.useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 10 } });
      const payload = res.data as { data?: Record<string, unknown>[] };
      const raw = payload?.data ?? (Array.isArray(res.data) ? res.data : []);
      setNotifications(
        raw.map((n) => {
          const r = n as Record<string, unknown>;
          return {
            id: r.id as string,
            userId: (r.user_id ?? r.userId) as string,
            stationId: (r.station_id ?? r.stationId) as string | undefined,
            type: (r.type as Notification['type']) ?? 'INFO',
            title: (r.title as string) ?? '',
            message: (r.message as string) ?? '',
            isRead: Boolean(r.is_read ?? r.isRead),
            createdAt: (r.created_at ?? r.createdAt) as string,
          };
        }),
      );
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setNotifDetail((d) => (d?.id === id ? { ...d, isRead: true } : d));
    } catch {
      // silent
    }
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/login');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (user) {
      fetchStations();
      fetchNotifications();
    }
  }, [user, fetchStations, fetchNotifications]);

  if (!initialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-4 shadow-glow-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
              <path d="M13 10h4a2 2 0 0 1 2 2v10" />
            </svg>
          </div>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const selectedKey = allNavItems.find((item) => pathname.startsWith(item.key))?.key || '/dashboard';
  const currentPageTitle = allNavItems.find((item) => item.key === selectedKey)?.label || 'Dashboard';

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    ...(isAdmin()
      ? [{ key: 'admin', icon: <SettingOutlined />, label: 'Admin Panel' }]
      : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
    } else if (key === 'admin') {
      router.push('/admin');
    }
  };

  const sidebarWidth = collapsed ? 80 : 272;

  return (
    <>
    <Layout className="min-h-screen">
      <Sider
        width={272}
        collapsedWidth={80}
        collapsed={collapsed}
        className="!bg-fuel-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-white/[0.06]">
            <div className="flex items-center justify-center w-9 h-9 gradient-orange rounded-xl flex-shrink-0 shadow-glow-orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M13 10h4a2 2 0 0 1 2 2v10" />
              </svg>
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Text className="!text-white !text-lg !font-extrabold tracking-tight">StationIQ</Text>
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-fuel-orange bg-fuel-orange/10 rounded-md">PRO</span>
              </div>
            )}
          </div>

          {/* Station Selector in Sidebar */}
          {!collapsed && (
            <div className="px-4 pt-4 pb-2">
              <span className="text-[10px] font-bold tracking-[0.1em] text-slate-500 uppercase block mb-2">
                Station
              </span>
              <div className="sidebar-station-select-wrapper">
                <Select
                  value={currentStation?.id ?? undefined}
                  onChange={setCurrentStationById}
                  placeholder="Select station"
                  className="sidebar-station-select w-full"
                  popupClassName="sidebar-station-select-dropdown"
                  options={stations.map((s) => ({ value: s.id, label: s.name }))}
                  suffixIcon={<DownOutlined className="!text-slate-400 !text-[10px]" />}
                  allowClear={false}
                  size="middle"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 py-2 sidebar-nav overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-1">
                {!collapsed && (
                  <div className="px-6 pt-4 pb-2">
                    <span className="text-[10px] font-bold tracking-[0.1em] text-slate-500 uppercase">
                      {group.label}
                    </span>
                  </div>
                )}
                <Menu
                  mode="inline"
                  selectedKeys={[selectedKey]}
                  items={group.items.map((item) => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                  }))}
                  onClick={({ key }) => router.push(key)}
                />
              </div>
            ))}
          </div>

          {/* User profile at bottom */}
          <div className="p-3">
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="topRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-white/[0.04] rounded-xl p-2.5 transition-all duration-200">
                <div className="relative flex-shrink-0">
                  <Avatar
                    size={36}
                    className="!bg-gradient-to-br !from-fuel-orange !to-fuel-orange-dark"
                    icon={<UserOutlined />}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-fuel-sidebar" />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <Text className="!text-white !text-sm !font-semibold block truncate">{user.name}</Text>
                    <Text className="!text-slate-500 !text-xs block truncate">{roleLabel(user.role)}</Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {/* Header */}
        <Header
          className="!px-6 flex items-center justify-between border-b border-gray-100/80 sticky top-0 z-50"
          style={{
            height: 64,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!text-slate-400 hover:!text-slate-600 !w-9 !h-9 !rounded-lg"
            />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-800 leading-tight">{currentPageTitle}</h1>
              <p className="text-xs text-slate-400 leading-tight">{currentStation?.name || 'Select a station'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover
              open={notifOpen}
              onOpenChange={(open) => {
                setNotifOpen(open);
                if (open) fetchNotifications();
              }}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              overlayStyle={{ width: 380 }}
              overlayInnerStyle={{ padding: 0 }}
              content={
                <div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-bold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <Tag color="orange" className="!mr-0">{unreadCount} new</Tag>
                    )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifLoading && notifications.length === 0 ? (
                      <div className="flex justify-center py-8">
                        <Spin size="small" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No notifications"
                        className="py-8"
                      />
                    ) : (
                      <List
                        dataSource={notifications}
                        renderItem={(n) => {
                          const cfg = notificationTypeVisuals[n.type] || notificationTypeVisuals.INFO;
                          return (
                            <List.Item
                              className={`!px-4 !py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-orange-50/40' : ''}`}
                              onClick={() => {
                                setNotifOpen(false);
                                setNotifDetail(n);
                                if (!n.isRead) void markAsRead(n.id);
                              }}
                              style={{ borderBottom: '1px solid #f1f5f9' }}
                            >
                              <div className="flex gap-3 w-full">
                                <div
                                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                                  style={{ backgroundColor: cfg.color + '14', color: cfg.color }}
                                >
                                  {cfg.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm leading-tight ${!n.isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                                      {n.title}
                                    </span>
                                    {!n.isRead && (
                                      <div className="w-2 h-2 rounded-full bg-fuel-orange flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5 truncate">{n.message}</p>
                                  <span className="text-[11px] text-slate-300 mt-1 block">
                                    {dayjs(n.createdAt).fromNow()}
                                  </span>
                                </div>
                              </div>
                            </List.Item>
                          );
                        }}
                      />
                    )}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                    <Button
                      type="link"
                      size="small"
                      onClick={() => { setNotifOpen(false); router.push('/notifications'); }}
                      className="!text-fuel-orange !font-semibold"
                    >
                      View All Notifications
                    </Button>
                  </div>
                </div>
              }
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined className="text-lg" />}
                  className="!text-slate-400 hover:!text-slate-600 !w-9 !h-9 !rounded-lg hover:!bg-slate-50"
                />
              </Badge>
            </Popover>
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
              <div className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors">
                <Avatar
                  size={32}
                  className="!bg-gradient-to-br !from-fuel-orange !to-fuel-orange-dark"
                  icon={<UserOutlined />}
                />
                <div className="hidden lg:block">
                  <span className="text-sm font-semibold text-slate-700 block leading-tight">{user.name}</span>
                  <span className="text-[11px] text-slate-400 block leading-tight">{roleLabel(user.role)}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-6 min-h-[calc(100vh-64px)]" style={{ background: '#F8FAFC' }}>
          <div className="page-content">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
    <NotificationDetailModal
      open={!!notifDetail}
      notification={notifDetail}
      onClose={() => setNotifDetail(null)}
    />
    </>
  );
}
