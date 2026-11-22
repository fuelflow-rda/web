import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BarChart, compact, niceMax } from './BarChart';
import { ago, delta, kigaliDayStart, reviewBanner } from './logic';
import { OnShiftPanel, PumpsPanel, RecentSalesPanel, ReconciliationPanel, shortName } from './panels';
import type { LivePump, RecentSale, ReconciliationSummary } from './data';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const summary = (over: Partial<ReconciliationSummary> = {}): ReconciliationSummary => ({
  id: 'r1',
  date: '2026-11-19',
  generatedAt: '2026-11-19T22:00:00.000Z',
  reviewedAt: null,
  checks: 5,
  toReview: 1,
  unresolved: 1,
  matched: 3,
  offline: 1,
  tolerance: 0.5,
  items: [
    {
      pumpId: 'p2',
      pumpNumber: 2,
      productType: 'DIESEL',
      unit: 'L',
      reason: 'variance',
      meteredQuantity: 274.4,
      recordedQuantity: 271.2,
      volumeDifference: -3.2,
      difference: -5168,
      resolution: null,
      shift: { attendant: { id: 'a', name: 'Eric Niyonzima' }, startedAt: null, endedAt: null },
    },
  ],
  ...over,
});

describe('overview logic', () => {
  it('starts the Kigali day at 22:00 UTC', () => {
    expect(new Date(kigaliDayStart(Date.parse('2026-11-20T23:30:00Z'))).toISOString()).toBe('2026-11-20T22:00:00.000Z');
  });

  it('words the review banner from what is still undecided', () => {
    expect(reviewBanner(summary())).toMatchObject({
      title: '1 discrepancy from Thursday needs review',
      body: 'Pump 2 is 3.2 L short against recorded sales. Reconciliation ran at 00:00.',
    });
    expect(reviewBanner(summary({ reviewedAt: '2026-11-20T08:00:00Z' }))).toBeNull();
    expect(reviewBanner(summary({ unresolved: 0 }))).toBeNull();
  });

  it('says a reading is missing rather than inventing a shortfall', () => {
    const s = summary();
    s.items[0] = { ...s.items[0], reason: 'readings_missing', volumeDifference: null };
    expect(reviewBanner(s)?.body).toContain('Pump 2 has no closing meter reading');
  });

  it('only calls a rise good when it is', () => {
    expect(delta(8.2, 'vs yesterday')).toEqual({ text: '8.2% vs yesterday', direction: 'up', good: true });
    expect(delta(-3, 'vs yesterday')).toMatchObject({ text: '3% vs yesterday', direction: 'down', good: false });
    expect(delta(null, 'vs yesterday')).toBeUndefined();
  });

  it('says how fresh the figures are in words', () => {
    expect(ago(4000)).toBe('just now');
    expect(ago(12_000)).toBe('12 seconds ago');
    expect(ago(65_000)).toBe('a minute ago');
  });
});

describe('BarChart', () => {
  it('rounds the axis up to a readable top', () => {
    expect(niceMax(112_000)).toBe(120_000);
    expect(niceMax(0)).toBe(4);
    expect([compact(126_000), compact(1_284_500), compact(950)]).toEqual(['126k', '1.3M', '950']);
  });

  it('draws nothing for hours still to come, and lists the rest for screen readers', () => {
    render(
      <BarChart
        summary="Revenue by hour today"
        format={(n) => `RWF ${n}`}
        bars={[
          { label: '06', name: '06:00', value: 1000 },
          { label: null, name: '07:00', value: 2500, highlight: true },
          { label: '08', name: '08:00', value: null },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: 'Revenue by hour today' })).toBeTruthy();
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((r) => r.textContent)).toEqual(['06:00RWF 1000', '07:00RWF 2500']);
  });
});

