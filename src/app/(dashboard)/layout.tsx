'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { useAuthStore } from '@/store/auth-store';

/** A station's pages: Overview, Transactions, Reconciliation and the rest. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized, initialize, logout } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    // Defence in depth: login already refuses attendant sessions, but a stored
    // session from an older build must not open the management console either.
    if (user.role === 'ATTENDANT') logout();
  }, [initialized, user, router, logout]);

  if (!initialized || !user || user.role === 'ATTENDANT') return <AppLoadingScreen />;

  return (
    <AppShell area="company" user={user} onSignOut={logout}>
      {children}
    </AppShell>
  );
}
