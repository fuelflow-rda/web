import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser } from '@/store/auth-store';
import { RelaiLockup, RelaiMark } from '@/components/brand';
import { activeItem, navFor } from './nav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));

const user = (role: AuthUser['role']): AuthUser => ({ id: 'u1', email: 'c@x.test', name: 'Claudine Mukamana', role });
const labels = (role: AuthUser['role'], area: 'company' | 'platform') =>
  navFor(user(role), area).map((g) => `${g.label}: ${g.items.map((i) => i.label).join(', ')}`);

describe('navFor', () => {
  it('gives a station the design’s groups, with Company for company admins only', () => {
    expect(labels('MANAGER', 'company')).toEqual([
      'Main: Overview, Transactions',
      'Operations: Reconciliation, Pumps and chargers, Stock, Attendants, Prices',
      'Customers: Customers, Vouchers',
      'System: Notifications, Settings',
    ]);
    expect(labels('ADMIN', 'company')[3]).toBe('System: Notifications, Company, Settings');
    // The platform admin reads customers from a company's page, not a station's sidebar.
    expect(labels('SUPERADMIN', 'company')[2]).toBe('System: Notifications, Platform, Settings');
  });

  it('gives the platform its own groups', () => {
    expect(labels('SUPERADMIN', 'platform')).toEqual([
      'Platform: Overview, Companies, Stations, Pumps and chargers, Users',
      'System: Sync health, Audit log, Settings',
    ]);
  });
});

describe('activeItem', () => {
  const platform = navFor(user('SUPERADMIN'), 'platform');
  it.each([
    ['/admin', 'Overview'],
    ['/admin/companies', 'Companies'],
    ['/admin/companies/123', 'Companies'],
    ['/settings', 'Settings'],
  ])('%s selects %s', (path, label) => {
    expect(activeItem(platform, path)?.label).toBe(label);
  });

  it('does not select a page whose path merely starts the same way', () => {
    const company = navFor(user('ADMIN'), 'company');
    expect(activeItem(company, '/pumps-old')).toBeUndefined();
  });
});

describe('brand', () => {
  it('names the lockup once and hides its parts', () => {
    render(<RelaiLockup />);
    expect(screen.getByRole('img', { name: 'Relai' })).toBeTruthy();
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('names a mark that stands alone, and hides one that does not', () => {
    const { rerender } = render(<RelaiMark title="Relai" />);
    expect(screen.getByRole('img', { name: 'Relai' })).toBeTruthy();
    rerender(<RelaiMark />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('thickens the stroke below 20 px so the loop survives at favicon size', () => {
    const { container, rerender } = render(<RelaiMark size={16} />);
    expect(container.querySelector('path')?.getAttribute('stroke-width')).toBe('7');
    rerender(<RelaiMark size={48} />);
    expect(container.querySelector('path')?.getAttribute('stroke-width')).toBe('6');
  });
});

describe('Sidebar', () => {
  const base = {
    area: 'company' as const,
    groups: navFor(user('ADMIN'), 'company'),
    pathname: '/reconciliation',
    user: user('ADMIN'),
    companyName: 'City Gas Co',
    stations: [{ id: 's1', name: 'Kigali Central' }],
    currentStationId: 's1',
    onStationChange: vi.fn(),
    counts: { review: 2, unread: undefined },
    onSignOut: vi.fn(),
  };

  it('marks the current page, shows real counts only, and says who is signed in', () => {
    render(<Sidebar {...base} />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const current = within(nav).getByRole('link', { current: 'page' });
    expect(current.textContent).toContain('Reconciliation');
    expect(current.textContent).toContain('2');
    expect(within(nav).getByRole('link', { name: /Notifications/ }).textContent).toBe('Notifications');
    expect(screen.getByText('Company admin · City Gas Co')).toBeTruthy();
  });

  it('shows one station as text, and several as a switcher', () => {
    const { rerender } = render(<Sidebar {...base} />);
    expect(screen.queryByRole('button', { name: /Change station/ })).toBeNull();
    rerender(<Sidebar {...base} stations={[...base.stations, { id: 's2', name: 'Remera' }]} />);
    expect(screen.getByRole('button', { name: 'Station: Kigali Central. Change station' })).toBeTruthy();
  });

  it('signs out from the foot of the sidebar', async () => {
    const onSignOut = vi.fn();
    render(<Sidebar {...base} onSignOut={onSignOut} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});

describe('TopBar', () => {
  it('shows where you are, the page last and current', () => {
    render(
      <TopBar
        crumbs={[{ label: 'City Gas Co' }, { label: 'Kigali Central', href: '/dashboard' }, { label: 'Overview' }]}
        searchPlaceholder="Search plates, phones, attendants"
        onOpenSearch={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenNotification={vi.fn()}
      />,
    );
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByText('Overview').getAttribute('aria-current')).toBe('page');
    expect(within(crumbs).getByRole('link', { name: 'Kigali Central' }).getAttribute('href')).toBe('/dashboard');
  });

  it('opens search from the box and from the phone-sized button', async () => {
    const onOpenSearch = vi.fn();
    render(
      <TopBar crumbs={[{ label: 'Overview' }]} searchPlaceholder="Search" onOpenSearch={onOpenSearch} onOpenMenu={vi.fn()} onOpenNotification={vi.fn()} />,
    );
    for (const button of screen.getAllByRole('button', { name: 'Search' })) await userEvent.click(button);
    expect(onOpenSearch).toHaveBeenCalledTimes(2);
  });
});
