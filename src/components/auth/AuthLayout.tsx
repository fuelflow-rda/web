import Link from 'next/link';
import type { ReactNode } from 'react';
import { RelaiLockup } from '@/components/brand';
import { focusRing } from '@/components/ui/focus';
import { BUSINESS } from '@/lib/business';
import { cx } from '@/lib/cx';

/**
 * The Pencil "Web / Sign in" frame: the Night brand panel on the left (from
 * the large breakpoint up) and the form, centred, on the right. Shared by
 * sign in, reset password, accept invitation and set password.
 */
export function AuthLayout({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-160 shrink-0 flex-col justify-between border-r border-sidebar-line bg-sidebar-bg px-16 py-12 lg:flex">
        <span className="text-sidebar-text">
          <RelaiLockup />
        </span>
        <div className="flex max-w-128 flex-col gap-7">
          <p className="m-0 font-mono text-12 font-medium tracking-p80 text-accent uppercase">
            For station managers and company administrators
          </p>
          <p className="m-0 type-display-xl text-sidebar-text">Every litre, accounted for.</p>
          <p className="m-0 max-w-110 text-17 leading-relaxed text-sidebar-text-secondary">
            Live sales from every pump, shifts that close on meter readings, and a reconciliation waiting for you
            each morning.
          </p>
          {/* An illustration of the day's check, not live data. */}
          <dl aria-label="Example meter check" className="m-0 flex gap-10 border-t border-sidebar-line pt-6">
            {[
              ['Metered', '1,482.0 L', 'text-sidebar-text'],
              ['Recorded', '1,478.8 L', 'text-sidebar-text'],
              ['Variance', '−3.2 L', 'text-inverse-danger'],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <dt className="text-13 text-sidebar-text-muted">{label}</dt>
                <dd className={cx('m-0 type-data-l', tone)}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="m-0 text-13 text-sidebar-text-muted">
          {BUSINESS.legalName} · {BUSINESS.address.city}, {BUSINESS.address.country}
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-12 px-6 py-12">
        <div className="flex w-full max-w-100 flex-col gap-6">
          <span className="text-primary lg:hidden">
            <RelaiLockup />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="m-0 type-h1 text-text">{title}</h1>
            {description ? <p className="m-0 text-15 text-text-secondary">{description}</p> : null}
          </div>
          {children}
        </div>
        <nav aria-label="Legal" className="flex gap-5">
          {[
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
            ['Cookies', '/cookies'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className={cx('text-13 text-text-muted no-underline hover:text-text', focusRing)}>
              {label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
