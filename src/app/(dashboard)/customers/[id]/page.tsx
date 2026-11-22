'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BadgePercent, Pencil, Plus, ReceiptText, Wallet } from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, KpiTile, PageHeader, Panel } from '@/components/ui';
import { PanelError, PanelSkeleton, num, rwf } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { useShellCrumb } from '@/components/shell/AppShell';
import api from '@/lib/api';
import { fullDate } from '@/lib/dates';
import { productName } from '@/lib/product-types';
import { discountWords, getCustomer, getStatement, updateCard, type Card } from '@/components/customers/types';
import {
  AddCardDrawer,
  CardsTable,
  DISCOUNT_PRODUCTS,
  EditCustomerDrawer,
  StatementTable,
  StopCardDrawer,
  TopUpDrawer,
} from '@/components/customers/views';
import { printCard } from '@/components/customers/print';
import { useAuthStore } from '@/store/auth-store';

export default function CustomerPage() {
  return (
    <Suspense>
      <CustomerView />
    </Suspense>
  );
}

/** One customer (Pencil "Web / Customer · Kivu Logistics"): balance, cards, statement and terms. */
function CustomerView() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN';
  const customer = usePolled(id, () => getCustomer(id), 60_000);
  const statement = usePolled(`${id}-statement`, () => getStatement(id), 60_000);
  const [companyName, setCompanyName] = useState('');
  const [panel, setPanel] = useState<'topup' | 'card' | 'edit' | null>(null);
  const [stopping, setStopping] = useState<Card | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const c = customer.data;
  useShellCrumb(c?.name);

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

  const changed = (message: string) => {
    setNotice(message);
    setFailure(null);
    customer.reload();
    statement.reload();
  };

  if (customer.error && !c) {
    return (
      <>
        <PageHeader title="Customer" />
        <Panel title="Customer">
          <PanelError message="This customer could not be loaded." onRetry={customer.reload} />
        </Panel>
      </>
    );
  }
  if (!c) return <PanelSkeleton rows={8} />;

  const alert = c.low_balance_alert;
  const low = alert != null && c.balance < alert;
  const since = fullDate(new Date(c.created_at)).replace(/^\w+ /, '');
  const discountLine = c.discounts.length
    ? c.discounts.map((d) => `${d.amount_per_unit} RWF off ${productName(d.product_type).toLowerCase()}`).join(', ')
    : 'no discount';
  const print = (card: Card) =>
    printCard({ companyName: companyName || 'Fuel station', customerName: c.name, holderName: card.holder_name, plate: card.vehicle_plate, code: card.code, label: card.label }).catch(
      (err: unknown) => setFailure(err instanceof Error ? err.message : 'The card could not be printed.'),
    );

  return (
    <>
      <PageHeader
        title={c.name}
        description={`${c.kind === 'person' ? 'Person' : 'Company'} · customer since ${since} · ${c.cards.filter((k) => k.status === 'active').length} active cards · ${discountLine}`}
        actions={
          <>
            {statement.data ? (
              <ExportButton
                label="Statement"
                filename={`${c.name}-statement-${statement.data.from}`}
                data={[...statement.data.entries].reverse().map((e) => ({
                  date: e.at.slice(0, 10),
                  detail: e.sale ? `${e.sale.station ?? ''} · ${e.sale.card ?? ''} · ${e.sale.vehicle_plate ?? ''}` : `${e.kind}${e.reference ? ` · ${e.reference}` : ''}`,
                  quantity: e.sale ? e.sale.quantity : '',
                  discount: e.sale ? e.sale.discount_amount : '',
                  amount: e.amount,
                  balance: e.balance_after,
                }))}
                columns={[
                  { header: 'Date', key: 'date' },
                  { header: 'Detail', key: 'detail' },
                  { header: 'Litres or kWh', key: 'quantity' },
                  { header: 'Discount (RWF)', key: 'discount' },
                  { header: 'Amount (RWF)', key: 'amount' },
                  { header: 'Balance (RWF)', key: 'balance' },
                ]}
              />
            ) : null}
            {canManage ? (
              <>
                <Button icon={Pencil} onClick={() => setPanel('edit')}>
                  Edit
                </Button>
                <Button kind="primary" icon={Plus} onClick={() => setPanel('topup')}>
                  Record top-up
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {notice ? <Banner tone="success" title={notice} /> : null}
      {failure ? <Banner tone="danger" title={failure} /> : null}
      {c.status === 'suspended' ? (
        <Banner tone="warning" title="This customer is suspended">
          Their cards are refused at the pump. The balance is kept until the account is reactivated.
        </Banner>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile
              label="Balance"
              icon={Wallet}
              prefix="RWF"
              value={num(c.balance)}
              valueTone={c.balance === 0 ? 'danger' : undefined}
              delta={{ text: alert != null ? `${low ? 'Below' : 'Alert below'} ${rwf(alert)}` : 'No alert set', direction: 'flat', good: !low }}
            />
            <KpiTile
              label="Spent this month"
              icon={ReceiptText}
              prefix="RWF"
              value={num(c.month.sales)}
              delta={{ text: `${c.month.quantity.toFixed(1)} L and kWh at ${c.month.stations} ${c.month.stations === 1 ? 'station' : 'stations'}`, direction: 'flat' }}
            />
            <KpiTile
              label="Discount this month"
              icon={BadgePercent}
              prefix="RWF"
              value={num(c.month.discount)}
              delta={{ text: discountWords(c.discounts), direction: 'flat' }}
            />
          </section>

          <Panel
            title="Cards"
            meta="They share the balance; each has its own limit"
            action={canManage ? { label: 'Add card', onClick: () => setPanel('card') } : undefined}
            padded={false}
          >
            <CardsTable
              cards={c.cards}
              now={now}
              canManage={canManage}
              onPrint={print}
              onStop={setStopping}
              onReactivate={(card) =>
                updateCard(c.id, card.id, { status: 'active' })
                  .then(() => changed(`Card ${card.label} works again.`))
                  .catch((err: unknown) => setFailure(err instanceof Error ? err.message : 'The card could not be reactivated.'))
              }
            />
          </Panel>

          <Panel
            title="Statement · this month"
            meta={statement.data ? `Opened at ${rwf(statement.data.opening_balance)} · closes at ${rwf(statement.data.closing_balance)}` : undefined}
            padded={false}
          >
            {statement.error && !statement.data ? (
              <div className="p-5">
                <PanelError message="The statement could not be loaded." onRetry={statement.reload} />
              </div>
            ) : !statement.data ? (
              <div className="p-5">
                <PanelSkeleton rows={5} />
              </div>
            ) : (
              <StatementTable statement={statement.data} now={now} />
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Discount" action={canManage ? { label: 'Edit', onClick: () => setPanel('edit') } : undefined}>
            <dl className="m-0 flex flex-col">
              {DISCOUNT_PRODUCTS.map((p, i) => {
                const d = c.discounts.find((x) => x.product_type === p);
                return (
                  <div key={p} className={`flex items-center justify-between py-2.5 ${i ? 'border-t border-border' : ''}`}>
                    <dt className="text-14 text-text-secondary">{productName(p)}</dt>
                    <dd className="m-0 font-mono text-13 font-medium text-text">
                      {d ? `−${d.amount_per_unit} ${p.startsWith('EV') ? 'RWF/kWh' : 'RWF/L'}` : 'None'}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Panel>
          <Panel title="Details" action={canManage ? { label: 'Edit', onClick: () => setPanel('edit') } : undefined}>
            <dl className="m-0 flex flex-col">
              {[
                ['Contact', c.contact_name ?? '—', false],
                ['Phone', c.phone ?? '—', true],
                ['Email', c.email ?? '—', false],
                ['TIN', c.tin ?? '—', true],
                ['Customer since', since, false],
              ].map(([k, v, mono], i) => (
                <div key={String(k)} className={`flex items-center justify-between gap-3 py-2.5 ${i ? 'border-t border-border' : ''}`}>
                  <dt className="text-14 text-text-secondary">{k}</dt>
                  <dd className={`m-0 truncate text-right font-medium text-text ${mono ? 'font-mono text-13' : 'text-14'}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      {canManage ? (
        <>
          <TopUpDrawer
            customer={c}
            open={panel === 'topup'}
            onClose={() => setPanel(null)}
            onDone={(amount) => {
              setPanel(null);
              changed(`${rwf(amount)} added to ${c.name}’s balance.`);
            }}
          />
          <AddCardDrawer
            customer={c}
            companyName={companyName || 'Your company'}
            open={panel === 'card'}
            onClose={() => setPanel(null)}
            onDone={(card) => {
              setPanel(null);
              changed(`Card ${card.label} is ready, code ${card.code}. Print it from the card’s menu.`);
            }}
          />
          {panel === 'edit' ? (
            <EditCustomerDrawer
              customer={c}
              open
              onClose={() => setPanel(null)}
              onDone={() => {
                setPanel(null);
                changed('Changes saved.');
              }}
            />
          ) : null}
          <StopCardDrawer
            customerId={c.id}
            card={stopping}
            onClose={() => setStopping(null)}
            onDone={(card) => {
              setStopping(null);
              changed(`Card ${card.label} is stopped.`);
            }}
          />
        </>
      ) : null}
    </>
  );
}
