import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentTable, PumpTable, ResolvePanel } from './views';
import type { PumpLine, PumpShifts, Report } from './types';

const line = (over: Partial<PumpLine>): PumpLine => ({
  pumpId: 'p1',
  pumpNumber: 1,
  productType: 'GASOLINE',
  unit: 'L',
  quantity: 512,
  expectedRevenue: 836752,
  expectedBasis: 'metered',
  recordedRevenue: 836096,
  difference: -653,
  outcome: 'matched',
  reviewReason: null,
  openingReading: 12450.5,
  closingReading: 12962.9,
  meteredQuantity: 512.4,
  volumeDifference: -0.4,
  readingsComplete: true,
  outOfService: false,
  resolution: null,
  ...over,
});

const pump2 = line({
  pumpId: 'p2',
  pumpNumber: 2,
  productType: 'DIESEL',
  quantity: 271.2,
  meteredQuantity: 274.4,
  volumeDifference: -3.2,
  difference: -5168,
  outcome: 'review',
  reviewReason: 'variance',
});

const report = (lines: PumpLine[]): Report => ({
  id: 'r',
  stationId: 's',
  date: '2026-11-20',
  expectedRevenue: 1279913,
  recordedRevenue: 1274092,
  difference: -5821,
  expectedBasis: 'metered',
  status: 'DISCREPANCY',
  pumpBreakdown: lines,
  paymentBreakdown: [],
  attendantBreakdown: [],
  totalLiters: 783.2,
  totalKwh: 0,
  totalTransactions: 98,
  shiftCount: 2,
  volumeDifference: { liters: -3.6, kwh: 0 },
  tolerance: 0.5,
  unresolvedCount: 1,
  decisions: [],
  reviewedAt: null,
  reviewedBy: null,
  generatedAt: '2026-11-20T22:00:00Z',
});

const shifts: PumpShifts = {
  pumpId: 'p2',
  pumpNumber: 2,
  label: 'Pump 2',
  unit: 'L',
  date: '2026-11-20',
  shifts: [
    { shiftId: 'm', attendant: { id: 'e', name: 'Eric Niyonzima' }, startedAt: '2026-11-20T04:00:00Z', endedAt: '2026-11-20T12:02:00Z', shiftOpen: false, openingReading: 8320.2, closingReading: 8478.2, meteredQuantity: 158, recordedQuantity: 154.8, sales: 34, recordedRevenue: 250002, volumeDifference: -3.2, readingsComplete: true },
    { shiftId: 'e', attendant: { id: 'a', name: 'Aline Uwase' }, startedAt: '2026-11-20T12:02:00Z', endedAt: '2026-11-20T20:05:00Z', shiftOpen: false, openingReading: 8478.2, closingReading: 8594.6, meteredQuantity: 116.4, recordedQuantity: 116.4, sales: 34, recordedRevenue: 187986, volumeDifference: 0, readingsComplete: true },
  ],
};

describe('PumpTable', () => {
  it('shows each pump with its gap signed as the design does, and the station total', () => {
    render(<PumpTable report={report([pump2, line({})])} selected="p2" onSelect={vi.fn()} />);
    const [, first, second, total] = screen.getAllByRole('row');
    expect(within(first).getByRole('rowheader').textContent).toContain('Pump 2');
    expect(first.textContent).toContain('−3.2 L');
    expect(first.textContent).toContain('−5,168');
    expect(first.textContent).toContain('Review');
    expect(second.textContent).toContain('Matched');
    expect(total.textContent).toContain('Station total');
    expect(total.textContent).toContain('786.8 L');
    expect(total.textContent).toContain('−3.6 L');
  });

  it('lets a pump be chosen for the detail below', async () => {
    const onSelect = vi.fn();
    render(<PumpTable report={report([pump2, line({})])} selected="p2" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /Pump 1/ }));
    expect(onSelect).toHaveBeenCalledWith('p1');
    expect(screen.getByRole('button', { name: /Pump 2/ }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('ResolvePanel', () => {
  it('needs a note, then explains', async () => {
    const onDecide = vi.fn().mockResolvedValue(undefined);
    render(<ResolvePanel line={pump2} decisions={[]} shifts={shifts} canDecide onDecide={onDecide} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mark as explained' }));
    expect(onDecide).not.toHaveBeenCalled();
    expect(screen.getByText(/Write what happened/)).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Note for the record'), 'Test pour into the calibration can');
    await userEvent.click(screen.getByRole('button', { name: 'Mark as explained' }));
    expect(onDecide).toHaveBeenCalledWith({ decision: 'explained', note: 'Test pour into the calibration can' });
  });

  it('flags the shift where the gap arose, naming its attendant', async () => {
    const onDecide = vi.fn().mockResolvedValue(undefined);
    render(<ResolvePanel line={pump2} decisions={[]} shifts={shifts} canDecide onDecide={onDecide} />);
    await userEvent.type(screen.getByLabelText('Note for the record'), 'Please count calibration pours');
    await userEvent.click(screen.getByRole('button', { name: 'Flag to Eric' }));
    expect(onDecide).toHaveBeenCalledWith({ decision: 'flagged', note: 'Please count calibration pours', shift_id: 'm' });
  });

  it('shows the history and nothing to decide for a pump within tolerance', () => {
    render(
      <ResolvePanel
        line={line({})}
        decisions={[]}
        shifts={null}
        canDecide
        onDecide={vi.fn()}
      />,
    );
    expect(screen.getByText('Pump 1 is within tolerance. Nothing to resolve.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark as explained' })).toBeNull();
  });

  it('is read-only for people who do not decide', () => {
    render(<ResolvePanel line={pump2} decisions={[]} shifts={shifts} canDecide={false} onDecide={vi.fn()} />);
    expect(screen.queryByLabelText('Note for the record')).toBeNull();
  });
});

describe('PaymentTable', () => {
  it('marks prepaid payments as not in the till, and shows the discounts behind expected revenue', () => {
    render(
      <PaymentTable
        report={{
          ...report([]),
          expectedRevenue: 1358345,
          totalTransactions: 151,
          splitSales: 6,
          discounts: { total: 16928, card: 14428, promo: 2500, card_sales: 22, promo_sales: 4 },
          paymentBreakdown: [
            { method: 'CASH', count: 65, amount: 512840, prepaid: false },
            { method: 'MOMO', count: 51, amount: 401236, prepaid: false },
            { method: 'ACCOUNT', count: 22, amount: 255408, prepaid: true },
          ],
        }}
      />,
    );
    const balance = screen.getByRole('row', { name: /Prepaid balance/ });
    expect(within(balance).getByText('No · paid earlier')).toBeTruthy();
    expect(within(screen.getByRole('row', { name: /Recorded revenue/ })).getByText('1,169,484')).toBeTruthy();
    expect(screen.getByText(/6 were paid two ways/)).toBeTruthy();
    expect(screen.getByText('RWF 1,375,273')).toBeTruthy();
    expect(screen.getByText('−RWF 14,428')).toBeTruthy();
  });

  it('keeps the plain table for a day without cards or vouchers', () => {
    render(<PaymentTable report={{ ...report([]), paymentBreakdown: [{ method: 'CASH', count: 3, amount: 9000 }] }} />);
    expect(screen.queryByText('In the till')).toBeNull();
    expect(screen.queryByText('Discounts')).toBeNull();
  });
});
