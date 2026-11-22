import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card, CustomerRow, Statement } from './types';

const post = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => post(...a), get: vi.fn(), patch: vi.fn() } }));

const { discountWords } = await import('./types');
const { CardsTable, CustomersTable, StatementTable, TopUpDrawer, discountsFrom, parseRwf } = await import('./views');

const NOW = Date.parse('2026-11-22T10:00:00Z');
const row = (over: Partial<CustomerRow> = {}): CustomerRow => ({
  id: 'c1', kind: 'company', name: 'Kivu Logistics Ltd', contact_name: 'Eric Habimana', phone: null, balance: 412000,
  low_balance_alert: 100000, status: 'active', state: 'active', cards: 6, active_cards: 5,
  discounts: [{ product_type: 'GASOLINE', amount_per_unit: 20 }, { product_type: 'DIESEL', amount_per_unit: 20 }],
  month_sales: 1284000, month_discount: 15928, month_quantity: 796.4, last_used_at: '2026-11-22T07:14:00Z', ...over,
});
const card = (over: Partial<Card> = {}): Card => ({
  id: 'k1', code: 'K8TQ-CG52', number: 42, label: '··· 0042', holder_name: 'Eric Habimana', vehicle_plate: 'RAB 123 C',
  daily_limit: 100000, monthly_limit: null, used_today: 32260, used_month: 32260, last_used_at: '2026-11-22T07:14:00Z',
  status: 'active', deactivated_at: null, deactivated_reason: null, created_at: '2026-11-01T08:00:00Z', ...over,
});

describe('customer wording', () => {
  it('says a discount in a few words', () => {
    expect(discountWords([{ product_type: 'GASOLINE', amount_per_unit: 20 }, { product_type: 'DIESEL', amount_per_unit: 20 }])).toBe('20 RWF/L · gas, diesel');
    expect(discountWords([{ product_type: 'DIESEL', amount_per_unit: 30 }, { product_type: 'GASOLINE', amount_per_unit: 10 }])).toBe('diesel 30 · gas 10');
    expect(discountWords([])).toBe('No discount');
  });

  it('reads RWF as typed and keeps only real discounts', () => {
    expect(parseRwf('1,000,000')).toBe(1000000);
    expect(parseRwf(' ')).toBeNull();
    expect(discountsFrom({ GASOLINE: '20', DIESEL: '', EV_AC: '0' })).toEqual([{ product_type: 'GASOLINE', amount_per_unit: 20 }]);
  });
});

describe('CustomersTable', () => {
  it('shows each state, colours a low or empty balance, and opens a row', async () => {
    const open = vi.fn();
    render(
      <CustomersTable
        now={NOW}
        onOpen={open}
        rows={[row(), row({ id: 'c2', name: 'Volcano Express', balance: 38500, state: 'low_balance' }), row({ id: 'c3', name: 'Akagera Tours', balance: 0, state: 'empty' })]}
      />,
    );
    expect(screen.getByText('Low balance')).toBeTruthy();
    expect(screen.getByText('No balance')).toBeTruthy();
    expect(screen.getByText('38,500').className).toContain('text-warning');
    expect(screen.getByText('0').className).toContain('text-danger');
    expect(screen.getAllByText('20 RWF/L · gas, diesel')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: /^Volcano Express/ }));
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ id: 'c2' }));
  });
});

describe('CardsTable', () => {
  it('lets only an admin stop or reactivate a card; everyone can print', async () => {
    const stop = vi.fn();
    const { rerender } = render(<CardsTable now={NOW} cards={[card()]} canManage={false} onStop={stop} onReactivate={vi.fn()} onPrint={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for card ··· 0042' }));
    expect(screen.queryByText('Stop card…')).toBeNull();
    expect(screen.getByText('Print card')).toBeTruthy();
    rerender(<CardsTable now={NOW} cards={[card({ used_today: 100000 })]} canManage onStop={stop} onReactivate={vi.fn()} onPrint={vi.fn()} />);
    expect(screen.getByText('Limit reached')).toBeTruthy();
    await userEvent.click(screen.getByText('Stop card…'));
    expect(stop).toHaveBeenCalled();
  });

  it('says why a stopped card was stopped', () => {
    render(<CardsTable now={NOW} cards={[card({ status: 'deactivated', deactivated_at: '2026-11-15T08:00:00Z', deactivated_reason: 'Reported lost' })]} canManage onStop={vi.fn()} onReactivate={vi.fn()} onPrint={vi.fn()} />);
    expect(screen.getByText('Deactivated')).toBeTruthy();
    expect(screen.getByText('Stopped: Reported lost')).toBeTruthy();
  });
});

describe('StatementTable', () => {
  it('lists the newest first, with a sign on every amount', () => {
    const statement: Statement = {
      customer: { id: 'c1', name: 'Kivu' }, from: '2026-11-01', to: '2026-11-22', opening_balance: 0, closing_balance: 17740,
      entries: [
        { id: 'e1', kind: 'topup', at: '2026-11-19T08:00:00Z', amount: 50000, balance_after: 50000, method: 'bank', reference: 'BK 88231', note: null, received_on: '2026-11-19', sale: null },
        { id: 'e2', kind: 'sale', at: '2026-11-22T07:14:00Z', amount: -32260, balance_after: 17740, method: null, reference: null, note: null, received_on: null,
          sale: { id: 's1', station: 'Kigali Central', pump_number: 1, product_type: 'GASOLINE', unit: 'L', quantity: 20, discount_amount: 400, total_amount: 32260, vehicle_plate: 'RAB 123 C', attendant: 'Aline Uwase', card: '··· 0042', at: '2026-11-22T07:14:00Z' } },
      ],
    };
    render(<StatementTable statement={statement} now={NOW} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Kigali Central · Pump 1')).toBeTruthy();
    expect(within(rows[0]).getByText('··· 0042 · RAB 123 C · Aline Uwase')).toBeTruthy();
    expect(rows[0].textContent).toContain('−32,260');
    expect(within(rows[1]).getByText('Top-up · bank transfer')).toBeTruthy();
    expect(rows[1].textContent).toContain('+50,000');
  });
});

describe('TopUpDrawer', () => {
  it('shows the balance after, and sends the top-up in whole RWF', async () => {
    post.mockResolvedValueOnce({ data: { balance_after: 1412000 } });
    const done = vi.fn();
    render(<TopUpDrawer customer={{ id: 'c1', name: 'Kivu Logistics Ltd', balance: 412000 }} open onClose={vi.fn()} onDone={done} />);
    await userEvent.type(screen.getByLabelText('Amount, RWF'), '1,000,000');
    expect(screen.getByText('RWF 1,412,000')).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Reference'), 'BK 88412');
    await userEvent.click(screen.getByRole('button', { name: 'Record top-up' }));
    expect(post).toHaveBeenCalledWith('/customers/c1/topups', expect.objectContaining({ amount: 1000000, method: 'bank', reference: 'BK 88412' }));
    expect(done).toHaveBeenCalledWith(1000000);
  });
});
