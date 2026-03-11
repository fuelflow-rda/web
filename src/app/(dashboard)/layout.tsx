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
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Overview' },
  { key: '/transactions', icon: <UnorderedListOutlined />, label: 'Transactions' },
  { key: '/attendants', icon: <TeamOutlined />, label: 'Attendants' },
  { key: '/pumps', icon: <ToolOutlined />, label: 'Pumps' },
  { key: '/reconciliation', icon: <AuditOutlined />, label: 'Reconciliation' },
  { key: '/fuel-prices', icon: <DollarOutlined />, label: 'Fuel Prices' },
  { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize, logout, isAdmin } = useAuthStore();
  const { stations, currentStation, fetchStations, setCurrentStationById } = useStationStore();
  const [collapsed, setCollapsed] = useState(false);

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
    }
  }, [user, fetchStations]);

  if (!initialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  const selectedKey = navItems.find((item) => pathname.startsWith(item.key))?.key || '/dashboard';

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    ...(isAdmin()
      ? [{ key: 'admin', icon: <SettingOutlined />, label: 'Admin Panel' }]
      : []),
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

  return (
    <Layout className="min-h-screen">
      <Sider
        width={260}
        collapsedWidth={80}
        collapsed={collapsed}
        className="!bg-fuel-sidebar"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-fuel-orange to-fuel-orange-dark rounded-xl flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M13 10h4a2 2 0 0 1 2 2v10" />
              </svg>
            </div>
            {!collapsed && (
              <div>
                <Text className="!text-white !text-lg !font-bold block leading-tight">FuelFlow</Text>
                <Text className="!text-slate-400 !text-xs">Management Portal</Text>
              </div>
            )}
          </div>

          <div className="flex-1 py-4 sidebar-nav overflow-y-auto">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={navItems.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
              }))}
              onClick={({ key }) => router.push(key)}
            />
          </div>

          <div className="p-4 border-t border-white/10">
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="topRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors">
                <Avatar
                  size={36}
                  className="!bg-fuel-orange flex-shrink-0"
                  icon={<UserOutlined />}
                />
                {!collapsed && (
                  <div className="min-w-0">
                    <Text className="!text-white !text-sm !font-medium block truncate">{user.name}</Text>
                    <Text className="!text-slate-400 !text-xs block truncate">{user.role}</Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Header className="!bg-white !px-6 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50" style={{ height: 64 }}>
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!text-gray-500"
            />
            <Select
              value={currentStation?.id}
              onChange={setCurrentStationById}
              placeholder="Select station"
              className="w-64"
              options={stations.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="flex items-center gap-4">
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined className="text-lg" />}
                onClick={() => router.push('/notifications')}
                className="!text-gray-500"
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar size={32} className="!bg-fuel-orange" icon={<UserOutlined />} />
                <span className="text-sm font-medium text-gray-700 hidden lg:inline">{user.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
