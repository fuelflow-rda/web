'use client';

import { useEffect, useState } from 'react';
import { Input, Select } from 'antd';
import { CheckCheck, Search } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '@/lib/api';
import type { Notification } from '@/types';
import { Banner, Button, PageHeader, Panel, StatusChip } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { NotificationDetailModal } from '@/components/NotificationDetailModal';
import { FILTER_KINDS, TONE_BADGE, kigaliWhen, kindOf } from '@/components/notifications/kinds';
import { toNotification, useNotificationStore } from '@/store/notification-store';
import { cx } from '@/lib/cx';

dayjs.extend(relativeTime);

const PAGE = 25;

/**
 * Every notification for the signed-in user. Not designed; restyled from the
 * components to match the top bar's list.
 */
export default function NotificationsPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<string | undefined>();
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: Notification[]; total: number } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [open, setOpen] = useState<Notification | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const filterKey = JSON.stringify([search, kind, order]);
  const [lastFilter, setLastFilter] = useState(filterKey);
  if (filterKey !== lastFilter) {
    setLastFilter(filterKey);
    setPage(1);
  }

  const requestKey = JSON.stringify([search, kind, order, page, nonce]);
  useEffect(() => {
    let live = true;
    api
      .get('/notifications', {
        params: { search: search || undefined, type: kind, sortOrder: order, page, limit: PAGE },
      })
      .then((r) => {
        if (!live) return;
        const body = r.data as { data?: Record<string, unknown>[]; pagination?: { total: number } };
        const rows = (body.data ?? []).map(toNotification);
        setResult({ key: requestKey, rows, total: body.pagination?.total ?? rows.length });
      })
      .catch((err: Error) => live && setError({ key: requestKey, message: err.message }));
    return () => {
      live = false;
    };
  }, [search, kind, order, page, requestKey]);

  const failed = error?.key === requestKey;
  const loading = !failed && result?.key !== requestKey;
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const unreadHere = rows.filter((n) => !n.isRead).length;
  const filtered = Boolean(search || kind);

  const setRead = (match: (n: Notification) => boolean) => {
    setResult((r) => (r ? { ...r, rows: r.rows.map((n) => (match(n) ? { ...n, isRead: true } : n)) } : r));
    useNotificationStore.setState((s) => ({ items: s.items.map((n) => (match(n) ? { ...n, isRead: true } : n)) }));
  };

  const openOne = (n: Notification) => {
    setOpen(n);
    if (n.isRead) return;
    setRead((x) => x.id === n.id);
    // Marked here and in the top bar at once; if the PATCH fails, the next load shows it unread.
    void api.patch(`/notifications/${n.id}/read`).catch(() => {});
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setRead(() => true);
      setNotice({ tone: 'success', text: 'Everything is marked as read.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: err instanceof Error ? err.message : 'Notifications could not be marked as read.' });
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Discrepancies, long shifts, quiet stations and PIN requests"
        actions={
          rows.length ? (
            <Button icon={CheckCheck} onClick={() => void markAll()}>
              Mark all as read
            </Button>
          ) : null
        }
      />
      {notice ? <Banner tone={notice.tone} title={notice.text} /> : null}
      <div role="search" aria-label="Filter notifications" className="flex flex-wrap gap-3">
        <Input
          aria-label="Search notifications"
          placeholder="Search title or message"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
          className="w-full sm:w-70"
        />
        <Select
          aria-label="Kind"
          placeholder="Every kind"
          allowClear
          value={kind}
          onChange={setKind}
          className="w-full sm:w-50"
          options={FILTER_KINDS}
        />
        <Select
          aria-label="Order"
          value={order}
          onChange={setOrder}
          className="w-full sm:w-40"
          options={[
            { value: 'desc', label: 'Newest first' },
            { value: 'asc', label: 'Oldest first' },
          ]}
        />
      </div>
      <Panel
        title={`${num(total)} ${total === 1 ? 'notification' : 'notifications'}`}
        meta={unreadHere ? `${unreadHere} unread on this page` : 'Times in Kigali'}
        padded={false}
      >
        {failed && !result ? (
          <div className="p-5">
            <PanelError message="Notifications could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : !result ? (
          <div className="p-5">
            <PanelSkeleton rows={8} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">
            {filtered
              ? 'No notification matches.'
              : 'Nothing yet. Discrepancies, long shifts, quiet stations and PIN requests appear here.'}
          </p>
        ) : (
          <ul className={cx('m-0 list-none p-0 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {rows.map((n) => {
              const k = kindOf(n.type);
              const Icon = k.icon;
              return (
                <li key={n.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openOne(n)}
                    className={cx(
                      'flex w-full cursor-pointer items-start gap-3 border-0 px-5 py-4 text-left transition-colors hover:bg-surface-muted',
                      n.isRead ? 'bg-transparent' : 'bg-warning-tint',
                      focusRing,
                    )}
                  >
                    <span
                      aria-hidden
                      className={cx(
                        'inline-flex size-9 shrink-0 items-center justify-center rounded-full',
                        TONE_BADGE[k.tone],
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={cx('text-14 text-text', n.isRead ? 'font-medium' : 'font-semibold')}>
                          {n.title}
                        </span>
                        {n.isRead ? null : <span className="sr-only">(unread)</span>}
                      </span>
                      <span className="line-clamp-2 text-13 text-text-secondary">{n.message}</span>
                      <span className="flex flex-wrap items-center gap-2 pt-0.5">
                        <StatusChip tone={k.tone} icon={k.icon}>
                          {k.label}
                        </StatusChip>
                        {n.createdAt ? (
                          <span className="text-12 text-text-muted">
                            <time dateTime={n.createdAt}>{kigaliWhen(n.createdAt)}</time> ·{' '}
                            {dayjs(n.createdAt).fromNow()}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cx('mt-2 size-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-accent')}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {failed && result ? (
          <div className="border-t border-border px-5 py-3">
            <PanelError message="That page could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="m-0 text-13 text-text-secondary">
            {total ? `Page ${page} of ${Math.max(1, Math.ceil(total / PAGE))}` : ''}
          </p>
          <div className="flex gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Panel>

      <NotificationDetailModal open={open !== null} notification={open} onClose={() => setOpen(null)} />
    </>
  );
}
