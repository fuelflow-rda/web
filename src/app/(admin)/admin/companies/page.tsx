'use client';

import { useState } from 'react';
import { Input } from 'antd';
import { Search } from 'lucide-react';
import { PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { CompaniesTable } from '@/components/admin/PlatformOverview';
import { getPlatformHealth } from '@/components/admin/data';

/** Every company, with the same live columns as the platform overview. Not designed; built from its parts. */
export default function CompaniesPage() {
  const health = usePolled('platform', getPlatformHealth, 30_000);
  const [q, setQ] = useState('');
  const rows = (health.data?.companies ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <PageHeader
        title="Companies"
        description={
          health.data
            ? `${health.data.kpis.companies} companies · ${health.data.kpis.live} live, ${health.data.kpis.onboarding} onboarding`
            : 'Every company on Relai'
        }
        actions={
          <Input
            aria-label="Search companies"
            placeholder="Search companies"
            prefix={<Search size={16} aria-hidden className="text-text-muted" />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            allowClear
            className="w-64"
          />
        }
      />
      <Panel
        title="Companies"
        meta="Sorted by revenue today. New companies are added from the platform overview."
        padded={false}
      >
        {health.error && !health.data ? (
          <div className="p-5">
            <PanelError message="Companies could not be loaded." onRetry={health.reload} />
          </div>
        ) : !health.data ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 p-5 text-14 text-text-secondary">
            {q ? 'No company matches that search.' : 'No companies yet.'}
          </p>
        ) : (
          <CompaniesTable rows={rows} now={health.updatedAt ?? 0} />
        )}
      </Panel>
    </>
  );
}
