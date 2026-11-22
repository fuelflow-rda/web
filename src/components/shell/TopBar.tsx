'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Popover } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Bell, ChevronRight, Menu, Moon, Search, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { focusRing } from '@/components/ui/focus';
import { cx } from '@/lib/cx';
import { useThemeStore } from '@/store/theme-store';
import { unreadCount, useNotificationStore } from '@/store/notification-store';
import type { Notification } from '@/types';

dayjs.extend(relativeTime);

export interface Crumb {
  label: string;
  href?: string;
}

export interface TopBarProps {
  crumbs: Crumb[];
  searchPlaceholder: string;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onOpenNotification: (n: Notification) => void;
}

/** True on Apple platforms, where the shortcut is ⌘K rather than Ctrl K. */
function useIsMac() {
  const [mac] = useState(() => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform));
  return mac;
}

/**
 * The bar above every page, from the Pencil "Top bar" component: where you
 * are, search, theme, alerts. Below the large breakpoint a menu button opens
 * the sidebar, and search shrinks to an icon.
 */
export function TopBar({ crumbs, searchPlaceholder, onOpenSearch, onOpenMenu, onOpenNotification }: TopBarProps) {
  const mac = useIsMac();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const nextTheme = mode === 'dark' ? 'light' : 'dark';

  return (
    <header className="sticky top-0 z-40 flex h-(--size-topbar-height) items-center gap-4 border-b border-border bg-bg px-4 md:px-8">
      <IconButton icon={Menu} label="Open menu" onClick={onOpenMenu} className="lg:hidden" />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="m-0 flex min-w-0 list-none items-center gap-2 p-0 text-13">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            // Each separator lives with the crumb after it, so a crumb hidden on a
            // phone takes its chevron with it.
            return (
              <li
                key={`${c.label}-${i}`}
                className={cx(
                  'min-w-0 items-center gap-2',
                  last ? 'flex font-semibold text-text' : 'hidden text-text-muted sm:flex',
                )}
              >
                {i > 0 ? (
                  <ChevronRight
                    size={14}
                    aria-hidden
                    className={cx('shrink-0 text-text-muted', last && 'hidden sm:block')}
                  />
                ) : null}
                {last ? (
                  <span aria-current="page" className="truncate">
                    {c.label}
                  </span>
                ) : c.href ? (
                  <Link
                    href={c.href}
                    className={cx('truncate text-text-muted no-underline hover:text-text', focusRing)}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate">{c.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}
          className={cx(
            'hidden w-80 cursor-pointer items-center gap-2.5 rounded-control border border-border bg-surface px-3 py-2 text-left text-13 text-text-muted transition-colors hover:border-border-strong md:flex',
            focusRing,
          )}
        >
          <Search size={16} aria-hidden className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{searchPlaceholder}</span>
          <kbd className="shrink-0 rounded-badge border border-border px-1.5 py-px font-mono text-11 text-text-muted">
            {mac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
        <IconButton icon={Search} label="Search" onClick={onOpenSearch} className="md:hidden" />
        <IconButton icon={mode === 'dark' ? Sun : Moon} label={`Switch to ${nextTheme} theme`} onClick={toggle} />
        <Alerts onOpen={onOpenNotification} />
      </div>
    </header>
  );
}

function Alerts({ onOpen }: { onOpen: (n: Notification) => void }) {
  const [open, setOpen] = useState(false);
  const { items, loading, error, fetch, markRead } = useNotificationStore();
  const unread = unreadCount(items);

  const content = (
    <div className="w-[min(22rem,calc(100vw-2rem))]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-14 font-semibold text-text">Notifications</span>
        {unread > 0 ? <span className="text-12 text-text-muted">{unread} unread</span> : null}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {error && items.length === 0 ? (
          <p className="m-0 px-4 py-8 text-center text-13 text-text-secondary">
            Notifications could not be loaded.{' '}
            <button
              type="button"
              onClick={() => void fetch()}
              className={cx(
                'cursor-pointer border-0 bg-transparent p-0 text-13 font-semibold text-link underline',
                focusRing,
              )}
            >
              Try again
            </button>
          </p>
        ) : loading && items.length === 0 ? (
          <p className="m-0 px-4 py-8 text-center text-13 text-text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="m-0 px-4 py-8 text-center text-13 text-text-secondary">
            Nothing new. Alerts about discrepancies, shifts and stations appear here.
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {items.map((n) => (
              <li key={n.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpen(n);
                    if (!n.isRead) void markRead(n.id);
                  }}
                  className={cx(
                    'flex w-full cursor-pointer gap-3 border-0 px-4 py-3 text-left transition-colors hover:bg-surface-muted',
                    n.isRead ? 'bg-transparent' : 'bg-warning-tint',
                    focusRing,
                  )}
                >
                  <span
                    aria-hidden
                    className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-accent')}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cx('text-13 text-text', n.isRead ? 'font-medium' : 'font-semibold')}>
                      {n.title}
                    </span>
                    <span className="line-clamp-2 text-12 text-text-secondary">{n.message}</span>
                    <span className="text-11 text-text-muted">{n.createdAt ? dayjs(n.createdAt).fromNow() : ''}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={() => setOpen(false)}
          className={cx('text-13 font-semibold text-link no-underline hover:underline', focusRing)}
        >
          See all notifications
        </Link>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void fetch();
      }}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      content={content}
      classNames={{ container: 'p-0!' }}
    >
      <span className="relative inline-flex">
        <IconButton icon={Bell} label={unread ? `Notifications, ${unread} unread` : 'Notifications'} />
        {unread > 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 right-2 size-2 rounded-full border-2 border-surface bg-danger"
          />
        ) : null}
      </span>
    </Popover>
  );
}
