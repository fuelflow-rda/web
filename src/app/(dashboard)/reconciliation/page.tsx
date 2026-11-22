'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, DatePicker, Tabs } from 'antd';
import dayjs from 'dayjs';
import { CalendarDays, CheckCheck, ChevronDown, Fuel, Gauge, Receipt, RefreshCw, TriangleAlert } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, KpiTile, PageHeader, Panel } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { AttendantTable, PaymentTable, PumpTable, ResolvePanel, ShiftPanel } from '@/components/reconciliation/views';
import {
  decide,
  generateReport,
  getPumpShifts,
  getReport,
  latestReportDate,
  markReviewed,
  type PumpShifts,
  type Report,
} from '@/components/reconciliation/types';
import { cx } from '@/lib/cx';
import { formatMeter, pointLabel, productName } from '@/lib/product-types';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';
import { fullDate } from '@/lib/dates';

const isDay = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** Reports are per UTC day, as the nightly job builds them. */
const yesterdayUtc = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const longDate = (d: string) => fullDate(new Date(`${d}T12:00:00Z`), 'UTC');
const at = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' }).format(
    new Date(iso),
  );
const whenFull = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));

export default function ReconciliationPage() {
  return (
    <Suspense>
      <ReconciliationView />
    </Suspense>
  );
}

