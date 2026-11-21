import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearStoredSession, readStoredToken, readStoredUser, storeSession } from '@/lib/stored-session';
import { getDefaultRouteForUser } from '@/lib/auth-routes';

const post = vi.fn();
const replace = vi.fn();
const login = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => post(...a) } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock('@/store/auth-store', () => ({ useAuthStore: (pick: (s: unknown) => unknown) => pick({ login }) }));

const { SetPasswordFlow } = await import('./SetPasswordFlow');

describe('stored session', () => {
  afterEach(() => clearStoredSession());

  it('keeps a remembered session past the browser closing, and a short one only for the tab', () => {
    storeSession('t1', '{"id":"u"}', true);
    expect(localStorage.getItem('relai_token')).toBe('t1');
    storeSession('t2', '{"id":"u"}', false);
    expect(localStorage.getItem('relai_token')).toBeNull();
    expect(sessionStorage.getItem('relai_token')).toBe('t2');
    expect([readStoredToken(), readStoredUser()]).toEqual(['t2', '{"id":"u"}']);
    clearStoredSession();
    expect(readStoredToken()).toBeNull();
  });
});

describe('getDefaultRouteForUser', () => {
  it('starts company people on their station and the platform on the platform', () => {
    const u = (role: 'ADMIN' | 'MANAGER' | 'SUPERADMIN') => ({ id: '1', email: '', name: '', role });
    expect(getDefaultRouteForUser(u('ADMIN'))).toBe('/dashboard');
    expect(getDefaultRouteForUser(u('MANAGER'))).toBe('/dashboard');
    expect(getDefaultRouteForUser(u('SUPERADMIN'))).toBe('/admin');
  });
});

describe('SetPasswordFlow', () => {
  const TOKEN = 'A'.repeat(43);
  beforeEach(() => {
    post.mockReset();
    replace.mockReset();
    login.mockReset();
    window.history.replaceState(null, '', `/accept-invite#token=${TOKEN}`);
  });

  it('takes the token out of the address bar, checks it and welcomes the person', async () => {
    post.mockResolvedValueOnce({ data: { purpose: 'invite', name: 'Finance', email: 'finance@citygas.test', companyName: 'City Gas Co' } });
    render(<SetPasswordFlow expected="invite" />);
    expect(window.location.hash).toBe('');
    expect(await screen.findByRole('heading', { name: 'Welcome to City Gas Co' })).toBeTruthy();
    expect(post).toHaveBeenCalledWith('/auth/invitations/inspect', { token: TOKEN });
  });

  it('asks for matching passwords of at least 8 characters before sending anything', async () => {
    post.mockResolvedValueOnce({ data: { purpose: 'invite', name: null, email: 'f@x.test', companyName: null } });
    render(<SetPasswordFlow expected="invite" />);
    await userEvent.type(await screen.findByLabelText('Password'), 'short');
    await userEvent.type(screen.getByLabelText('Type it again'), 'other');
    await userEvent.click(screen.getByRole('button', { name: 'Set password and sign in' }));
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(screen.getByText('The two passwords are different.')).toBeTruthy();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('sets the password, signs in, and goes to the person’s first page', async () => {
    post
      .mockResolvedValueOnce({ data: { purpose: 'invite', name: 'Finance', email: 'finance@citygas.test', companyName: 'City Gas Co' } })
      .mockResolvedValueOnce({ data: { email: 'finance@citygas.test' } });
    login.mockResolvedValueOnce({ id: 'u', email: 'finance@citygas.test', name: 'Finance', role: 'ADMIN' });
    render(<SetPasswordFlow expected="invite" />);
    await userEvent.type(await screen.findByLabelText('Password'), 'kigali-central');
    await userEvent.type(screen.getByLabelText('Type it again'), 'kigali-central');
    await userEvent.click(screen.getByRole('button', { name: 'Set password and sign in' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(post).toHaveBeenLastCalledWith('/auth/invitations/accept', { token: TOKEN, password: 'kigali-central' });
    expect(login).toHaveBeenCalledWith('finance@citygas.test', 'kigali-central', true);
  });

  it('says why a link cannot be used', async () => {
    post.mockRejectedValueOnce(new Error('This link has already been used. Sign in, or ask for a new one.'));
    render(<SetPasswordFlow expected="invite" />);
    expect(await screen.findByText('This link has already been used. Sign in, or ask for a new one.')).toBeTruthy();
  });

  it('does not call the API without a token', async () => {
    window.history.replaceState(null, '', '/accept-invite');
    render(<SetPasswordFlow expected="invite" />);
    expect(await screen.findByText(/This link is incomplete/)).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});
