'use client';

import { useEffect, useState } from 'react';
import { Segmented } from 'antd';
import { Plus } from 'lucide-react';
import { Banner, Button, PageHeader, Panel } from '@/components/ui';
import { PanelError } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { getPoints, type Point } from '@/components/pumps/data';
import {
  AddPointModal,
  EndMaintenanceModal,
  MaintenanceBanners,
  MaintenanceLogDrawer,
  PointCard,
  PumpReportDrawer,
  StartMaintenanceModal,
} from '@/components/pumps/views';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

type Show = 'all' | 'pump' | 'charger';

export default function PumpsPage() {
  const { currentStation } = useStationStore();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'ADMIN' || role === 'MANAGER';
  const canAdd = canManage || role === 'SUPERADMIN';
  const stationId = currentStation?.id ?? null;

  const points = usePolled(stationId, () => getPoints(stationId!), 30_000);
  const [show, setShow] = useState<Show>('all');
  const [now, setNow] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [starting, setStarting] = useState<Point | null>(null);
  const [ending, setEnding] = useState<Point | null>(null);
  const [report, setReport] = useState<Point | null>(null);
  const [log, setLog] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const all = [...(points.data ?? [])].sort(
    (a, b) => Number(a.kind === 'charger') - Number(b.kind === 'charger') || a.pump_number - b.pump_number,
  );
  const pumps = all.filter((p) => p.kind === 'pump');
  const chargers = all.filter((p) => p.kind === 'charger');
  const shown = show === 'all' ? all : show === 'pump' ? pumps : chargers;
  const done = () => {
    setAdding(false);
    setStarting(null);
    setEnding(null);
    points.reload();
  };

  if (!stationId) {
    return (
      <PageHeader
        title="Pumps and chargers"
        description="Choose a station in the sidebar to see its pumps and chargers."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Pumps and chargers"
        description={`${currentStation?.name} · ${pumps.length} ${pumps.length === 1 ? 'pump' : 'pumps'} and ${chargers.length} ${chargers.length === 1 ? 'charger' : 'chargers'} · live status`}
        actions={
          <>
            <Segmented<Show>
              aria-label="Show"
              value={show}
              onChange={setShow}
              options={[
                { value: 'all', label: `All ${all.length}` },
                { value: 'pump', label: `Pumps ${pumps.length}` },
                { value: 'charger', label: `Chargers ${chargers.length}` },
              ]}
            />
            {canAdd ? (
              <Button kind="primary" icon={Plus} onClick={() => setAdding(true)}>
                Add pump or charger
              </Button>
            ) : null}
          </>
        }
      />

      <MaintenanceBanners points={all} now={now} onLog={() => setLog(true)} />
      {points.error && points.data ? (
        <Banner tone="warning" title="Showing the last status received; the latest could not be loaded." />
      ) : null}

      {points.error && !points.data ? (
        <Panel title="Pumps and chargers">
          <PanelError message="Pumps and chargers could not be loaded." onRetry={points.reload} />
        </Panel>
      ) : !points.data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-67.5 animate-pulse rounded-card border border-border bg-surface motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Panel title={all.length ? 'Nothing to show' : 'No pumps or chargers yet'}>
          <p className="m-0 text-14 text-text-secondary">
            {all.length
              ? `This station has no ${show === 'pump' ? 'pumps' : 'chargers'}.`
              : 'Add the station’s pumps and chargers so attendants can record sales on them.'}
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <PointCard
              key={p.id}
              point={p}
              now={now}
              canManage={canManage}
              onReport={() => setReport(p)}
              onStart={() => setStarting(p)}
              onEnd={() => setEnding(p)}
              onLog={() => setLog(true)}
            />
          ))}
        </div>
      )}
      <p className="m-0 text-12 text-text-muted">
        Status comes from what is recorded: in use or charging means a sale in the last 10 minutes during an open shift.
        Totaliser is the last meter reading an attendant entered.
      </p>

      <AddPointModal stationId={stationId} open={adding} onClose={() => setAdding(false)} onDone={done} />
      <StartMaintenanceModal point={starting} onClose={() => setStarting(null)} onDone={done} />
      <EndMaintenanceModal point={ending} onClose={() => setEnding(null)} onDone={done} />
      <MaintenanceLogDrawer stationId={stationId} open={log} onClose={() => setLog(false)} />
      <PumpReportDrawer point={report} onClose={() => setReport(null)} />
    </>
  );
}
