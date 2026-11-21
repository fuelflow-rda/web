'use client';

import { CircleCheck, Clock3, CloudOff } from 'lucide-react';
import { Banner, PageHeader, Panel, StatusChip, type StatusTone } from '@/components/ui';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { duration, shortAgo } from '@/components/admin/PlatformOverview';
import { getDevices, type Device } from '@/components/admin/data';
import { cx } from '@/lib/cx';

const STATE: Record<Device['state'], { label: string; tone: StatusTone; icon: typeof CircleCheck }> = {
  not_synced: { label: 'Not synced', tone: 'danger', icon: CloudOff },
  pending: { label: 'Sending', tone: 'warning', icon: Clock3 },
  synced: { label: 'Synced', tone: 'success', icon: CircleCheck },
};

/**
 * Every attendant phone heard from this week. Not designed; built from the
 * components. Phones report how many sales they hold; that is the only way the
 * server learns of sales it has not received.
 */
export default function SyncHealthPage() {
  const devices = usePolled('devices', getDevices, 30_000);
  const now = devices.updatedAt ?? 0;
  const rows = devices.data ?? [];
  const stuck = rows.filter((d) => d.state === 'not_synced');
  const held = rows.reduce((s, d) => s + d.queuedSales, 0);
  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

  return (
    <>
      <PageHeader
        title="Sync health"
        description="Attendant phones heard from in the last 7 days. Each reports the sales it is still holding."
      />
      {stuck.length ? (
        <Banner
          tone="danger"
          icon={CloudOff}
          title={`${stuck.length} ${stuck.length === 1 ? 'phone has' : 'phones have'} not synced for over 30 minutes`}
        >
          {`${num(stuck.reduce((s, d) => s + d.queuedSales, 0))} sales are only on those phones. If a phone is lost or reset they are gone; ask the attendant to connect it.`}
        </Banner>
      ) : null}
      <Panel
        title={`${rows.length} ${rows.length === 1 ? 'phone' : 'phones'}`}
        meta={`${num(held)} sales waiting to send · not synced first`}
        padded={false}
      >
        {devices.error && !devices.data ? (
          <div className="p-5">
            <PanelError message="Phones could not be loaded." onRetry={devices.reload} />
          </div>
        ) : !devices.data ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">
            No phone has reported this week. Phones report once the attendant app is updated.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 border-collapse">
              <thead className="bg-surface-muted">
                <tr>
                  {[
                    'Attendant',
                    'Company · station',
                    'Waiting',
                    'Oldest',
                    'Last sync',
                    'Last heard',
                    'App',
                    'State',
                  ].map((h, i) => (
                    <th key={h} scope="col" className={cx(head, i >= 2 && i <= 5 && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const s = STATE[d.state];
                  return (
                    <tr key={d.deviceId}>
                      <th scope="row" className={cx(cell, 'text-left text-14 font-semibold text-text')}>
                        {d.attendant.name ?? 'Unknown'}
                      </th>
                      <td className={cx(cell, 'text-14 text-text')}>
                        {[d.company?.name, d.station?.name].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td
                        className={cx(
                          cell,
                          'text-right font-mono text-13 font-semibold',
                          d.queuedSales ? 'text-text' : 'text-text-muted',
                        )}
                      >
                        {num(d.queuedSales)}
                      </td>
                      <td className={cx(cell, 'text-right font-mono text-13 text-text-secondary')}>
                        {d.oldestQueuedAt ? duration(d.oldestQueuedAt, now) : '—'}
                      </td>
                      <td className={cx(cell, 'text-right font-mono text-13 text-text-secondary')}>
                        {shortAgo(d.lastSyncAt, now)}
                      </td>
                      <td className={cx(cell, 'text-right font-mono text-13 text-text-secondary')}>
                        {shortAgo(d.reportedAt, now)}
                      </td>
                      <td className={cx(cell, 'font-mono text-12 text-text-muted')}>
                        {[d.platform, d.appVersion].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className={cell}>
                        <StatusChip tone={s.tone} icon={s.icon}>
                          {s.label}
                        </StatusChip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
