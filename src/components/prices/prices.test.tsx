import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromKigaliWall, nextSixAm, toKigaliWall } from './data';
import { PriceCard, SchedulePanel, whenLabel } from './views';

describe('Kigali times for price changes', () => {
  it('reads and writes wall time in Kigali, whatever the browser', () => {
    expect(fromKigaliWall('2026-11-22T06:00')).toBe('2026-11-22T04:00:00.000Z');
    expect(toKigaliWall('2026-11-22T04:00:00.000Z')).toBe('2026-11-22T06:00');
  });

  it('offers the next 06:00', () => {
    expect(nextSixAm(Date.parse('2026-11-21T10:00:00Z'))).toBe('2026-11-22T06:00');
    expect(nextSixAm(Date.parse('2026-11-21T02:00:00Z'))).toBe('2026-11-21T06:00');
  });

  it('says when in words', () => {
    const now = Date.parse('2026-11-21T10:00:00Z');
    expect(whenLabel('2026-11-22T04:00:00.000Z', now)).toBe('at 06:00 tomorrow');
    expect(whenLabel('2026-11-21T14:00:00.000Z', now)).toBe('at 16:00 today');
  });
});

describe('SchedulePanel', () => {
  const current = { GASOLINE: { id: 'g', product_type: 'GASOLINE', unit: 'L', price_per_unit: 1633, effective_at: '2026-11-01T04:00:00Z' } };

  it('shows the change against the current price and schedules it at the chosen Kigali time', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SchedulePanel draft={{ editing: null, product: 'GASOLINE' }} current={current} canEdit onProduct={vi.fn()} onSave={onSave} onCancelChange={vi.fn()} onDone={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/New price, RWF per litre/), '1650');
    expect(screen.getByText('Current price 1,633 · change +17 (1.0%)')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Schedule change' }));
    expect(onSave).toHaveBeenCalledWith({ product: 'GASOLINE', price: 1650, effectiveAt: expect.stringMatching(/T04:00:00\.000Z$/) });
  });

  it('changes the price now when asked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SchedulePanel draft={{ editing: null, product: 'GASOLINE' }} current={current} canEdit onProduct={vi.fn()} onSave={onSave} onCancelChange={vi.fn()} onDone={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/New price, RWF per litre/), '1640');
    await userEvent.click(screen.getByText('Now'));
    await userEvent.click(screen.getByRole('button', { name: 'Change price now' }));
    expect(onSave).toHaveBeenCalledWith({ product: 'GASOLINE', price: 1640, effectiveAt: null });
  });

  it('refuses the price already in force', async () => {
    const onSave = vi.fn();
    render(<SchedulePanel draft={{ editing: null, product: 'GASOLINE' }} current={current} canEdit onProduct={vi.fn()} onSave={onSave} onCancelChange={vi.fn()} onDone={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/New price, RWF per litre/), '1633');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule change' }));
    expect(screen.getByText('That is already the price.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('PriceCard', () => {
  const row = { id: 'g', product_type: 'GASOLINE', unit: 'L', price_per_unit: 1633, effective_at: '2026-11-01T04:00:00Z' };

  it('shows a pencil only to someone who can change the price', () => {
    const { container, rerender } = render(<PriceCard product="GASOLINE" row={row} selected={false} editable onPick={vi.fn()} />);
    expect(container.querySelector('svg.lucide-pencil')).toBeTruthy();
    rerender(<PriceCard product="GASOLINE" row={row} selected={false} onPick={vi.fn()} />);
    expect(container.querySelector('svg.lucide-pencil')).toBeNull();
  });

  it('opens its product in the form', async () => {
    const onPick = vi.fn();
    render(<PriceCard product="GASOLINE" row={row} selected={false} editable onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { pressed: false }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});

describe('SchedulePanel buttons', () => {
  it('says Cancel, not Clear, for a new change', () => {
    const current = { GASOLINE: { id: 'g', product_type: 'GASOLINE', unit: 'L', price_per_unit: 1633, effective_at: '2026-11-01T04:00:00Z' } };
    render(<SchedulePanel draft={{ editing: null, product: 'GASOLINE' }} current={current} canEdit onProduct={vi.fn()} onSave={vi.fn()} onCancelChange={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});
