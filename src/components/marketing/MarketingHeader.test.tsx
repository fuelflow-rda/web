import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/store/auth-store', () => ({ useAuthStore: (pick: (s: unknown) => unknown) => pick({ user: null, initialized: true }) }));

const { MarketingHeader } = await import('./MarketingHeader');
const { useThemeStore } = await import('@/store/theme-store');

describe('MarketingHeader', () => {
  afterEach(() => {
    useThemeStore.getState().setMode('light');
    localStorage.clear();
  });

  it('switches the whole page between light and dark, as the dashboard does', async () => {
    useThemeStore.getState().setMode('light');
    render(<MarketingHeader />);
    // One for wide screens, one beside the phone menu button.
    const toDark = screen.getAllByRole('button', { name: 'Switch to dark theme' });
    expect(toDark).toHaveLength(2);
    await userEvent.click(toDark[0]);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getAllByRole('button', { name: 'Switch to light theme' })).toHaveLength(2);
    await userEvent.click(screen.getAllByRole('button', { name: 'Switch to light theme' })[1]);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('gives the phone button the menu button’s 44 px size', () => {
    render(<MarketingHeader />);
    const [wide, phone] = screen.getAllByRole('button', { name: /Switch to (dark|light) theme/ });
    expect(wide.className).toContain('size-10');
    expect(phone.className).toContain('size-11');
  });
});
