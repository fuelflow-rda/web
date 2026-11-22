'use client';

import { useRef, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import {
  cancelScheduled,
  getCurrent,
  getHistory,
  setPrice,
  updateScheduled,
  type PriceRow,
} from '@/components/prices/data';
import { HistoryTable, PriceCard, ScheduledBanner, SchedulePanel, type Draft } from '@/components/prices/views';
import { kigaliWindow } from '@/lib/kigali';
import { PRODUCT_TYPES, productName } from '@/lib/product-types';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

export default function PricesPage() {
  const { currentStation } = useStationStore();
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const stationId = currentStation?.id ?? null;

  const current = usePolled(stationId, () => getCurrent(stationId!), 60_000);
  const history = usePolled(stationId, () => getHistory(stationId!, kigaliWindow({ days: 90 }).from), 120_000);
  const [draft, setDraft] = useState<Draft>({ editing: null, product: 'GASOLINE' });
  // No card is marked until someone picks one, as the design shows the page at rest.
  const [picked, setPicked] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const prices = current.data?.prices ?? {};
  const priced = PRODUCT_TYPES.filter((p) => prices[p]);
  const scheduled = current.data?.scheduled ?? [];

  const focusPanel = (next: Draft) => {
    setDraft(next);
    setPanelKey((k) => k + 1);
    window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      panelRef.current?.querySelector<HTMLElement>('input:not([disabled])')?.focus();
    });
  };

  const done = (message?: string) => {
    if (message) setNotice(message);
    setPicked(false);
    setDraft((d) => ({ editing: null, product: d.product }));
    setPanelKey((k) => k + 1);
    current.reload();
    history.reload();
  };

  if (!stationId || !currentStation) {
    return <PageHeader title="Prices" description="Choose a station in the sidebar to see its prices." />;
  }

  return (
    <>
      <PageHeader
        title="Prices"
        description={`${currentStation.name} · every sale keeps the price that was in force when it was recorded`}
        actions={
          canEdit ? (
            <Button
              kind="primary"
              icon={CalendarClock}
              onClick={() => focusPanel({ editing: null, product: draft.product })}
            >
              Schedule a change
            </Button>
          ) : null
        }
      />

      {notice ? <Banner tone="success" title={notice} /> : null}
      {scheduled.map((c) => (
        <ScheduledBanner key={c.id} change={c} onEdit={() => focusPanel({ editing: c, product: c.product_type })} />
      ))}

      {current.error && !current.data ? (
        <Panel title="Prices">
          <PanelError message="Prices could not be loaded." onRetry={current.reload} />
        </Panel>
      ) : !current.data ? (
        <PanelSkeleton rows={3} />
      ) : priced.length === 0 ? (
        <Panel title="No prices yet">
          <p className="m-0 text-14 text-text-secondary">
            Set a price for each product the station sells before attendants record sales.
          </p>
        </Panel>
      ) : (
        <section
          aria-label="Current prices"
          className="grid grid-cols-[repeat(auto-fit,minmax(12.5rem,1fr))] gap-4"
        >
          {priced.map((p) => (
            <PriceCard
              key={p}
              product={p}
              row={prices[p] as PriceRow}
              selected={picked && !draft.editing && draft.product === p}
              editable={canEdit}
              onPick={() => {
                setPicked(true);
                focusPanel({ editing: null, product: p });
              }}
            />
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title="Price history"
          meta="Last 90 days"
          padded={false}
          extra={
            <ExportButton
              filename={`${currentStation.name}-price-history`}
              data={(history.data ?? []).map((r) => ({
                date: r.effective_at.slice(0, 16).replace('T', ' '),
                product: productName(r.product_type),
                old: r.previous_price ?? '',
                new: r.price_per_unit,
                change: r.change ?? '',
                by: r.users?.name ?? '',
              }))}
              columns={[
                { header: 'Effective (UTC)', key: 'date' },
                { header: 'Product', key: 'product' },
                { header: 'Old (RWF)', key: 'old' },
                { header: 'New (RWF)', key: 'new' },
                { header: 'Change', key: 'change' },
                { header: 'Changed by', key: 'by' },
              ]}
            />
          }
        >
          {history.error && !history.data ? (
            <div className="p-5">
              <PanelError message="The history could not be loaded." onRetry={history.reload} />
            </div>
          ) : !history.data ? (
            <div className="p-5">
              <PanelSkeleton rows={5} />
            </div>
          ) : (
            <HistoryTable rows={history.data} />
          )}
        </Panel>
        <div ref={panelRef}>
          <SchedulePanel
            key={panelKey}
            draft={draft}
            current={prices}
            canEdit={canEdit}
            onProduct={(product) => {
              setPicked(true);
              setDraft({ editing: null, product });
            }}
            onSave={async ({ product, price, effectiveAt }) => {
              if (draft.editing) {
                await updateScheduled(draft.editing.id, {
                  price_per_unit: price,
                  effective_at: effectiveAt ?? undefined,
                });
                setNotice(`${productName(product)} change updated.`);
              } else {
                await setPrice({
                  station_id: stationId,
                  product_type: product,
                  price_per_unit: price,
                  ...(effectiveAt ? { effective_at: effectiveAt } : {}),
                });
                setNotice(
                  effectiveAt ? `${productName(product)} change scheduled.` : `${productName(product)} price changed.`,
                );
              }
            }}
            onCancelChange={async (row) => {
              await cancelScheduled(row.id);
              setNotice(`The ${productName(row.product_type)} change is cancelled; the current price stays.`);
            }}
            onDone={() => done()}
          />
        </div>
      </div>
    </>
  );
}
