import { cx } from '@/lib/cx';
import type { UserRow } from './data';

export const ROLE: Record<UserRow['role'], string> = {
  superadmin: 'Platform admin',
  company_admin: 'Company admin',
  station_manager: 'Station manager',
  attendant: 'Attendant',
};

/** The dot in each role pill, as designed: forest for admins, blue for managers, sand for attendants. */
const ROLE_DOT: Record<UserRow['role'], string> = {
  superadmin: 'bg-text',
  company_admin: 'bg-primary',
  station_manager: 'bg-info',
  attendant: 'bg-accent',
};

/** The design's role pill: outlined, with the role's coloured dot before its name. */
export function RolePill({ role }: { role: UserRow['role'] }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-chip border border-border bg-surface px-2 py-1 text-12 font-medium whitespace-nowrap text-text">
      <span aria-hidden className={cx('size-2 shrink-0 rounded-full', ROLE_DOT[role])} />
      {ROLE[role]}
    </span>
  );
}
