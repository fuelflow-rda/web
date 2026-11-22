'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Select } from 'antd';
import { Ban, CalendarPlus, ChevronLeft, ChevronRight, Hourglass, Printer, ReceiptText, Search, Ticket } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, KpiTile, PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton, num, rwf } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { useShellCrumb } from '@/components/shell/AppShell';
import api from '@/lib/api';
import { printVoucherSheet } from '@/components/customers/print';
import { batchValue, getBatch, voidUnused, voidVoucher, type Voucher } from '@/components/vouchers/types';
import { BATCH_STATE, ExtendDrawer, KindChip, VoidDrawer, VouchersTable, dayLabel } from '@/components/vouchers/views';
import { useAuthStore } from '@/store/auth-store';

const PAGE = 25;

export default function BatchPage() {
  return (
    <Suspense>
      <BatchView />
    </Suspense>
  );
}

/** One voucher batch (Pencil "Web / Voucher batch"): what it is worth, and where each code went. */
function BatchView() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN';
  const batch = usePolled(id, () => getBatch(id), 60_000);
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [panel, setPanel] = useState<'extend' | 'void-all' | null>(null);
  const [voiding, setVoiding] = useState<Voucher | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [page, setPage] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const b = batch.data;
  useShellCrumb(b?.name);

  useEffect(() => {
    if (!user?.companyId) return;
    let live = true;
    api
      .get(`/companies/${user.companyId}`)
      .then((r) => live && setCompanyName(String((r.data as { name?: string }).name ?? '')))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user?.companyId]);

  if (batch.error && !b) {
    return (
      <>
        <PageHeader title="Voucher batch" />
        <Panel title="Vouchers">
          <PanelError message="This batch could not be loaded." onRetry={batch.reload} />
        </Panel>
      </>
    );
  }
  if (!b) return <PanelSkeleton rows={8} />;

  const done = (message: string) => {
    setNotice(message);
    setFailure(null);
    setPanel(null);
    setVoiding(null);
    batch.reload();
  };
  const term = search.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Used and voided first, newest first: those are what people come to look up.
  const rank = (v: Voucher) => (v.status === 'unused' ? 1 : 0);
  const when = (v: Voucher) => v.used_at ?? v.voided_at ?? '';
  const vouchers = b.vouchers
    .filter((v) => (!status || v.status === status) && (!term || v.code.replace('-', '').includes(term)))
    .sort((x, y) => rank(x) - rank(y) || when(y).localeCompare(when(x)) || x.code.localeCompare(y.code));
  const pages = Math.max(1, Math.ceil(vouchers.length / PAGE));
  const current = Math.min(page, pages);
  const shown = vouchers.slice((current - 1) * PAGE, current * PAGE);
  const unusedCodes = b.vouchers.filter((v) => v.status === 'unused').map((v) => v.code);
  const print = async () => {
    setPrinting(true);
    try {
      await printVoucherSheet({
        companyName: companyName || 'Fuel station',
        name: b.name,
        kind: b.kind,
        valueText: b.kind === 'prepaid' ? rwf(Number(b.face_value)) : b.discount_per_unit ? `${b.discount_per_unit} RWF off per litre` : `${rwf(Number(b.discount_fixed))} off`,
        expiresOn: b.expires_on,
        forName: b.customer?.name ?? null,
        codes: unusedCodes,
      });
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The sheet could not be printed.');
    } finally {
      setPrinting(false);
    }
  };
  const s = BATCH_STATE[b.state];

  return (
    <>
      <PageHeader
        title={b.name}
        description={`${b.kind === 'prepaid' ? 'Prepaid' : 'Promo'} · ${batchValue(b)} · ${num(b.count)} vouchers · ${b.state === 'expired' ? 'expired' : 'expires'} ${dayLabel(b.expires_on)}`}
        actions={
          <>
            <ExportButton
              label="Export list"
              filename={`vouchers-${b.name}`}
              data={b.vouchers.map((v) => ({ code: v.code, status: v.status, station: v.station ?? '', used_at: v.used_at ?? '', sale: v.sale?.total_amount ?? '', paid: v.amount_applied ?? '' }))}
              columns={[
                { header: 'Code', key: 'code' },
                { header: 'Status', key: 'status' },
                { header: 'Station', key: 'station' },
                { header: 'Used at', key: 'used_at' },
                { header: 'Sale (RWF)', key: 'sale' },
                { header: 'Voucher paid (RWF)', key: 'paid' },
              ]}
            />
            {canManage ? (
              <>
                <Button icon={CalendarPlus} onClick={() => setPanel('extend')}>
                  Extend expiry
                </Button>
                <Button icon={Ban} onClick={() => setPanel('void-all')} disabled={!b.unused}>
                  Void unused
                </Button>
              </>
            ) : null}
            <Button kind="primary" icon={Printer} onClick={print} loading={printing} disabled={!unusedCodes.length}>
              Print sheet
            </Button>
          </>
        }
      />
      {notice ? <Banner tone="success" title={notice} /> : null}
      {failure ? <Banner tone="danger" title={failure} /> : null}
      {b.state === 'expired' && b.unused ? (
        <Banner tone="warning" title={`This batch expired on ${dayLabel(b.expires_on)}`} action={canManage ? { label: 'Extend expiry', onClick: () => setPanel('extend') } : undefined}>
          Its {num(b.unused)} unused vouchers are refused at the pump until the batch is extended.
        </Banner>
      ) : null}

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={b.kind === 'prepaid' ? 'Prepaid value' : 'Discount'}
          icon={Ticket}
          prefix={b.kind === 'prepaid' ? 'RWF' : undefined}
          value={b.kind === 'prepaid' ? num(Number(b.value)) : batchValue(b)}
          delta={{ text: b.kind === 'prepaid' ? `${num(b.count)} × ${rwf(Number(b.face_value))}${b.payment_reference ? `, ${b.payment_reference}` : ''}` : 'Off one sale per voucher', direction: 'flat' }}
        />
        <KpiTile label="Used" icon={ReceiptText} value={num(b.used)} delta={{ text: `RWF ${num(b.used_value)} ${b.kind === 'prepaid' ? 'paid' : 'off'}`, direction: 'flat' }} />
        <KpiTile label="Left" icon={Hourglass} value={num(b.unused)} delta={{ text: b.kind === 'prepaid' ? `RWF ${num(b.state === 'expired' ? b.expired_value : b.value_left)} ${b.state === 'expired' ? 'expired' : `until ${dayLabel(b.expires_on)}`}` : `Until ${dayLabel(b.expires_on)}`, direction: 'flat' }} />
        <KpiTile label="Voided" icon={Ban} value={num(b.voided)} delta={{ text: s.label, direction: 'flat' }} />
      </section>

      <div role="search" aria-label="Filter vouchers" className="flex flex-wrap items-center gap-3">
        <Input aria-label="Search code" prefix={<Search size={16} aria-hidden className="text-text-muted" />} placeholder="Search code" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} allowClear className="w-80" />
        <Select aria-label="Status" value={status} onChange={(v) => (setStatus(v), setPage(1))} className="w-44" options={[{ value: '', label: 'All statuses' }, { value: 'unused', label: 'Unused' }, { value: 'used', label: 'Used' }, { value: 'voided', label: 'Voided' }]} />
        <span className="ml-auto">
          <KindChip kind={b.kind} />
        </span>
      </div>

      <Panel title="Vouchers" meta={`${vouchers.length} of ${b.vouchers.length}${b.customer?.name ? ` · for ${b.customer.name}` : ''}`} padded={false}>
        <VouchersTable vouchers={shown} canManage={canManage} onVoid={setVoiding} now={now} />
        {vouchers.length > PAGE ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <p className="m-0 text-13 text-text-secondary" aria-live="polite">
              Showing {num((current - 1) * PAGE + 1)} to {num(Math.min(current * PAGE, vouchers.length))} of {num(vouchers.length)}
            </p>
            <div className="flex gap-2">
              <Button icon={ChevronLeft} disabled={current <= 1} onClick={() => setPage(current - 1)}>
                Previous
              </Button>
              <Button icon={ChevronRight} disabled={current >= pages} onClick={() => setPage(current + 1)}>
                Next
              </Button>
            </div>
          </footer>
        ) : null}
      </Panel>

      {canManage ? (
        <>
          {panel === 'extend' ? <ExtendDrawer batch={b} open onClose={() => setPanel(null)} onDone={(x) => done(`Extended to ${dayLabel(x.expires_on)}.`)} /> : null}
          <VoidDrawer
            open={panel === 'void-all'}
            title="Void unused vouchers"
            intro={`The ${num(b.unused)} vouchers not yet used stop working at once. Used vouchers stay on record.`}
            onClose={() => setPanel(null)}
            onConfirm={async (reason) => {
              const x = await voidUnused(b.id, reason);
              done(`${num(x.voided - b.voided)} vouchers voided.`);
            }}
          />
          <VoidDrawer
            open={!!voiding}
            title={voiding ? `Void voucher ${voiding.code}` : 'Void voucher'}
            intro="It stops working at once, for example when its holder reports it lost."
            onClose={() => setVoiding(null)}
            onConfirm={async (reason) => {
              if (!voiding) return;
              await voidVoucher(voiding.id, reason);
              done(`Voucher ${voiding.code} voided.`);
            }}
          />
        </>
      ) : null}
    </>
  );
}
