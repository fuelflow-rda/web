import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatRwandaPhone, isValidRwandaPhone, normalizeRwandaPhone } from '@/lib/phone';
import type { RosterRow } from './data';

const post = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => post(...a), get: vi.fn(), patch: vi.fn() } }));

const { AddAttendantDrawer, RosterTable, pointsLabel, shiftLabel, varianceLabel } = await import('./views');

const row = (over: Partial<RosterRow> = {}): RosterRow => ({
  id: 'a',
  name: 'Aline Uwase',
  phone: '+250788111111',
  isActive: true,
  pinLockedAt: null,
  pinFailedAttempts: 0,
  lastSeenAt: null,
  status: 'off_shift',
  openShift: null,
  lastShift: null,
  salesToday: 0,
  revenueToday: 0,
  varianceWeek: { liters: 0, kwh: 0, shifts: 0 },
  ...over,
});

describe('phone numbers', () => {
  it('stores what the app sends and shows what people write', () => {
    expect(['0788111111', '788111111', '+250 788 111 111', '250788111111'].map(normalizeRwandaPhone)).toEqual(Array(4).fill('+250788111111'));
    expect(isValidRwandaPhone('078 811 111')).toBe(false);
    expect(isValidRwandaPhone('0288111111')).toBe(false);
    expect(formatRwandaPhone('+250788111111')).toBe('078 811 1111');
  });
});

describe('roster labels', () => {
  it('names the points a shift opened', () => {
    expect(pointsLabel([{ number: 1, productType: 'GASOLINE' }, { number: 2, productType: 'DIESEL' }, { number: 4, productType: 'EV_DC_FAST' }])).toBe(
      'Pumps 1, 2 · Charger 4',
    );
  });

  it('describes the current or last shift, or the lock', () => {
    expect(shiftLabel(row({ status: 'on_shift', openShift: { id: 's', startedAt: '2026-11-21T04:14:00Z', points: [{ number: 1, productType: 'GASOLINE' }] } }))).toBe(
      'Since 06:14 · Pump 1',
    );
    expect(shiftLabel(row({ lastShift: { startedAt: '2026-11-19T04:00:00Z', endedAt: '2026-11-19T12:02:00Z' } }))).toBe('Thu 06:00 to 14:02');
    expect(shiftLabel(row({ status: 'pin_locked', pinLockedAt: '2026-11-21T05:12:00Z', pinFailedAttempts: 5 }))).toBe('5 wrong PIN attempts at 07:12');
    expect(shiftLabel(row())).toBe('No shifts yet');
  });

  it('signs the variance, and says nothing without a measured shift', () => {
    expect(varianceLabel({ liters: -3.24, kwh: 0, shifts: 2 })).toBe('−3.2 L');
    expect(varianceLabel({ liters: 0.2, kwh: 0, shifts: 1 })).toBe('+0.2 L');
    expect(varianceLabel({ liters: 0.04, kwh: 0, shifts: 3 })).toBe('0.0 L');
    expect(varianceLabel({ liters: 0, kwh: 0, shifts: 0 })).toBe('—');
  });
});

describe('RosterTable', () => {
  it('shows a locked PIN as waiting, not as an error', () => {
    render(<RosterTable rows={[row({ status: 'pin_locked', pinLockedAt: '2026-11-21T05:12:00Z' })]} onOpen={vi.fn()} />);
    expect(screen.getByText('PIN locked').closest('span[class*="warning"]')).toBeTruthy();
  });

  it("opens a row's drawer from its menu, on the PIN form for a manager", async () => {
    const onOpen = vi.fn();
    const r = row({ status: 'pin_locked' });
    const { rerender } = render(<RosterTable rows={[r]} onOpen={onOpen} canManage />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Aline Uwase' }));
    await userEvent.click(await screen.findByText('Unlock with a new PIN'));
    expect(onOpen).toHaveBeenCalledWith(r, 'pin');
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(<RosterTable rows={[r]} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Aline Uwase' }));
    expect(screen.queryByText('Edit name or phone')).toBeNull();
  });
});

describe('AddAttendantDrawer', () => {
  const station = { id: 's1', name: 'Kigali Central', companyId: 'c1' };

  it('checks the number and PIN, then sends the number as the app will', async () => {
    post.mockResolvedValueOnce({ data: {} });
    const onDone = vi.fn();
    render(<AddAttendantDrawer open station={station} onClose={vi.fn()} onDone={onDone} />);
    await userEvent.type(screen.getByLabelText('Full name'), 'Grace Mukeshimana');
    await userEvent.type(screen.getByLabelText('Phone number'), '078 444 55');
    await userEvent.type(screen.getByLabelText('PIN'), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Add attendant' }));
    expect(screen.getByText(/Enter a Rwandan mobile number/)).toBeTruthy();
    expect(screen.getByText('Use 4 to 6 digits.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Phone number'), '66');
    await userEvent.type(screen.getByLabelText('PIN'), '21');
    await userEvent.click(screen.getByRole('button', { name: 'Add attendant' }));
    expect(post).toHaveBeenCalledWith('/users', {
      name: 'Grace Mukeshimana',
      phone: '+250784445566',
      pin: '1221',
      company_id: 'c1',
      station_id: 's1',
      role: 'attendant',
    });
    expect(onDone).toHaveBeenCalledWith('Grace Mukeshimana');
  });

  it('hides the PIN until asked', async () => {
    render(<AddAttendantDrawer open station={station} onClose={vi.fn()} onDone={vi.fn()} />);
    const pin = screen.getByLabelText('PIN');
    expect(pin.getAttribute('type')).toBe('password');
    await userEvent.click(screen.getByRole('button', { name: 'Show PIN' }));
    expect(pin.getAttribute('type')).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide PIN' }).getAttribute('aria-pressed')).toBe('true');
  });
});
