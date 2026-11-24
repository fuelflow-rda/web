import Link from 'next/link';
import { RelaiLockup } from '@/components/brand';
import { BUSINESS } from '@/lib/business';
import { cx } from '@/lib/cx';
import { container } from './parts';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#platform', label: 'Platform' },
      { href: '/#cards', label: 'Cards and vouchers' },
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#questions', label: 'Questions' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#contact', label: 'Contact' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms and Conditions' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/refunds', label: 'Refund Policy' },
    ],
  },
];

const link = 'rounded-control text-15 text-text-secondary no-underline hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** The public site's footer, on night (Pencil "Footer"). */
export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer data-theme="dark" className="bg-bg text-text">
      <div className={cx(container, 'flex flex-col gap-14 pt-18 pb-10')}>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="flex flex-col gap-4 lg:w-102 lg:shrink-0">
            <RelaiLockup height={25} />
            <p className="m-0 text-15 text-text-secondary">Fuel and EV station management, built in {BUSINESS.address.city}.</p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title} className="flex flex-col gap-4">
                <h2 className="m-0 font-mono text-11 font-medium tracking-p80 text-text-muted uppercase">{col.title}</h2>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={link}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-6 text-13 text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">
            © {year} {BUSINESS.legalName} · {BUSINESS.address.city}, {BUSINESS.address.country}
          </p>
          <a href={`mailto:${BUSINESS.contactEmail}`} className={cx(link, 'text-13 text-text-muted')}>
            {BUSINESS.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
