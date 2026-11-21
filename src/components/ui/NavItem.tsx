import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  /** A number to show at the end, such as unread notifications. */
  count?: number;
}

/**
 * A sidebar link. The sidebar is Night in both themes, so it uses the fixed
 * sidebar colours. One item is selected, marked by the champagne bar.
 */
export function NavItem({ href, label, icon: Icon, active = false, count }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex h-9 items-center gap-3 rounded-control px-3 text-14 no-underline transition-colors',
        active
          ? 'bg-sidebar-selected font-semibold text-sidebar-text'
          : 'font-medium text-sidebar-text-secondary hover:bg-sidebar-surface hover:text-sidebar-text',
        focusRing,
      )}
    >
      {active ? <span aria-hidden className="h-4 w-0.75 shrink-0 rounded-indicator bg-sidebar-indicator" /> : null}
      <Icon size={18} aria-hidden className={cx('shrink-0', active ? 'text-sidebar-text' : 'text-sidebar-text-muted')} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? (
        <span className="shrink-0 rounded-badge bg-sidebar-line px-1.5 py-px font-mono text-11 font-semibold text-sidebar-text">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
