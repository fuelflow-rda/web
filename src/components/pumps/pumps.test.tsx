import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaintenanceBanners, PointCard, lastSale, pointMeta, sinceLabel } from './views';
import type { Point } from './data';

const point = (over: Partial<Point> = {}): Point => ({
  id: 'p1',
  pump_number: 1,
  product_type: 'GASOLINE',
  unit: 'L',
  kind: 'pump',
  connector_type: null,
  power_kw: null,
  status: 'in_use',
  in_open_shift: true,
  last_sale_at: '2026-11-21T09:32:00Z',
  today: { quantity: 512, revenue: 836096, sales: 90 },
  last_reading: 12962.9,
  price_per_unit: 1633,
  maintenance: null,
  ...over,
});

describe('pump cards', () => {
  it('describes a pump by product and price, a charger by connector and power too', () => {
    expect(pointMeta(point())).toBe('Gasoline · RWF 1,633 per litre');
    expect(pointMeta(point({ kind: 'charger', product_type: 'EV_DC_FAST', unit: 'KWH', connector_type: 'CCS', power_kw: 60, price_per_unit: 380 }))).toBe(
      'DC fast · CCS2 · 60 kW · RWF 380 per kWh',
    );
    expect(pointMeta(point({ price_per_unit: null }))).toBe('Gasoline · no price set');
  });

  it('says when, in Kigali time, relative to today', () => {
    const now = Date.parse('2026-11-21T09:00:00Z');
    expect(sinceLabel('2026-11-21T07:20:00Z', now)).toBe('09:20');
    expect(sinceLabel('2026-11-20T12:20:00Z', now)).toBe('yesterday at 14:20');
  });

  it('gives the last sale as a time, "Yesterday", or the day alone', () => {
    const now = Date.parse('2026-11-21T09:00:00Z');
    expect(lastSale('2026-11-21T07:20:00Z', now)).toBe('09:20');
    expect(lastSale('2026-11-20T12:20:00Z', now)).toBe('Yesterday');
    expect(lastSale('2026-11-19T13:00:00Z', now)).toBe('Thu 19 Nov');
    expect(lastSale(null, now)).toBe('Never');
  });

  it('shows the day so far and the meter', () => {
    render(<PointCard point={point()} now={Date.parse('2026-11-21T10:00:00Z')} canManage onReport={vi.fn()} onStart={vi.fn()} onEnd={vi.fn()} onLog={vi.fn()} />);
    const card = screen.getByRole('article', { name: 'Pump 1' });
    expect(card.textContent).toContain('In use');
    expect(card.textContent).toContain('512.0');
    expect(card.textContent).toContain('12,962.9');
    expect(card.textContent).toContain('11:32');
  });

  it('offers maintenance to managers only, and the way back when it is out', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { rerender } = render(<PointCard point={point()} now={0} canManage onReport={vi.fn()} onStart={onStart} onEnd={onEnd} onLog={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Pump 1' }));
    await userEvent.click(await screen.findByText('Take out for maintenance'));
    expect(onStart).toHaveBeenCalled();

    const out = point({ status: 'offline', maintenance: { id: 'm', pumpId: 'p1', pumpNumber: 1, startedAt: '2026-11-21T07:00:00Z', startedBy: 'Jean Claude', reason: 'Nozzle leaking', endedAt: null, endedBy: null, resolution: null } });
    rerender(<PointCard point={out} now={0} canManage={false} onReport={vi.fn()} onStart={onStart} onEnd={onEnd} onLog={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Pump 1' }));
    expect(screen.queryByText('Put back in service')).toBeNull();
  });

  it('raises a banner for each point out of service, saying who and why', () => {
    const out = point({ maintenance: { id: 'm', pumpId: 'p1', pumpNumber: 1, startedAt: '2026-11-21T07:00:00Z', startedBy: 'Jean Claude', reason: 'Nozzle leaking', endedAt: null, endedBy: null, resolution: null } });
    render(<MaintenanceBanners points={[out, point({ id: 'p2', pump_number: 2 })]} now={Date.parse('2026-11-21T10:00:00Z')} onLog={vi.fn()} />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText('Pump 1 has been offline since 09:00')).toBeTruthy();
    expect(screen.getByText(/by Jean Claude: Nozzle leaking/)).toBeTruthy();
  });
});