function ReconciliationView() {
  const { modal } = App.useApp();
  const router = useRouter();
  const params = useSearchParams();
  const { currentStation } = useStationStore();
  const role = useAuthStore((s) => s.user?.role);
  // The platform admin reads reports too, but building, deciding and signing
  // off are the company's (the API refuses them).
  const canDecide = role === 'ADMIN' || role === 'MANAGER';
  const stationId = currentStation?.id ?? null;

  const asked = params.get('date');
  const [date, setDate] = useState<string | null>(isDay(asked) ? asked : null);
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'generate' | 'review' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [shifts, setShifts] = useState<{ key: string; data: PumpShifts | null; error: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);

  // With no date asked for, open the latest report there is.
  useEffect(() => {
    if (!stationId || date) return;
    latestReportDate(stationId)
      .then((d) => setDate(d ?? yesterdayUtc()))
      .catch(() => setDate(yesterdayUtc()));
  }, [stationId, date]);

  const reportKey = stationId && date ? `${stationId}|${date}|${nonce}` : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!reportKey || !stationId || !date) return;
    let live = true;
    getReport(stationId, date)
      .then((r) => {
        if (!live) return;
        setReport(r);
        setError(null);
      })
      .catch((err: Error) => live && setError(err.message))
      .finally(() => live && setLoadedKey(reportKey));
    return () => {
      live = false;
    };
  }, [reportKey, stationId, date]);
  const loading = loadedKey !== reportKey;

  // The pump in focus: the one asked for, else the first that needs review.
  const line = useMemo(() => {
    const lines = report?.pumpBreakdown ?? [];
    return lines.find((l) => l.pumpId === selected) ?? lines.find((l) => l.outcome === 'review') ?? lines[0] ?? null;
  }, [report, selected]);

  const shiftKey = stationId && date && line ? `${stationId}|${date}|${line.pumpId}|${report?.generatedAt}` : null;
  useEffect(() => {
    if (!shiftKey || !stationId || !date || !line) return;
    let live = true;
    getPumpShifts(stationId, date, line.pumpId)
      .then((data) => live && setShifts({ key: shiftKey, data, error: null }))
      .catch((err: Error) => live && setShifts({ key: shiftKey, data: null, error: err.message }));
    return () => {
      live = false;
    };
  }, [shiftKey, stationId, date, line]);
  const shiftData = shifts?.key === shiftKey ? shifts : null;

  const pickDate = (d: string) => {
    setDate(d);
    setSelected(null);
    router.replace(`/reconciliation?date=${d}`);
  };

  const run = useCallback(
    async (what: 'generate' | 'review') => {
      if (!stationId || !date) return;
      setBusy(what);
      setActionError(null);
      try {
        setReport(what === 'generate' ? await generateReport(stationId, date) : await markReviewed(stationId, date));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'That did not work. Try again.');
      } finally {
        setBusy(null);
      }
    },
    [stationId, date],
  );

  const confirmReview = () => {
    if (!report) return;
    if (report.unresolvedCount === 0) return void run('review');
    modal.confirm({
      title: 'Mark the day reviewed?',
      content: `${report.unresolvedCount} ${report.unresolvedCount === 1 ? 'line still has' : 'lines still have'} no decision. The audit log will say the day was signed off with ${report.unresolvedCount === 1 ? 'it' : 'them'} open.`,
      okText: 'Mark reviewed',
      cancelText: 'Go back',
      onOk: () => run('review'),
    });
  };

  const exportRows = (report?.pumpBreakdown ?? []).map((l) => ({
    pump: `${pointLabel(l.pumpNumber, l.productType)} · ${productName(l.productType)}`,
    opening: l.openingReading ?? '',
    closing: l.closingReading ?? '',
    metered: l.meteredQuantity === null ? '' : formatMeter(l.meteredQuantity, l.unit),
    recorded: formatMeter(l.quantity, l.unit),
    variance: l.volumeDifference === null ? '' : formatMeter(l.volumeDifference, l.unit),
    expected: l.expectedRevenue,
    difference: l.difference,
    status: l.outcome === 'review' ? 'Review' : l.outcome === 'matched' ? 'Matched' : 'Offline',
    decision: l.resolution
      ? `${l.resolution.decision === 'explained' ? 'Explained' : 'Flagged'}: ${l.resolution.note} (${l.resolution.decidedBy.name ?? ''})`
      : '',
  }));

  if (!stationId) {
    return (
      <PageHeader title="Reconciliation" description="Choose a station in the sidebar to see its reconciliation." />
    );
  }

  const description = (
    <>
      {currentStation?.name} · {date ? longDate(date) : '…'}
      {report?.generatedAt ? ` · generated at ${at(report.generatedAt)}` : ''}
      {report && canDecide ? (
        <>
          {' · '}
          <button
            type="button"
            onClick={() => run('generate')}
            disabled={busy !== null}
            className={cx(
              'inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-14 font-medium text-link hover:underline disabled:opacity-50',
              focusRing,
            )}
          >
            <RefreshCw size={13} aria-hidden className={busy === 'generate' ? 'animate-spin' : undefined} />
            Recalculate
          </button>
        </>
      ) : null}
    </>
  );

  return (
    <>
      <PageHeader
        title="Reconciliation"
        description={description}
        actions={
          <>
            <DatePicker
              aria-label="Day"
              value={date ? dayjs(date) : null}
              onChange={(v) => v && pickDate(v.format('YYYY-MM-DD'))}
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
              format="ddd D MMM YYYY"
              allowClear={false}
              prefix={<CalendarDays size={16} aria-hidden className="text-text-muted" />}
              suffix={<ChevronDown size={16} aria-hidden />}
              className="w-52.5"
            />
            <ExportButton
              data={exportRows}
              filename={`${currentStation?.name ?? 'station'}-reconciliation-${date ?? ''}`}
              columns={[
                { header: 'Pump', key: 'pump' },
                { header: 'Opening', key: 'opening' },
                { header: 'Closing', key: 'closing' },
                { header: 'Metered', key: 'metered' },
                { header: 'Recorded', key: 'recorded' },
                { header: 'Variance', key: 'variance' },
                { header: 'Expected (RWF)', key: 'expected' },
                { header: 'Difference (RWF)', key: 'difference' },
                { header: 'Status', key: 'status' },
                { header: 'Decision', key: 'decision' },
              ]}
            />
            {canDecide && report && !report.reviewedAt ? (
              <Button kind="primary" icon={CheckCheck} onClick={confirmReview} loading={busy === 'review'}>
                Mark day reviewed
              </Button>
            ) : null}
          </>
        }
      />

      {actionError ? <Banner tone="danger" title={actionError} /> : null}
      {report?.reviewedAt ? (
        <Banner
          tone="success"
          title={`Reviewed by ${report.reviewedBy?.name ?? 'a manager'} on ${whenFull(report.reviewedAt)}`}
        >
          If late sales or readings change the figures, the review is cleared and the day needs another look.
        </Banner>
      ) : null}

      {error && report === undefined ? (
        <Panel title="Reconciliation">
          <PanelError message="The report could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
        </Panel>
      ) : loading && report === undefined ? (
        <PanelSkeleton rows={6} />
      ) : !report ? (
        <Panel title="No report for this day yet">
          <div className="flex flex-col items-start gap-4">
            <p className="m-0 text-14 text-text-secondary">
              Reports are built each night for every station that sold anything.{' '}
              {canDecide
                ? 'You can build this one now.'
                : "The station's manager or a company admin can build this one now."}
            </p>
            {canDecide ? (
              <Button kind="primary" icon={RefreshCw} onClick={() => run('generate')} loading={busy === 'generate'}>
                Generate report
              </Button>
            ) : null}
          </div>
        </Panel>
      ) : (
        <>
          <section
            aria-label="Key figures"
            className={cx('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', loading && 'opacity-60')}
          >
            <KpiTile
              label="Expected revenue"
              icon={Gauge}
              prefix="RWF"
              value={num(report.expectedRevenue)}
              delta={{
                text:
                  report.expectedBasis === 'metered'
                    ? 'Metered volume × price in force'
                    : report.expectedBasis === 'mixed'
                      ? 'Metered where readings are complete'
                      : 'Recorded sales: meter readings incomplete',
                direction: 'flat',
              }}
            />
            <KpiTile
              label="Recorded revenue"
              icon={Receipt}
              prefix="RWF"
              value={num(report.recordedRevenue)}
              delta={{
                text: `${num(report.totalTransactions)} sales${report.shiftCount !== null ? ` across ${report.shiftCount} ${report.shiftCount === 1 ? 'shift' : 'shifts'}` : ''}`,
                direction: 'flat',
              }}
            />
            <KpiTile
              label="Difference"
              icon={TriangleAlert}
              valueTone={report.difference < 0 ? 'danger' : undefined}
              prefix="RWF"
              value={`${report.difference < 0 ? '−' : report.difference > 0 ? '+' : ''}${num(Math.abs(report.difference))}`}
              delta={{
                text: report.expectedRevenue
                  ? `${Math.abs((report.difference / report.expectedRevenue) * 100).toFixed(2)}% of expected`
                  : 'Nothing expected',
                direction: report.difference < 0 ? 'down' : report.difference > 0 ? 'up' : 'flat',
                good: report.difference >= 0,
              }}
            />
            <KpiTile
              label="Meter variance"
              icon={Fuel}
              value={`${report.volumeDifference.liters < 0 ? '−' : report.volumeDifference.liters > 0 ? '+' : ''}${Math.abs(report.volumeDifference.liters).toFixed(1)}`}
              suffix="L"
              delta={{
                text: `Tolerance ±${report.tolerance} L per pump${report.volumeDifference.kwh ? ` · ${formatMeter(report.volumeDifference.kwh, 'KWH')}` : ''}`,
                direction: 'flat',
              }}
            />
          </section>

          <Tabs
            className="[&_.ant-tabs-nav]:mb-6! [&_.ant-tabs-tab-active]:font-semibold"
            items={[
              {
                key: 'pump',
                label: 'By pump',
                children: <PumpTable report={report} selected={line?.pumpId ?? null} onSelect={setSelected} />,
              },
              { key: 'attendant', label: 'By attendant', children: <AttendantTable report={report} /> },
              { key: 'payment', label: 'By payment', children: <PaymentTable report={report} /> },
            ]}
          />

          {line ? (
            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <ShiftPanel
                line={line}
                data={shiftData?.data ?? null}
                loading={!shiftData}
                error={shiftData?.error ?? null}
                onRetry={() => setShifts(null)}
              />
              <ResolvePanel
                key={line.pumpId}
                line={line}
                decisions={report.decisions}
                shifts={shiftData?.data ?? null}
                canDecide={canDecide}
                onDecide={async (body) => {
                  await decide(stationId, report.date, { pump_id: line.pumpId, ...body });
                  setNonce((n) => n + 1);
                }}
              />
            </div>
          ) : null}
          <p className="m-0 text-12 text-text-muted">
            Amounts are in RWF. A report day runs from 02:00 to 02:00 Kigali time, as the nightly report counts it.
          </p>
        </>
      )}
    </>
  );
}
