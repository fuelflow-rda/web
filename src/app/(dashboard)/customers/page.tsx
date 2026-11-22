'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from 'antd';
import { BadgePercent, IdCard, Plus, ReceiptText, Search, Wallet } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, KpiTile, PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { listCustomers, discountWords } from '@/components/customers/types';
import { AddCustomerDrawer, CustomersTable, STATE } from '@/components/customers/views';
import { useAuthStore } from '@/store/auth-store';

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersView />
    </Suspense>
  );
}

/**
 * Customers of the company (Pencil "Web / Customers"): balances held, cards,
 * this month's sales and discounts, and each customer's state. Company-wide,
 * so the station switcher does not change it.
 */
function CustomersView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const list = usePolled(user?.companyId ?? 'company', () => listCustomers(), 60_000);

  const all = list.data?.data ?? [];
  const term = search.trim().toLowerCase();
  const rows = all.filter(
    (r) =>
      (!term || [r.name, r.contact_name, r.phone].some((v) => (v ?? '').toLowerCase().includes(term))) &&
      (!status || (status === 'low_balance' ? r.state === 'low_balance' || r.state === 'empty' : r.status === status)),
  );
  const t = list.data?.totals;
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Africa/Kigali' }).format(new Date()).toUpperCase();

  return (
    <>
      <PageHeader
        title="Customers"
        description="Cards, a discount per litre and a prepaid balance · valid at every station of the company"
        actions={
          <>
            <ExportButton
              filename="customers"
              data={all.map((r) => ({
                name: r.name,
                kind: r.kind,
                contact: r.contact_name ?? '',
                phone: r.phone ?? '',
                cards: r.active_cards,
                discount: discountWords(r.discounts),
                balance: r.balance,
                month: r.month_sales,
                status: STATE[r.state].label,
              }))}
              columns={[
                { header: 'Customer', key: 'name' },
                { header: 'Type', key: 'kind' },
                { header: 'Contact', key: 'contact' },
                { header: 'Phone', key: 'phone' },
                { header: 'Active cards', key: 'cards' },
                { header: 'Discount', key: 'discount' },
                { header: 'Balance (RWF)', key: 'balance' },
                { header: 'This month (RWF)', key: 'month' },
                { header: 'Status', key: 'status' },
              ]}
            />
            {canManage ? (
              <Button kind="primary" icon={Plus} onClick={() => setAdding(true)}>
                Add customer
              </Button>
            ) : null}
          </>
        }
      />

      {notice ? <Banner tone="success" title={notice} /> : null}

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Balances held" icon={Wallet} prefix="RWF" value={t ? num(t.balances) : '…'} delta={{ text: 'Owed to customers until spent', direction: 'flat' }} />
        <KpiTile label="Active cards" icon={IdCard} value={t ? num(t.active_cards) : '…'} delta={{ text: `Held by ${t ? num(t.customers) : '…'} customers`, direction: 'flat' }} />
        <KpiTile label={`Sales on cards · ${month}`} icon={ReceiptText} prefix="RWF" value={t ? num(t.month_sales) : '…'} delta={{ text: t ? `${num(t.month_quantity)} L and kWh` : '…', direction: 'flat' }} />
        <KpiTile
          label={`Discounts given · ${month}`}
          icon={BadgePercent}
          prefix="RWF"
          value={t ? num(t.month_discount) : '…'}
          delta={{ text: t && t.month_quantity ? `${num(t.month_discount / t.month_quantity)} RWF per unit on average` : 'None yet this month', direction: 'flat' }}
        />
      </section>

      <div role="search" aria-label="Filter customers" className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Search customers"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          placeholder="Search name, contact or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-80"
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={setStatus}
          className="w-44"
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'low_balance', label: 'Low or no balance' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      <Panel title="Customers" meta={list.data ? `${rows.length} of ${all.length}` : undefined} padded={false}>
        {list.error && !list.data ? (
          <div className="p-5">
            <PanelError message="Customers could not be loaded." onRetry={list.reload} />
          </div>
        ) : !list.data ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-14 text-text-secondary">
            {all.length ? 'No customer matches.' : canManage ? 'No customers yet. Add a company or person who buys fuel on account.' : 'No customers yet.'}
          </p>
        ) : (
          <CustomersTable rows={rows} now={now} onOpen={(r) => router.push(`/customers/${r.id}`)} />
        )}
      </Panel>

      <AddCustomerDrawer
        open={adding}
        onClose={() => setAdding(false)}
        onDone={(c) => {
          setAdding(false);
          setNotice(`${c.name} is added. Record a top-up, then issue their cards.`);
          router.push(`/customers/${c.id}`);
        }}
      />
    </>
  );
}