describe('panels', () => {
  it('labels pumps and chargers by the station numbering, with live status in words', () => {
    const pumps: LivePump[] = [
      { id: 'c', pump_number: 4, product_type: 'EV_DC_FAST', unit: 'KWH', kind: 'charger', status: 'charging', today: { quantity: 74.7, revenue: 0, sales: 0 } },
      { id: 'p', pump_number: 1, product_type: 'GASOLINE', unit: 'L', kind: 'pump', status: 'offline', today: { quantity: 0, revenue: 0, sales: 0 } },
    ];
    render(<PumpsPanel pumps={pumps} loading={false} error={null} onRetry={vi.fn()} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getByRole('rowheader').textContent)).toEqual(['Pump 1', 'Charger 4']);
    expect(rows[0].textContent).toContain('Offline');
    expect(rows[1].textContent).toContain('Charging');
    expect(rows[1].textContent).toContain('74.7 kWh');
  });

  it('shows a voided sale muted, with its status in words', () => {
    const sale: RecentSale = {
      id: 's1',
      timestamp: '2026-11-21T09:30:00Z',
      quantity: 15,
      unit: 'L',
      product_type: 'GASOLINE',
      total_amount: 24495,
      payment_method: 'CASH',
      sale_status: 'voided',
      users: { name: 'Aline Uwase' },
      pumps: { pump_number: 1 },
    };
    render(<RecentSalesPanel sales={[sale]} loading={false} error={null} onRetry={vi.fn()} />);
    const row = screen.getAllByRole('row')[1];
    expect(row.textContent).toContain('Aline U.');
    expect(row.textContent).toContain('Voided');
    // Muted as the design draws it; the word "Voided" carries the meaning, not a strike.
    expect(within(row).getByText('24,495').className).toContain('text-text-muted');
    expect(within(row).getByText('24,495').className).not.toContain('line-through');
  });

  it('offers a retry instead of an empty list when loading fails', () => {
    const retry = vi.fn();
    render(<RecentSalesPanel sales={null} loading={false} error="boom" onRetry={retry} />);
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(retry).toHaveBeenCalled();
  });

  it('counts how long each attendant has been on shift', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-11-21T10:00:00Z'));
    render(
      <OnShiftPanel
        loading={false}
        shifts={[{ shiftId: 's', attendant: { id: 'a', name: 'Aline Uwase' }, startedAt: '2026-11-21T06:34:21Z', sales: 42, revenue: 512419 }]}
      />,
    );
    expect(screen.getByText('42 sales · RWF 512,419')).toBeTruthy();
    expect(screen.getByText(/03:25:39/)).toBeTruthy();
    vi.useRealTimers();
  });

  it('marks a decided line with the decision instead of the gap', () => {
    const s = summary();
    s.items[0] = { ...s.items[0], resolution: { decision: 'explained' } };
    render(<ReconciliationPanel summary={s} loading={false} />);
    expect(screen.getByText('Explained')).toBeTruthy();
    expect(screen.queryByText('−3.2 L')).toBeNull();
  });
});

describe('kigaliWindow', () => {
  it('covers whole Kigali days, both ends included', async () => {
    const { kigaliWindow } = await import('@/lib/kigali');
    expect(kigaliWindow({ from: '2026-11-19', to: '2026-11-20' })).toEqual({
      from: '2026-11-18T22:00:00.000Z',
      to: '2026-11-20T21:59:59.999Z',
    });
    expect(kigaliWindow({ days: 7 }, Date.parse('2026-11-21T09:00:00Z'))).toEqual({ from: '2026-11-14T22:00:00.000Z' });
  });
});

describe('shortName', () => {
  it('keeps every given name and the family initial, as the design writes them', () => {
    expect(shortName('Jean Paul Habimana')).toBe('Jean Paul H.');
    expect(shortName('Aline Uwase')).toBe('Aline U.');
    expect(shortName('Claudine')).toBe('Claudine');
    expect(shortName('  ')).toBe('Unknown');
  });
});
