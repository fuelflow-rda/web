import type { AuthUser } from '@/store/auth-store';

/** Default post-login route for a role. */
export function getDefaultRouteForUser(user: AuthUser): '/admin' | '/dashboard' {
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
    return '/admin';
  }
  return '/dashboard';
}
