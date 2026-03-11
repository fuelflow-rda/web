'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Avatar,
  Typography,
  Spin,
  Button,
  Dropdown,
} from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  TeamOutlined,
  ToolOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth-store';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const adminNavItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Overview' },
  { key: '/admin/stations', icon: <BankOutlined />, label: 'Stations' },
  { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
  { key: '/admin/pumps', icon: <ToolOutlined />, label: 'Pumps' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'ADMIN')) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  const selectedKey =
    adminNavItems.find(
      (item) => item.key === pathname || (item.key !== '/admin' && pathname.startsWith(item.key))
    )?.key || '/admin';

  const userMenuItems = [
    { key: 'dashboard', icon: <BarChartOutlined />, label: 'Manager View' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') logout();
    else if (key === 'dashboard') router.push('/dashboard');
    else if (key === 'settings') router.push('/settings');
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
                <Text className="!text-fuel-orange !text-xs !font-semibold">ADMIN</Text>
              </div>
            )}
          </div>

          <div className="flex-1 py-4 sidebar-nav overflow-y-auto">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={adminNavItems.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
              }))}
              onClick={({ key }) => router.push(key)}
            />
          </div>

          <div className="px-4 pb-2">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/dashboard')}
              className="!text-slate-400 hover:!text-white w-full !justify-start"
            >
              {!collapsed && 'Manager View'}
            </Button>
          </div>

          <div className="p-4 border-t border-white/10">
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="topRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors">
                <Avatar size={36} className="!bg-fuel-orange flex-shrink-0" icon={<UserOutlined />} />
                {!collapsed && (
                  <div className="min-w-0">
                    <Text className="!text-white !text-sm !font-medium block truncate">{user.name}</Text>
                    <Text className="!text-fuel-orange !text-xs block">Admin</Text>
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
            <Text strong className="text-lg">Admin Dashboard</Text>
          </div>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar size={32} className="!bg-fuel-orange" icon={<UserOutlined />} />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
