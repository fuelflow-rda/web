'use client';

import { useEffect, useState } from 'react';
import { DatePicker, Input, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Search } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Button, PageHeader, Panel, Tag } from '@/components/ui';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { getAudit, type AuditEvent, type Paged } from '@/components/admin/data';
import { cx } from '@/lib/cx';
import { useAuthStore } from '@/store/auth-store';

/** Families of action, for the filter and the label on each row. */
const FAMILIES: Record<string, string> = {
  auth: 'Sign-in',
  user: 'People',
  transaction: 'Sales',
  price: 'Prices',
  pump: 'Pumps',
  reconciliation: 'Reconciliation',
  company: 'Company',
};
const ROLE: Record<string, string> = {
  superadmin: 'Platform',
  company_admin: 'Company admin',
  station_manager: 'Manager',
  attendant: 'Attendant',
};
const PAGE = 50;
const when = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));

/**
 * Who did what, newest first. Not designed; built from the components. Every
 * entry is permanent: the database refuses edits and deletes.
 */
export default function AuditPage() {
  const platform = useAuthStore((s) => s.user?.role === 'SUPERADMIN');
  const [family, setFamily] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<AuditEvent> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const filterKey = JSON.stringify([family, range?.map((d) => d.format('YYYY-MM-DD'))]);
  const [lastFilter, setLastFilter] = useState(filterKey);
  if (filterKey !== lastFilter) {
    setLastFilter(filterKey);
    setPage(1);
  }
  const requestKey = JSON.stringify([filterKey, page, nonce]);
  useEffect(() => {
    let live = true;
    const p: Record<string, unknown> = { page, limit: PAGE };
    if (family) p.action = family;
    if (range) {
      p.from = new Date(`${range[0].format('YYYY-MM-DD')}T00:00:00+02:00`).toISOString();
      p.to = new Date(`${range[1].format('YYYY-MM-DD')}T23:59:59.999+02:00`).toISOString();
    }
    getAudit(p)
      .then((r) => {
        if (!live) return;
        setData(r);
        setError(null);
      })
      .catch((err: Error) => live && setError(err.message))
      .finally(() => live && setLoadedKey(requestKey));
    return () => {
      live = false;
    };
  }, [requestKey, page, family, range]);
  const loading = loadedKey !== requestKey;

  const needle = q.trim().toLowerCase();
  const rows = (data?.data ?? []).filter(
    (e) => !needle || e.summary.toLowerCase().includes(needle) || (e.actor.name ?? '').toLowerCase().includes(needle),
  );
  const total = data?.pagination.total ?? 0;

  return (
    <>
      <PageHeader
        title="Audit log"
        description={`Everything people did ${platform ? 'across the platform' : 'in your company'}, newest first. Entries cannot be changed or deleted.`}
        actions={
          <ExportButton
            filename="audit-log"
            data={rows.map((e) => ({
              when: when(e.occurredAt),
              who: e.actor.name ?? 'System',
              role: e.actor.role ? (ROLE[e.actor.role] ?? e.actor.role) : '',
              what: e.summary,
              action: e.action,
            }))}
            columns={[
              { header: 'When (Kigali)', key: 'when' },
              { header: 'Who', key: 'who' },
              { header: 'Role', key: 'role' },
              { header: 'What', key: 'what' },
              { header: 'Action', key: 'action' },
            ]}
          />
        }
      />
      <div role="search" aria-label="Filter the audit log" className="flex flex-wrap gap-3">
        <Input
          aria-label="Search this page"
          placeholder="Search who or what"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
          className="w-full sm:w-70"
        />
        <Select
          aria-label="Kind"
          placeholder="Everything"
          allowClear
          value={family}
          onChange={setFamily}
          className="w-full sm:w-45"
          options={Object.entries(FAMILIES).map(([value, label]) => ({ value, label }))}
        />
        <DatePicker.RangePicker
          aria-label="Dates"
          value={range}
          onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
          disabledDate={(d) => d.isAfter(dayjs(), 'day')}
        />
      </div>
      <Panel
        title={`${num(total)} ${total === 1 ? 'entry' : 'entries'}`}
        meta={needle ? 'The search covers the entries on this page' : 'Times in Kigali'}
        padded={false}
      >
        {error && !data ? (
          <div className="p-5">
            <PanelError message="The audit log could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : !data ? (
          <div className="p-5">
            <PanelSkeleton rows={10} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">Nothing recorded for these filters.</p>
        ) : (
          <ol className={cx('m-0 list-none p-0 transition-opacity', loading && 'opacity-60')}>
            {rows.map((e) => {
              const fam = e.action.split('.')[0];
              return (
                <li
                  key={e.id}
                  className="flex flex-col gap-1 border-t border-border px-5 py-3 first:border-t-0 lg:flex-row lg:items-baseline lg:gap-4"
                >
                  <time dateTime={e.occurredAt} className="shrink-0 font-mono text-12 text-text-muted lg:w-40">
                    {when(e.occurredAt)}
                  </time>
                  <span className="min-w-0 flex-1 text-14 text-text">{e.summary}</span>
                  <span className="flex shrink-0 items-center gap-2 text-12 text-text-secondary">
                    <Tag color="var(--border-strong)">{FAMILIES[fam] ?? fam}</Tag>
                    {e.actor.name ?? 'System'}
                    {e.actor.role ? ` · ${ROLE[e.actor.role] ?? e.actor.role}` : ''}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="m-0 text-13 text-text-secondary">
            {total ? `Page ${page} of ${Math.max(1, Math.ceil(total / PAGE))}` : ''}
          </p>
          <div className="flex gap-2">
            <Button disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button disabled={page * PAGE >= total || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
