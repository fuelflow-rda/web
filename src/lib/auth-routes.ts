import type { AuthUser } from '@/store/auth-store';

/**
 * Where a person lands after signing in. Company admins start on their
 * station's Overview, as the design shows; their company pages are one click
 * away under "Company". Platform administrators start on the platform.
 */
export function getDefaultRouteForUser(user: AuthUser): '/admin' | '/dashboard' {
  return user.role === 'SUPERADMIN' ? '/admin' : '/dashboard';
}
