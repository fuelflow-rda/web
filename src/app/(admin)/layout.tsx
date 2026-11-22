'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { CompanyTabs } from '@/components/admin/CompanyTabs';
import { useAuthStore } from '@/store/auth-store';

/** The platform's tenant list and phones: platform administrators only. Company admins have their own audit log. */
const SUPERADMIN_ONLY_PATHS = ['/admin/companies', '/admin/sync-health'];

/**
 * /admin is the platform for platform administrators, and "Company" (their
 * stations, people and pumps) for company admins, inside the company shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize, logout } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN'))) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (!initialized || !user || isSuperAdmin) return;
    if (SUPERADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      router.replace('/admin');
    }
  }, [initialized, user, isSuperAdmin, pathname, router]);

  if (!initialized || !user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return <AppLoadingScreen />;
  }

  return (
    <AppShell area={isSuperAdmin ? 'platform' : 'company'} user={user} onSignOut={logout}>
      {isSuperAdmin ? null : <CompanyTabs />}
      {children}
    </AppShell>
  );
}
