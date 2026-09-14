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
  Modal,
  Select,
  message,
} from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  TeamOutlined,
  ToolOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';
import { BrandMark } from '@/components/BrandMark';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const adminNavItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Overview' },
  { key: '/admin/companies', icon: <ApartmentOutlined />, label: 'Companies' },
  { key: '/admin/stations', icon: <BankOutlined />, label: 'Stations' },
  { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
  { key: '/admin/pumps', icon: <ToolOutlined />, label: 'Pumps' },
];

const STATION_SCOPED_ADMIN_PATHS = ['/admin/stations', '/admin/pumps'];

/** Global tenant list: superadmin only (company admins manage their org via Stations / Users / Pumps). */
const SUPERADMIN_ONLY_PATHS = ['/admin/companies'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize, logout } = useAuthStore();
  const { stations, fetchStations, setCurrentStationById } = useStationStore();
  const [collapsed, setCollapsed] = useState(false);
  const [managerViewModalOpen, setManagerViewModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const sidebarNavItems = isSuperAdmin
    ? adminNavItems.filter((item) => !STATION_SCOPED_ADMIN_PATHS.includes(item.key))
    : adminNavItems.filter((item) => !SUPERADMIN_ONLY_PATHS.includes(item.key));

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Warm the route bundles for the admin pages. No-op in development.
  useEffect(() => {
    if (!user) return;
    const items = isSuperAdmin
      ? adminNavItems.filter((item) => !STATION_SCOPED_ADMIN_PATHS.includes(item.key))
      : adminNavItems.filter((item) => !SUPERADMIN_ONLY_PATHS.includes(item.key));
    for (const item of items) router.prefetch(item.key);
    // Reached from the user menu rather than the sidebar.
    router.prefetch('/dashboard');
  }, [user, isSuperAdmin, router]);

  useEffect(() => {
    if (initialized && (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN'))) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (!initialized || !user || !isSuperAdmin) return;
    if (STATION_SCOPED_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      router.replace('/admin');
    }
  }, [initialized, user, isSuperAdmin, pathname, router]);

  useEffect(() => {
    if (!initialized || !user || isSuperAdmin) return;
    if (SUPERADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      router.replace('/admin');
    }
  }, [initialized, user, isSuperAdmin, pathname, router]);

  if (!initialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-sunken">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <BrandMark size={24} color="var(--accent-on)" />
          </div>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const selectedKey =
    sidebarNavItems.find(
      (item) => item.key === pathname || (item.key !== '/admin' && pathname.startsWith(item.key))
    )?.key || '/admin';

  const currentPageTitle = sidebarNavItems.find((item) => item.key === selectedKey)?.label || 'Admin';

  const userMenuItems = [
    ...(isSuperAdmin
      ? []
      : [{ key: 'dashboard', icon: <BarChartOutlined />, label: 'Manager View' }]),
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') logout();
    else if (key === 'dashboard' && !isSuperAdmin) openManagerViewModal();
    else if (key === 'settings') router.push('/settings');
  };

  const openManagerViewModal = () => {
    setSelectedStationId(null);
    setManagerViewModalOpen(true);
    fetchStations();
  };

  const handleManagerViewGo = () => {
    if (!selectedStationId) {
      message.warning('Please choose a station first');
      return;
    }
    setCurrentStationById(selectedStationId);
    setManagerViewModalOpen(false);
    router.push('/dashboard');
  };

  const sidebarWidth = collapsed ? 80 : 272;

  return (
    <Layout className="min-h-screen">
      <Sider
        width={272}
        collapsedWidth={80}
        collapsed={collapsed}
        className="!bg-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-[var(--sidebar-border)]">
            <div className="flex items-center justify-center w-9 h-9 bg-accent rounded-control flex-shrink-0">
              <BrandMark size={18} color="var(--accent-on)" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Text className="!text-[var(--sidebar-ink)] !text-lg !font-extrabold tracking-tight">Relai</Text>
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-sidebar-ink bg-sidebar-surface rounded-md">ADMIN</span>
              </div>
            )}
          </div>

          <div className="flex-1 py-4 sidebar-nav overflow-y-auto">
            {!collapsed && (
              <div className="px-6 pb-3">
                <span className="text-[10px] font-bold tracking-[0.1em] text-[var(--sidebar-ink-muted)] uppercase">
                  Management
                </span>
              </div>
            )}
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={sidebarNavItems.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
              }))}
              onClick={({ key }) => router.push(key)}
            />
          </div>

          {/* Bottom: switch to manager + user profile */}
          <div className="mt-auto">
            <div className="p-3 pt-3 space-y-1">
              {!isSuperAdmin && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={openManagerViewModal}
                  className="!text-[var(--sidebar-ink-muted)] hover:!text-[var(--sidebar-ink)] !w-full !justify-start !rounded-lg !h-9 !text-sm hover:!bg-[var(--sidebar-hover)]"
                >
                  {!collapsed && 'Manager View'}
                </Button>
              )}
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']} placement="topRight">
                <div className="flex items-center gap-3 cursor-pointer rounded-lg p-2.5 transition-all duration-200 hover:bg-[var(--sidebar-hover)]">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      size={40}
                      className="!bg-accent"
                      icon={<UserOutlined />}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-[var(--sidebar-bg)]" />
                  </div>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <Text className="!text-[var(--sidebar-ink)] !text-sm !font-semibold block truncate">{user.name}</Text>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-sidebar-surface text-sidebar-ink">
                        Admin
                      </span>
                    </div>
                  )}
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Header
          className="!px-6 flex items-center justify-between border-b border-line-subtle sticky top-0 z-50"
          style={{
            height: 64,
            background: 'var(--surface)',
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!text-ink-muted hover:!text-ink-secondary !w-9 !h-9 !rounded-lg"
            />
            <div>
              <h1 className="text-base font-bold text-ink leading-tight">{currentPageTitle}</h1>
              <p className="text-xs text-ink-muted leading-tight">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="!text-ink-muted hover:!text-ink-secondary !w-9 !h-9 !rounded-lg" />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
            <div className="flex items-center gap-2.5 cursor-pointer hover:bg-surface-sunken rounded-xl px-2 py-1.5 transition-colors">
              <Avatar
                size={32}
                className="!bg-accent"
                icon={<UserOutlined />}
              />
              <span className="text-sm font-semibold text-ink">{user.name}</span>
            </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 min-h-[calc(100vh-64px)]" style={{ background: 'var(--surface-sunken)' }}>
          <div className="page-content">
            {children}
          </div>
        </Content>
      </Layout>

      <Modal
        title="Switch to Manager View"
        open={managerViewModalOpen}
        onCancel={() => setManagerViewModalOpen(false)}
        onOk={handleManagerViewGo}
        okText="Go to Manager View"
        cancelText="Cancel"
        okButtonProps={{ disabled: !selectedStationId }}
        destroyOnClose
      >
        <p className="text-ink-secondary mb-3">Choose a station to view as manager. The dashboard will show data for that station.</p>
        <Select
          placeholder="Select a station"
          value={selectedStationId}
          onChange={setSelectedStationId}
          options={stations.map((s) => ({ value: s.id, label: s.name }))}
          className="w-full"
          allowClear
        />
        {stations.length === 0 && (
          <p className="text-warn text-sm mt-2">No stations available. Add stations in Admin → Stations first.</p>
        )}
      </Modal>
    </Layout>
  );
}
