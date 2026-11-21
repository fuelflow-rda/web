'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { useAuthStore } from '@/store/auth-store';

/** The platform's tenant list: platform administrators only. */
const SUPERADMIN_ONLY_PATHS = ['/admin/companies', '/admin/sync-health', '/admin/audit'];

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
      {children}
    </AppShell>
  );
}
