import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BatchRow, Voucher } from './types';

const post = vi.fn();
const get = vi.fn(() => Promise.resolve({ data: { data: [{ id: 'cu1', name: 'MINECOFIN' }], totals: {} } }));
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => post(...a), get: (...a: unknown[]) => get(...(a as [])), patch: vi.fn() } }));

const { batchValue } = await import('./types');
const { BatchesTable, CreateBatchDrawer, VouchersTable } = await import('./views');

const batch = (over: Partial<BatchRow> = {}): BatchRow => ({
  id: 'b1', name: 'MINECOFIN staff fuel', kind: 'prepaid', customer: { id: 'cu1', name: 'MINECOFIN' }, face_value: 20000,
  discount_per_unit: null, discount_fixed: null, count: 100, expires_on: '2026-12-31', created_at: '2026-11-02T08:00:00Z',
  used: 38, unused: 61, voided: 1, state: 'active', value: 2000000, used_value: 756330, value_left: 1220000, expired_value: 0, ...over,
});

describe('voucher wording', () => {
  it('says what one voucher is worth', () => {
    expect(batchValue(batch())).toBe('RWF 20,000 each');
    expect(batchValue(batch({ kind: 'promo', face_value: null, discount_per_unit: 50 }))).toBe('−50 /L');
    expect(batchValue(batch({ kind: 'promo', face_value: null, discount_fixed: 2000 }), true)).toBe('−2,000');
  });
});

describe('BatchesTable', () => {
  it('shows used out of count, value left, and an expired batch’s value apart', () => {
    render(<BatchesTable onOpen={vi.fn()} rows={[batch(), batch({ id: 'b2', name: 'Volcano drivers', state: 'expired', value_left: 0, expired_value: 110000 })]} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0].textContent).toContain('38 / 100');
    expect(rows[0].textContent).toContain('1,220,000');
    expect(within(rows[1]).getByText('Expired')).toBeTruthy();
    expect(within(rows[1]).getByText('110,000').className).toContain('text-text-muted');
  });
});

describe('VouchersTable', () => {
  const NOW = Date.parse('2026-11-22T10:00:00Z');
  const used: Voucher = { id: 'v1', code: '7K2P-9QXM', status: 'used', used_at: '2026-11-20T12:02:00Z', amount_applied: 20000, station: 'Kigali Central', sale: { id: 's1', total_amount: 24495, at: '2026-11-20T12:02:00Z', pump_number: 1, attendant: 'Aline Uwase' }, voided_at: null, void_reason: null, voided_by: null };
  const unused: Voucher = { ...used, id: 'v2', code: 'B6NW-8JKD', status: 'unused', used_at: null, amount_applied: null, station: null, sale: null };

  it('says where a used voucher went and what the rest was, and lets an admin void only unused ones', async () => {
    const onVoid = vi.fn();
    render(<VouchersTable vouchers={[used, unused]} canManage onVoid={onVoid} now={NOW} />);
    expect(screen.getByText('Kigali Central · Pump 1')).toBeTruthy();
    expect(screen.getByText(/rest RWF 4,495 paid another way/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Actions for voucher 7K2P-9QXM' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Actions for voucher B6NW-8JKD' }));
    await userEvent.click(screen.getByText('Void…'));
    expect(onVoid).toHaveBeenCalledWith(expect.objectContaining({ code: 'B6NW-8JKD' }));
  });
});

describe('CreateBatchDrawer', () => {
  it('sends a prepaid batch with its face value, and totals the prepaid value', async () => {
    post.mockResolvedValueOnce({ data: { ...batch(), vouchers: [] } });
    const done = vi.fn();
    render(<CreateBatchDrawer open onClose={vi.fn()} onDone={done} />);
    await userEvent.type(screen.getByLabelText('Batch name'), 'Staff fuel · December');
    await userEvent.clear(screen.getByLabelText('Number of vouchers'));
    await userEvent.type(screen.getByLabelText('Number of vouchers'), '20');
    await userEvent.type(screen.getByLabelText('Value each, RWF'), '50,000');
    expect(screen.getByText('RWF 1,000,000')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Create 20 vouchers' }));
    expect(post).toHaveBeenCalledWith('/voucher-batches', expect.objectContaining({ kind: 'prepaid', count: 20, face_value: 50000, name: 'Staff fuel · December' }));
    expect(done).toHaveBeenCalled();
  });

  it('asks for what is missing before sending', async () => {
    post.mockClear();
    render(<CreateBatchDrawer open onClose={vi.fn()} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create 100 vouchers' }));
    expect(screen.getByText('Give the batch a name you will recognise.')).toBeTruthy();
    expect(screen.getByText('Enter what each voucher is worth.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});
