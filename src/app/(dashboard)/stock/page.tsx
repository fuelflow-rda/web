'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Segmented, Select } from 'antd';
import { ChevronLeft, ChevronRight, ClipboardCheck, Truck } from 'lucide-react';
import { Banner, Button, PageHeader, Panel } from '@/components/ui';
import type { Paged } from '@/components/admin/data';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import {
  STOCK_PRODUCTS,
  getEntries,
  getLevels,
  stockName,
  type StockEntry,
  type StockKind,
  type StockProduct,
} from '@/components/stock/data';
import { CountDrawer, DeliveryDrawer, EntriesTable, LevelCard, RemoveEntryDrawer } from '@/components/stock/views';
import { cx } from '@/lib/cx';
import { formatMeter } from '@/lib/product-types';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

/** Rows per page, as the transactions list shows them. */
const PAGE = 12;

type Open =
  | { form: 'delivery'; product: StockProduct }
  | { form: 'count'; product: StockProduct }
  | { form: 'remove'; entry: StockEntry }
  | null;

export default function StockPage() {
  const { currentStation } = useStationStore();
  const role = useAuthStore((s) => s.user?.role);
  // The platform admin reads stock; recording and removing are the company's.
  const canRecord = role === 'ADMIN' || role === 'MANAGER';
  const stationId = currentStation?.id ?? null;

  const [product, setProduct] = useState<StockProduct | undefined>(undefined);
  const [kind, setKind] = useState<StockKind | 'all'>('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Open>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // A new station or filter goes back to the first page.
  const filterKey = JSON.stringify([stationId, product, kind]);
  const [lastKey, setLastKey] = useState(filterKey);
  if (filterKey !== lastKey) {
    setLastKey(filterKey);
    setPage(1);
  }

  const levels = usePolled(stationId, () => getLevels(stationId!), 60_000);

  // The history keeps the page on screen, dimmed, while the next one loads;
  // rows from another station are never shown.
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ key: string; station: string; data: Paged<StockEntry> } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const requestKey = JSON.stringify([filterKey, page, nonce]);
  useEffect(() => {
    if (!stationId) return;
    let live = true;
    getEntries(stationId, { product, kind: kind === 'all' ? undefined : kind, page, limit: PAGE })
      .then((data) => live && setResult({ key: requestKey, station: stationId, data }))
      .catch((err: Error) => live && setError({ key: requestKey, message: err.message }));
    return () => {
      live = false;
    };
  }, [stationId, product, kind, page, requestKey]);
  const shown = result?.station === stationId ? result.data : null;
  const failed = error?.key === requestKey;
  const loading = !failed && result?.key !== requestKey;
  const reloadEntries = () => setNonce((n) => n + 1);

  const products = levels.data?.products ?? [];
  const firstProduct = products[0]?.product ?? 'GASOLINE';
  // "Record stock count" starts on a product that still needs one.
  const toCount = products.find((p) => p.level === null)?.product ?? firstProduct;
  const rows = shown?.data ?? [];
  const total = shown?.pagination.total ?? 0;
  const first = total === 0 ? 0 : (page - 1) * PAGE + 1;
  const last = Math.min(page * PAGE, total);
  const filtered = Boolean(product) || kind !== 'all';

  const saved = (message: string) => {
    setOpen(null);
    setNotice(message);
    setPage(1);
    levels.reload();
    reloadEntries();
  };

  if (!stationId || !currentStation) {
    return <PageHeader title="Stock" description="Choose a station in the sidebar to see its stock." />;
  }

  return (
    <>
      <PageHeader
        title="Stock"
        description={`${currentStation.name} · fuel in the tanks and electricity for the chargers`}
        actions={
          canRecord ? (
            <>
              <Button icon={ClipboardCheck} onClick={() => setOpen({ form: 'count', product: toCount })}>
                Record stock count
              </Button>
              <Button kind="primary" icon={Truck} onClick={() => setOpen({ form: 'delivery', product: firstProduct })}>
                Record delivery
              </Button>
            </>
          ) : null
        }
      />

      {notice ? <Banner tone="success" title={notice} /> : null}
      {levels.error && levels.data ? (
        <Banner tone="warning" title="Showing the last levels received; the latest could not be loaded." />
      ) : null}

      {levels.error && !levels.data ? (
        <Panel title="Stock levels">
          <PanelError message="Stock levels could not be loaded." onRetry={levels.reload} />
        </Panel>
      ) : !levels.data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-67.5 animate-pulse rounded-card border border-border bg-surface motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Panel title="No stock recorded yet">
          <p className="m-0 text-14 text-text-secondary">
            A stock count sets the starting level. Deliveries are added to it as they arrive, and sales taken off.
          </p>
        </Panel>
      ) : (
        <section aria-labelledby="stock-levels" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <h2 id="stock-levels" className="sr-only">
            Stock levels
          </h2>
          {products.map((p) => (
            <LevelCard
              key={p.product}
              level={p}
              canRecord={canRecord}
              onCount={() => setOpen({ form: 'count', product: p.product })}
            />
          ))}
        </section>
      )}
      <p className="m-0 text-12 text-text-muted">
        Levels come from recorded sales. Anything dispensed without a recorded sale is not taken off here; it shows on
        the{' '}
        <Link href="/reconciliation" className="text-link no-underline hover:underline">
          Reconciliation
        </Link>{' '}
        page. A stock count corrects the level.
      </p>

      <Panel title="Deliveries and counts" meta="Newest first · times in Kigali" padded={false}>
        <div
          role="group"
          aria-label="Filter the history"
          className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-3"
        >
          <Select
            aria-label="Product"
            placeholder="All products"
            allowClear
            value={product}
            onChange={(v) => setProduct(v)}
            className="w-full sm:w-37.5"
            options={STOCK_PRODUCTS.map((p) => ({ value: p, label: stockName(p) }))}
          />
          <Segmented<StockKind | 'all'>
            aria-label="Type"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: 'All' },
              { value: 'delivery', label: 'Deliveries' },
              { value: 'count', label: 'Counts' },
            ]}
          />
        </div>
        {failed ? (
          <div className="p-5">
            <PanelError message="The history could not be loaded." onRetry={reloadEntries} />
          </div>
        ) : !shown ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">
            {filtered ? 'Nothing matches these filters.' : 'No deliveries or counts recorded yet.'}
          </p>
        ) : (
          <div className={cx('transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            <EntriesTable rows={rows} canRemove={canRecord} onRemove={(entry) => setOpen({ form: 'remove', entry })} />
          </div>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="m-0 text-13 text-text-secondary" aria-live="polite">
            {total === 0 ? 'No results' : `Showing ${num(first)} to ${num(last)} of ${num(total)}`}
          </p>
          <div className="flex gap-2">
            <Button icon={ChevronLeft} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              icon={ChevronRight}
              iconPlacement="end"
              disabled={last >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      </Panel>

      {open?.form === 'delivery' ? (
        <DeliveryDrawer
          stationId={stationId}
          product={open.product}
          onClose={() => setOpen(null)}
          onDone={(e) =>
            saved(`Delivery of ${formatMeter(e.quantity, e.unit)} of ${stockName(e.product).toLowerCase()} recorded.`)
          }
        />
      ) : null}
      {open?.form === 'count' ? (
        <CountDrawer
          stationId={stationId}
          product={open.product}
          onClose={() => setOpen(null)}
          onDone={(e) =>
            saved(`${stockName(e.product)} counted at ${formatMeter(e.quantity, e.unit)}. The level starts from there.`)
          }
        />
      ) : null}
      {open?.form === 'remove' ? (
        <RemoveEntryDrawer
          entry={open.entry}
          onClose={() => setOpen(null)}
          onDone={() =>
            saved(`The ${open.entry.kind === 'delivery' ? 'delivery' : 'count'} was removed and the level worked out again.`)
          }
        />
      ) : null}
    </>
  );
}
