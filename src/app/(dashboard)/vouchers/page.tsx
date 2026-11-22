'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from 'antd';
import { BadgePercent, CalendarClock, Plus, ReceiptText, Search, Ticket } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, KpiTile, PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { batchValue, listBatches } from '@/components/vouchers/types';
import { BATCH_STATE, BatchesTable, CreateBatchDrawer, dayLabel } from '@/components/vouchers/views';
import { useAuthStore } from '@/store/auth-store';

export default function VouchersPage() {
  return (
    <Suspense>
      <VouchersView />
    </Suspense>
  );
}

/** Voucher batches (Pencil "Web / Vouchers"): prepaid coupons and promo vouchers. */
function VouchersView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const list = usePolled(user?.companyId ?? 'company', () => listBatches(), 60_000);
  const all = list.data?.data ?? [];
  const term = search.trim().toLowerCase();
  const rows = all.filter((b) => (!kind || b.kind === kind) && (!term || [b.name, b.customer?.name].some((v) => (v ?? '').toLowerCase().includes(term))));
  const t = list.data?.totals;
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Africa/Kigali' }).format(new Date()).toUpperCase();

  return (
    <>
      <PageHeader
        title="Vouchers"
        description="Prepaid coupons for institutions and promo vouchers · each code works once, at any station of the company"
        actions={
          <>
            <ExportButton
              filename="voucher-batches"
              data={all.map((b) => ({
                name: b.name,
                for: b.customer?.name ?? 'Anyone',
                kind: b.kind,
                value: batchValue(b),
                used: `${b.used} / ${b.count}`,
                left: b.kind === 'prepaid' ? b.value_left : '',
                expires: b.expires_on,
                status: BATCH_STATE[b.state].label,
              }))}
              columns={[
                { header: 'Batch', key: 'name' },
                { header: 'For', key: 'for' },
                { header: 'Kind', key: 'kind' },
                { header: 'Value', key: 'value' },
                { header: 'Used', key: 'used' },
                { header: 'Value left (RWF)', key: 'left' },
                { header: 'Expires', key: 'expires' },
                { header: 'Status', key: 'status' },
              ]}
            />
            {canManage ? (
              <Button kind="primary" icon={Plus} onClick={() => setCreating(true)}>
                Create batch
              </Button>
            ) : null}
          </>
        }
      />
      {notice ? <Banner tone="success" title={notice} /> : null}

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Prepaid outstanding" icon={Ticket} prefix="RWF" value={t ? num(t.prepaid_outstanding) : '…'} delta={{ text: t ? `${num(t.prepaid_outstanding_count)} vouchers paid for, not yet used` : '…', direction: 'flat' }} />
        <KpiTile label={`Used · ${month}`} icon={ReceiptText} value={t ? num(t.used_month) : '…'} delta={{ text: t ? `RWF ${num(t.used_month_prepaid_value)} of prepaid value` : '…', direction: 'flat' }} />
        <KpiTile label={`Promo discounts · ${month}`} icon={BadgePercent} prefix="RWF" value={t ? num(t.promo_discount_month) : '…'} delta={{ text: 'Taken off sales by promo vouchers', direction: 'flat' }} />
        <KpiTile label="Expiring in 30 days" icon={CalendarClock} value={t ? num(t.expiring_30) : '…'} delta={{ text: t ? `RWF ${num(t.expiring_30_value)} of prepaid value` : '…', direction: 'flat' }} />
      </section>

      <div role="search" aria-label="Filter batches" className="flex flex-wrap items-center gap-3">
        <Input aria-label="Search batches" prefix={<Search size={16} aria-hidden className="text-text-muted" />} placeholder="Search batch or customer" value={search} onChange={(e) => setSearch(e.target.value)} allowClear className="w-80" />
        <Select aria-label="Kind" value={kind} onChange={setKind} className="w-44" options={[{ value: '', label: 'All kinds' }, { value: 'prepaid', label: 'Prepaid' }, { value: 'promo', label: 'Promo' }]} />
      </div>

      <Panel title="Batches" meta={list.data ? `${rows.length} of ${all.length}` : undefined} padded={false}>
        {list.error && !list.data ? (
          <div className="p-5">
            <PanelError message="Vouchers could not be loaded." onRetry={list.reload} />
          </div>
        ) : !list.data ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-14 text-text-secondary">
            {all.length ? 'No batch matches.' : canManage ? 'No vouchers yet. Create a batch for an institution that pays in advance, or a promotion.' : 'No vouchers yet.'}
          </p>
        ) : (
          <BatchesTable rows={rows} onOpen={(b) => router.push(`/vouchers/${b.id}`)} />
        )}
      </Panel>
      <p className="m-0 text-12 text-text-muted">An expired batch can be extended from its page; its unused vouchers then work again.</p>

      <CreateBatchDrawer
        open={creating}
        onClose={() => setCreating(false)}
        onDone={(b) => {
          setCreating(false);
          setNotice(`${b.count} vouchers created, valid until ${dayLabel(b.expires_on)}. Print the sheet from the batch page.`);
          router.push(`/vouchers/${b.id}`);
        }}
      />
    </>
  );
}
