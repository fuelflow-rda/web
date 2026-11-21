'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal } from 'antd';
import { Building2, ScrollText } from 'lucide-react';
import { Banner, Button, KpiTile, PageHeader, Panel, StatusChip, TextField, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { initialsOf } from '@/components/ui/Avatar';
import { BarChart } from '@/components/overview/BarChart';
import { PanelError, PanelSkeleton, clock, longDay, num, rwf } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { cx } from '@/lib/cx';
import { createCompany, getPlatformHealth, getPlatformSeries, resendInvite, type PlatformHealth } from './data';

/** "12 s", "2 min", "3 h", "4 d", as the design writes last sync. */
export function shortAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return 'Never';
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86_400) return `${Math.round(s / 3600)} h`;
  return `${Math.round(s / 86_400)} d`;
}

/** "3 h 12 min" */
export function duration(fromIso: string, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - Date.parse(fromIso)) / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

const COMPANY_STATUS: Record<PlatformHealth['companies'][number]['status'], { label: string; tone: StatusTone }> = {
  live: { label: 'Live', tone: 'success' },
  devices_offline: { label: 'Devices offline', tone: 'warning' },
  onboarding: { label: 'Onboarding', tone: 'info' },
};

export function CompaniesTable({ rows, now }: { rows: PlatformHealth['companies']; now: number }) {
  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-170 border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className={head}>
              Company
            </th>
            <th scope="col" className={cx(head, 'text-right')}>
              Stations
            </th>
            <th scope="col" className={cx(head, 'text-right')}>
              Revenue today
            </th>
            <th scope="col" className={cx(head, 'text-right')}>
              Last sync
            </th>
            <th scope="col" className={head}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <th scope="row" className={cx(cell, 'text-left font-normal')}>
                <Link
                  href={`/admin/companies/${c.id}`}
                  className={cx('flex items-center gap-3 no-underline', focusRing)}
                >
                  <span
                    aria-hidden
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-control border border-border bg-surface-muted text-12 font-semibold text-text-secondary"
                  >
                    {initialsOf(c.name)}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-14 font-semibold text-text">{c.name}</span>
                    <span className={cx('text-12', c.admins ? 'text-text-muted' : 'text-warning')}>
                      {c.admins ? `${c.admins} ${c.admins === 1 ? 'admin' : 'admins'}` : 'No admin yet'}
                    </span>
                  </span>
                </Link>
              </th>
              <td className={cx(cell, 'text-right font-mono text-13 text-text')}>{c.stations}</td>
              <td className={cx(cell, 'text-right font-mono text-13 font-semibold text-text')}>
                {num(c.revenueToday)}
              </td>
              <td
                className={cx(cell, 'text-right font-mono text-13 text-text-secondary')}
                title={c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString('en-GB') : undefined}
              >
                {shortAgo(c.lastSyncAt, now)}
              </td>
              <td className={cell}>
                <StatusChip tone={COMPANY_STATUS[c.status].tone}>{COMPANY_STATUS[c.status].label}</StatusChip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SyncHealth({ h, now }: { h: PlatformHealth; now: number }) {
  const r = h.reconciliation;
  const missing = Math.max(0, r.stationsWithSales - r.reports);
  const rows: Array<{ label: string; detail: string; value: string; tone?: string }> = [
    {
      label: 'Sales queued on phones',
      detail: h.sync.devicesWithQueue
        ? `On ${h.sync.devicesWithQueue} ${h.sync.devicesWithQueue === 1 ? 'device' : 'devices'}${h.sync.oldestQueuedAt ? ` · oldest ${duration(h.sync.oldestQueuedAt, now)}` : ''}`
        : 'Every phone is up to date',
      value: num(h.sync.queuedSales),
      tone: h.sync.devicesNotSynced ? 'text-warning' : undefined,
    },
    {
      label: 'Reconciliation last night',
      detail: missing
        ? `${missing} ${missing === 1 ? 'station' : 'stations'} without a report`
        : r.lastGeneratedAt
          ? `All stations ran at ${clock(r.lastGeneratedAt)}`
          : 'No station sold anything',
      value: `${r.reports} of ${r.stationsWithSales}`,
      tone: missing ? 'text-danger' : undefined,
    },
    {
      label: 'Failed sign-ins',
      detail: `${h.signIns.lockedAccounts} ${h.signIns.lockedAccounts === 1 ? 'account' : 'accounts'} locked`,
      value: num(h.signIns.failedLast24h),
    },
    {
      label: 'API errors',
      detail: h.api.p95Ms === null ? 'No requests yet' : `p95 response ${h.api.p95Ms} ms`,
      value: h.api.errorRate === null ? '—' : `${(h.api.errorRate * 100).toFixed(2)}%`,
      tone: (h.api.errorRate ?? 0) > 0.01 ? 'text-danger' : undefined,
    },
  ];
  return (
    <Panel
      title="Sync health"
      meta="Phones and the server, last 24 hours"
      action={{ label: 'Phones', href: '/admin/sync-health' }}
    >
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-14 font-semibold text-text">{row.label}</span>
              <span className="text-12 text-text-muted">{row.detail}</span>
            </span>
            <span className={cx('shrink-0 font-mono text-17 font-semibold', row.tone ?? 'text-text')}>{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 text-11 text-text-muted">
        API figures cover this server process since {clock(h.api.since)}.
      </p>
    </Panel>
  );
}

function NeedsAttention({
  items,
  now,
  onResent,
}: {
  items: PlatformHealth['needsAttention'];
  now: number;
  onResent: (msg: string) => void;
}) {
  const router = useRouter();
  const day = (iso: string) =>
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Africa/Kigali',
    }).format(new Date(iso));
  return (
    <Panel
      title="Needs attention"
      meta={items.length ? `${items.length} ${items.length === 1 ? 'item' : 'items'}` : undefined}
    >
      {items.length === 0 ? (
        <p className="m-0 text-14 text-text-secondary">Nothing needs you right now.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {items.map((a, i) => {
            let title = '';
            let detail = '';
            let action: { label: string; run: () => void } | null = null;
            if (a.kind === 'no_admin') {
              title = `${a.company.name} has no administrator`;
              detail = `Created ${day(a.since)}`;
              action = { label: 'Invite', run: () => router.push(`/admin/companies/${a.company.id}?invite=1`) };
            } else if (a.kind === 'devices_not_synced') {
              title = `${a.company.name}${a.station?.name ? ` · ${a.station.name}` : ''}`;
              detail = `${a.devices} ${a.devices === 1 ? 'phone has' : 'phones have'} not synced for ${duration(a.since, now)}, holding ${a.sales} ${a.sales === 1 ? 'sale' : 'sales'}`;
              action = { label: 'View phones', run: () => router.push('/admin/sync-health') };
            } else if (a.kind === 'reconciliation_missing') {
              title = `${a.company?.name ? `${a.company.name} · ` : ''}${a.station.name}`;
              detail = `Last night's reconciliation did not run`;
              action = a.company
                ? { label: 'Open', run: () => router.push(`/admin/companies/${a.company!.id}`) }
                : null;
            } else {
              title = `Invitation to ${a.user.email ?? a.user.name ?? 'someone'} expired`;
              detail = `${a.company?.name ?? ''}${a.company?.name ? ' · ' : ''}expired ${day(a.since)}`;
              action = {
                label: 'Resend',
                run: () =>
                  void resendInvite(a.user.id)
                    .then((r) =>
                      onResent(
                        r.sent
                          ? `A new invitation went to ${a.user.email}.`
                          : `The invitation was renewed but not emailed (${r.reason}).`,
                      ),
                    )
                    .catch((err: Error) => onResent(err.message)),
              };
            }
            return (
              <li
                key={`${a.kind}-${i}`}
                className="flex items-start justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-14 font-semibold text-text">{title}</span>
                  <span className="text-12 text-text-muted">{detail}</span>
                </span>
                {action ? (
                  <button
                    type="button"
                    onClick={action.run}
                    className={cx(
                      'shrink-0 cursor-pointer border-0 bg-transparent p-0 text-13 font-semibold text-link hover:underline',
                      focusRing,
                    )}
                  >
                    {action.label}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function NewCompanyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (name.trim().length < 2) return setProblem('Enter the company name as customers know it.');
    setSaving(true);
    try {
      const created = await createCompany(name.trim());
      router.push(`/admin/companies/${created.id}?invite=1`);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The company could not be created.');
      setSaving(false);
    }
  };
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="New company"
      okText="Create company"
      onOk={() => submit()}
      confirmLoading={saving}
      destroyOnHidden
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <TextField
          label="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={problem || undefined}
          autoFocus
        />
        <p className="m-0 text-13 text-text-secondary">
          Next you invite its first administrator, who adds stations and people.
        </p>
      </form>
    </Modal>
  );
}

export function PlatformOverview() {
  const router = useRouter();
  const health = usePolled('platform', getPlatformHealth, 30_000);
  const trend = usePolled('platform-trend', () => getPlatformSeries(30), 300_000);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const h = health.data;
  const now = health.updatedAt ?? 0;

  const bars = (trend.data?.series ?? []).map((s, i, all) => {
    const d = new Date(s.bucket);
    return {
      label:
        i % 5 === 0
          ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Kigali' }).format(d)
          : null,
      name: new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'Africa/Kigali',
      }).format(d),
      value: Number(s.revenue) || 0,
      highlight: i === all.length - 1,
    };
  });

  return (
    <>
      <PageHeader
        title="Platform overview"
        description={h ? `All companies · ${longDay(h.generatedAt)} · ${clock(h.generatedAt)}` : 'All companies'}
        actions={
          <>
            <Button icon={ScrollText} onClick={() => router.push('/admin/audit')}>
              Audit log
            </Button>
            <Button kind="primary" icon={Building2} onClick={() => setCreating(true)}>
              New company
            </Button>
          </>
        }
      />
      {notice ? <Banner tone="info" title={notice} /> : null}
      {health.error && !h ? (
        <Panel title="Platform">
          <PanelError message="The platform overview could not be loaded." onRetry={health.reload} />
        </Panel>
      ) : !h ? (
        <PanelSkeleton rows={6} />
      ) : (
        <>
          <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Companies"
              value={num(h.kpis.companies)}
              delta={{ text: `${h.kpis.live} live, ${h.kpis.onboarding} onboarding`, direction: 'flat' }}
              href="/admin/companies"
            />
            <KpiTile
              label="Stations"
              value={num(h.kpis.stations)}
              delta={{ text: `${h.kpis.stationsReporting} reporting today`, direction: 'flat' }}
              href="/admin/stations"
            />
            <KpiTile
              label="Shifts open now"
              value={num(h.kpis.shiftsOpen)}
              delta={{
                text: `${h.kpis.attendantsActiveLastHour} attendants active in the last hour`,
                direction: 'flat',
              }}
            />
            <KpiTile
              label="Revenue today"
              prefix="RWF"
              value={num(h.kpis.revenueToday)}
              delta={{ text: 'All companies, all products', direction: 'flat' }}
            />
          </section>
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Panel
              title="Companies"
              meta="Sorted by revenue today"
              action={{ label: 'All companies', href: '/admin/companies' }}
              padded={false}
            >
              {h.companies.length ? (
                <CompaniesTable rows={h.companies} now={now} />
              ) : (
                <p className="m-0 p-5 text-14 text-text-secondary">No companies yet.</p>
              )}
            </Panel>
            <div className="flex flex-col gap-4">
              <SyncHealth h={h} now={now} />
              <NeedsAttention items={h.needsAttention} now={now} onResent={(m) => (setNotice(m), health.reload())} />
            </div>
          </div>
          <Panel title="Revenue, last 30 days" meta="All companies, by day">
            {trend.error && !trend.data ? (
              <PanelError message="The trend could not be loaded." onRetry={trend.reload} />
            ) : !trend.data ? (
              <PanelSkeleton rows={4} />
            ) : (
              <BarChart bars={bars} format={rwf} summary={`Platform revenue by day over the last 30 days.`} />
            )}
          </Panel>
        </>
      )}
      <NewCompanyModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
