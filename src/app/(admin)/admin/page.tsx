'use client';

import { PlatformOverview } from '@/components/admin/PlatformOverview';
import { CompanyView } from '@/components/admin/CompanyView';
import { PageHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';

/**
 * Platform administrators get the platform overview; a company admin gets
 * their own company's page (stations, administrators, details).
 */
export default function AdminHomePage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'SUPERADMIN') return <PlatformOverview />;
  if (!user?.companyId) return <PageHeader title="Company" description="Your account is not linked to a company." />;
  return <CompanyView companyId={user.companyId} platform={false} />;
}
