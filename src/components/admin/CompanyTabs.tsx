'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/lib/cx';
import { focusRing } from '@/components/ui/focus';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'People' },
  { href: '/admin/stations', label: 'Stations' },
  { href: '/admin/pumps', label: 'Pumps and chargers' },
  { href: '/admin/audit', label: 'Audit log' },
];

/**
 * The company admin's own pages, under "Company" in the sidebar. Not in the
 * design (it shows the platform's view of a company); this keeps the existing
 * stations, people and pumps pages one click apart.
 */
export function CompanyTabs() {
  const pathname = usePathname();
  const active = [...TABS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`));
  return (
    <nav aria-label="Company" className="-mt-2 flex gap-7 overflow-x-auto border-b border-border">
      {TABS.map((t) => {
        const on = active?.href === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={cx(
              '-mb-px border-b-2 pb-2.5 text-14 whitespace-nowrap no-underline transition-colors',
              on
                ? 'border-text font-semibold text-text'
                : 'border-transparent font-medium text-text-secondary hover:text-text',
              focusRing,
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
