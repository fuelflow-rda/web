'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { getRoster, type RosterRow } from '@/components/attendants/data';
import {
  AddAttendantDrawer,
  AttendantDrawer,
  RosterTable,
  shiftLabel,
  varianceLabel,
} from '@/components/attendants/views';
import { formatRwandaPhone } from '@/lib/phone';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

const ORDER: Record<RosterRow['status'], number> = { on_shift: 0, pin_locked: 1, off_shift: 2, deactivated: 3 };

export default function AttendantsPage() {
  return (
    <Suspense>
      <AttendantsView />
    </Suspense>
  );
}

function AttendantsView() {
  const router = useRouter();
  const params = useSearchParams();
  const { currentStation } = useStationStore();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'ADMIN' || role === 'MANAGER' || role === 'SUPERADMIN';
  const stationId = currentStation?.id ?? null;
  const roster = usePolled(stationId, () => getRoster(stationId!), 30_000);

  const search = (params.get('search') ?? '').trim().toLowerCase();
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(() => params.get('attendant'));
  const [notice, setNotice] = useState<string | null>(null);

  const all = [...(roster.data ?? [])].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name),
  );
  const rows = search
    ? all.filter(
        (r) => r.name.toLowerCase().includes(search) || (r.phone ?? '').includes(search.replace(/\D/g, '') || '\u0000'),
      )
    : all;
  const onShift = all.filter((r) => r.status === 'on_shift').length;
  const open = all.find((r) => r.id === openId) ?? null;

  const changed = (message: string) => {
    setNotice(message);
    roster.reload();
  };

  if (!stationId || !currentStation) {
    return <PageHeader title="Attendants" description="Choose a station in the sidebar to see its attendants." />;
  }

  return (
    <>
      <PageHeader
        title="Attendants"
        description={`${currentStation.name} · ${all.length} ${all.length === 1 ? 'attendant' : 'attendants'} · they sign in on the app with a phone number and PIN`}
        actions={
          <>
            <ExportButton
              filename={`${currentStation.name}-attendants`}
              data={all.map((r) => ({
                name: r.name,
                phone: formatRwandaPhone(r.phone),
                status: r.status.replace('_', ' '),
                shift: shiftLabel(r),
                sales: r.salesToday,
                revenue: r.revenueToday,
                variance: varianceLabel(r.varianceWeek),
              }))}
              columns={[
                { header: 'Attendant', key: 'name' },
                { header: 'Phone', key: 'phone' },
                { header: 'Status', key: 'status' },
                { header: 'Current or last shift', key: 'shift' },
                { header: 'Sales today', key: 'sales' },
                { header: 'Revenue today (RWF)', key: 'revenue' },
                { header: '7-day variance', key: 'variance' },
              ]}
            />
            {canManage ? (
              <Button kind="primary" icon={UserPlus} onClick={() => setAdding(true)}>
                Add attendant
              </Button>
            ) : null}
          </>
        }
      />

      {notice ? <Banner tone="success" title={notice} /> : null}
      {search ? (
        <Banner
          tone="info"
          title={`Showing attendants matching “${params.get('search')}”`}
          action={{ label: 'Show all', onClick: () => router.replace('/attendants') }}
        />
      ) : null}

      <Panel title="Team" meta={roster.data ? `${onShift} on shift now` : undefined} padded={false}>
        {roster.error && !roster.data ? (
          <div className="p-5">
            <PanelError message="Attendants could not be loaded." onRetry={roster.reload} />
          </div>
        ) : !roster.data ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-14 text-text-secondary">
            {all.length
              ? 'Nobody matches that search.'
              : 'No attendants yet. Add the people who will record sales on the app.'}
          </p>
        ) : (
          <RosterTable rows={rows} onOpen={(r) => setOpenId(r.id)} />
        )}
      </Panel>
      <p className="m-0 text-12 text-text-muted">
        Attendants only use the mobile app. They cannot open this dashboard, and a locked PIN can only be reset by a
        manager.
      </p>

      <AddAttendantDrawer
        open={adding}
        station={{ id: currentStation.id, name: currentStation.name, companyId: currentStation.companyId }}
        onClose={() => setAdding(false)}
        onDone={(name) => {
          setAdding(false);
          changed(`${name} is added. Give them their PIN in person.`);
        }}
      />
      <AttendantDrawer
        row={open}
        stationId={stationId}
        canManage={canManage}
        onClose={() => setOpenId(null)}
        onChanged={changed}
      />
    </>
  );
}
