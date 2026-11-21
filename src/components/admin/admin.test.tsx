import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CompaniesTable, duration, shortAgo, stationWords } from './PlatformOverview';
import { lastActive } from './format';
import { RolePill } from './roles';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/admin' }));

describe('admin wording', () => {
  const now = Date.parse('2026-11-21T10:00:00Z');
  it('writes last sync the short way the design does', () => {
    expect(shortAgo(null, now)).toBe('Never');
    expect(shortAgo('2026-11-21T09:59:48Z', now)).toBe('12 s');
    expect(shortAgo('2026-11-21T09:58:00Z', now)).toBe('2 min');
    expect(shortAgo('2026-11-21T07:00:00Z', now)).toBe('3 h');
    expect(duration('2026-11-21T06:48:00Z', now)).toBe('3 h 12 min');
  });

  it('names a station as a station, once', () => {
    expect(stationWords('Rubavu')).toBe('Rubavu station');
    expect(stationWords('Remera Station ')).toBe('Remera Station');
    expect(stationWords('Stationery Road')).toBe('Stationery Road station');
  });

  it('says when someone was last active, and Now for anyone on shift', () => {
    expect(lastActive({ account_status: 'on_shift', last_seen_at: null }, now)).toBe('Now');
    expect(lastActive({ account_status: 'active', last_seen_at: null }, now)).toBe('Never');
    expect(lastActive({ account_status: 'active', last_seen_at: '2026-11-21T09:58:00Z' }, now)).toBe('2 min ago');
    expect(lastActive({ account_status: 'active', last_seen_at: '2026-11-21T04:12:00Z' }, now)).toBe('Today 06:12');
    expect(lastActive({ account_status: 'active', last_seen_at: '2026-11-21T07:00:00Z' }, now)).toBe('3 h ago');
    expect(lastActive({ account_status: 'active', last_seen_at: '2026-11-16T09:00:00Z' }, now)).toBe('Mon 16 Nov');
  });
});

describe('CompaniesTable', () => {
  it('flags a company with no administrator and words each status', () => {
    render(
      <CompaniesTable
        now={Date.parse('2026-11-21T10:00:00Z')}
        rows={[
          { id: 'a', name: 'City Gas Co', createdAt: '', admins: 2, stations: 4, stationsReporting: 4, revenueToday: 4102800, salesToday: 100, lastSyncAt: '2026-11-21T09:59:48Z', status: 'live' },
          { id: 'b', name: 'Muhazi Petroleum', createdAt: '', admins: 0, stations: 1, stationsReporting: 0, revenueToday: 0, salesToday: 0, lastSyncAt: null, status: 'onboarding' },
        ]}
      />,
    );
    const [, first, second] = screen.getAllByRole('row');
    expect(first.textContent).toContain('2 admins');
    expect(first.textContent).toContain('4,102,800');
    expect(first.textContent).toContain('12 s');
    expect(second.textContent).toContain('No admin yet');
    expect(second.textContent).toContain('Never');
    expect(within(second).getByText('Onboarding')).toBeTruthy();
    expect(within(first).getByRole('link').getAttribute('href')).toBe('/admin/companies/a');
  });
});

describe('RolePill', () => {
  it('names the role beside a dot coloured for it', () => {
    const { container, rerender } = render(<RolePill role="station_manager" />);
    expect(container.textContent).toBe('Station manager');
    expect(container.querySelector('[aria-hidden]')?.className).toContain('bg-info');
    rerender(<RolePill role="attendant" />);
    expect(container.querySelector('[aria-hidden]')?.className).toContain('bg-accent');
  });
});
