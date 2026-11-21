'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer } from 'antd';
import api from '@/lib/api';
import { NotificationDetailModal } from '@/components/NotificationDetailModal';
import type { AuthUser } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';
import { unreadCount, useNotificationStore } from '@/store/notification-store';
import type { Notification } from '@/types';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { TopBar, type Crumb } from './TopBar';
import { activeItem, navFor, type ShellArea } from './nav';

/** Lets a page add its own last crumb ("City Gas Co" on a company's page). */
const CrumbContext = createContext<(label: string | null) => void>(() => {});

export function useShellCrumb(label: string | null | undefined) {
  const set = useContext(CrumbContext);
  useEffect(() => {
    set(label ?? null);
    return () => set(null);
  }, [label, set]);
}

const SEARCH_PLACEHOLDER: Record<ShellArea, string> = {
  company: 'Search plates, phones, attendants',
  platform: 'Search companies, stations, users',
};

/**
 * The frame every signed-in page sits in: Night sidebar, top bar, content.
 * At the large breakpoint and up the sidebar is fixed; below it, it opens as
 * a drawer from the top bar's menu button.
 */
export function AppShell({
  area,
  user,
  onSignOut,
  children,
}: {
  area: ShellArea;
  user: AuthUser;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = useMemo(() => navFor(user, area), [user, area]);
  const { stations, currentStation, fetchStations, setCurrentStationById } = useStationStore();
  const notifications = useNotificationStore((s) => s.items);
  const fetchNotifications = useNotificationStore((s) => s.fetch);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [toReview, setToReview] = useState<number | undefined>(undefined);
  const [openNotification, setOpenNotification] = useState<Notification | null>(null);

  useEffect(() => {
    void fetchStations();
    void fetchNotifications();
  }, [fetchStations, fetchNotifications]);

  // Warm every sidebar destination so the first click does not wait for code.
  useEffect(() => {
    for (const item of groups.flatMap((g) => g.items)) router.prefetch(item.href);
  }, [groups, router]);

  useEffect(() => {
    if (user.role === 'SUPERADMIN' || !user.companyId) return;
    let live = true;
    api
      .get(`/companies/${user.companyId}`)
      .then((res) => live && setCompanyName(((res.data as { name?: string })?.name as string) ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user.role, user.companyId]);

  // Days at this station with a discrepancy nobody has signed off.
  const stationId = currentStation?.id;
  useEffect(() => {
    if (area !== 'company' || !stationId) return;
    let live = true;
    api
      .get(`/reconciliation/${stationId}`)
      .then((res) => {
        const rows = (Array.isArray(res.data) ? res.data : []) as Array<{
          status?: string;
          reviewed_at?: string | null;
        }>;
        if (live) setToReview(rows.filter((r) => r.status === 'discrepancy' && !r.reviewed_at).length);
      })
      .catch(() => live && setToReview(undefined));
    return () => {
      live = false;
    };
  }, [area, stationId, pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const page = activeItem(groups, pathname)?.label ?? '';
  const crumbs: Crumb[] =
    area === 'platform'
      ? [
          { label: 'Relai platform', href: '/admin' },
          { label: page || 'Overview' },
          ...(detail ? [{ label: detail }] : []),
        ]
      : [
          {
            label: user.role === 'SUPERADMIN' ? 'Relai platform' : (companyName ?? 'Company'),
            href: user.role === 'SUPERADMIN' ? '/admin' : undefined,
          },
          ...(currentStation ? [{ label: currentStation.name, href: '/dashboard' }] : []),
          { label: page || 'Overview' },
          ...(detail ? [{ label: detail }] : []),
        ];
  // The last crumb is the page; the ones before it are where it sits.
  if (detail && crumbs.length > 1)
    crumbs[crumbs.length - 2] = {
      ...crumbs[crumbs.length - 2],
      href: pathname.split('/').slice(0, -1).join('/') || undefined,
    };

  const sidebar = (onNavigate?: () => void) => (
    <Sidebar
      area={area}
      groups={groups}
      pathname={pathname}
      user={user}
      companyName={companyName}
      stations={stations.map((s) => ({ id: s.id, name: s.name }))}
      currentStationId={currentStation?.id}
      onStationChange={setCurrentStationById}
      counts={{
        review: toReview || undefined,
        unread: unreadCount(notifications) || undefined,
      }}
      onSignOut={onSignOut}
      onNavigate={onNavigate}
    />
  );

  const setCrumb = useCallback((label: string | null) => setDetail(label), []);

  return (
    <CrumbContext.Provider value={setCrumb}>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-3 py-2 text-14 font-semibold text-text focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="min-h-screen bg-bg">
        <aside className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar()}</aside>
        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          placement="left"
          closable={false}
          size="var(--size-sidebar-width)"
          classNames={{ body: 'p-0!', section: 'bg-sidebar-bg!' }}
          title={null}
        >
          {sidebar(() => setMenuOpen(false))}
        </Drawer>
        <div className="flex min-h-screen min-w-0 flex-col lg:pl-(--size-sidebar-width)">
          <TopBar
            crumbs={crumbs}
            searchPlaceholder={SEARCH_PLACEHOLDER[area]}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenNotification={setOpenNotification}
          />
          <main
            id="main"
            tabIndex={-1}
            className="flex min-w-0 flex-1 flex-col gap-6 px-4 pt-7 pb-10 outline-none md:px-8"
          >
            {children}
          </main>
        </div>
      </div>
      {searchOpen ? (
        <CommandPalette
          open
          onClose={() => setSearchOpen(false)}
          area={area}
          groups={groups}
          placeholder={SEARCH_PLACEHOLDER[area]}
        />
      ) : null}
      <NotificationDetailModal
        open={openNotification !== null}
        notification={openNotification}
        onClose={() => setOpenNotification(null)}
      />
    </CrumbContext.Provider>
  );
}
