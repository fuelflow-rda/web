import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  Building2,
  Fuel,
  LayoutDashboard,
  MapPin,
  ReceiptText,
  Scale,
  ScrollText,
  Settings,
  Tag,
  Users,
  Briefcase,
  ShieldCheck,
  IdCard,
  Ticket,
} from 'lucide-react';
import type { AuthUser } from '@/store/auth-store';

export type ShellArea = 'company' | 'platform';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Paths that also select this item, beyond href and its sub-paths. */
  match?: string[];
  /** Which count, if any, the item shows. */
  count?: 'review' | 'unread';
}

export interface NavGroup {
  label: string;
  items: NavLink[];
}

/**
 * The sidebar for a person in an area. Groups and labels follow the Pencil
 * sidebars; "Company" (company admins) and "Platform" (platform administrators
 * visiting a station) are additions so that pages that exist stay reachable.
 */
export function navFor(user: AuthUser, area: ShellArea): NavGroup[] {
  if (area === 'platform') {
    return [
      {
        label: 'Platform',
        items: [
          { href: '/admin', label: 'Overview', icon: LayoutDashboard },
          { href: '/admin/companies', label: 'Companies', icon: Building2 },
          { href: '/admin/stations', label: 'Stations', icon: MapPin },
          { href: '/admin/pumps', label: 'Pumps and chargers', icon: Fuel },
          { href: '/admin/users', label: 'Users', icon: Users },
        ],
      },
      {
        label: 'System',
        items: [
          { href: '/admin/sync-health', label: 'Sync health', icon: Activity },
          { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
          { href: '/settings', label: 'Settings', icon: Settings },
        ],
      },
    ];
  }

  const system: NavLink[] = [{ href: '/notifications', label: 'Notifications', icon: Bell, count: 'unread' }];
  if (user.role === 'ADMIN') system.push({ href: '/admin', label: 'Company', icon: Briefcase });
  if (user.role === 'SUPERADMIN') system.push({ href: '/admin', label: 'Platform', icon: ShieldCheck });
  system.push({ href: '/settings', label: 'Settings', icon: Settings });

  return [
    {
      label: 'Main',
      items: [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/transactions', label: 'Transactions', icon: ReceiptText },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/reconciliation', label: 'Reconciliation', icon: Scale, count: 'review' },
        { href: '/pumps', label: 'Pumps and chargers', icon: Fuel },
        { href: '/attendants', label: 'Attendants', icon: Users },
        { href: '/fuel-prices', label: 'Prices', icon: Tag },
      ],
    },
    // Customers are the company's, across its stations: company admins manage
    // them and station managers read them. The platform admin reads them from
    // a company's page instead.
    ...(user.role === 'ADMIN' || user.role === 'MANAGER'
      ? [
          {
            label: 'Customers',
            items: [
              { href: '/customers', label: 'Customers', icon: IdCard },
              { href: '/vouchers', label: 'Vouchers', icon: Ticket },
            ],
          },
        ]
      : []),
    { label: 'System', items: system },
  ];
}

/** The item a path belongs to: the longest href that the path equals or sits under. */
export function activeItem(groups: NavGroup[], pathname: string): NavLink | undefined {
  const items = groups.flatMap((g) => g.items);
  const hit = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return items
    .filter((i) => hit(i.href) || i.match?.some(hit))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export const ROLE_LABEL: Record<AuthUser['role'], string> = {
  SUPERADMIN: 'Platform administrator',
  ADMIN: 'Company admin',
  MANAGER: 'Station manager',
  ATTENDANT: 'Attendant',
};
