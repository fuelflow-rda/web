'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { IconButton } from '@/components/ui';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { RelaiLockup } from '@/components/brand';
import { cx } from '@/lib/cx';
import { container } from './parts';

/** Anchors on the landing page. Absolute so they work from the legal pages too. */
export const NAV_LINKS = [
  { href: '/#platform', label: 'Platform' },
  { href: '/#cards', label: 'Cards and vouchers' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#questions', label: 'Questions' },
  { href: '/#contact', label: 'Contact' },
] as const;

const link =
  'rounded-control text-15 font-medium text-text-secondary no-underline hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
const demo =
  'inline-flex h-10 items-center rounded-control bg-primary px-4 text-15 font-semibold text-on-primary no-underline hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** The public site's top bar (Pencil "Nav"): lockup, section links, theme, sign in, demo. */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  // The same control as the dashboard's top bar, so the choice carries across.
  // On phones it matches the menu button's 44 px touch target.
  const theme = (className?: string) => (
    <IconButton
      icon={mode === 'dark' ? Sun : Moon}
      label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
      onClick={toggleTheme}
      className={className}
    />
  );

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const signedIn = initialized && user !== null;
  const accountHref = signedIn && user ? getDefaultRouteForUser(user) : '/login';
  const accountLabel = signedIn ? 'Open dashboard' : 'Sign in';

  return (
    <header className="border-b border-border bg-bg">
      <div className={cx(container, 'flex h-19 items-center justify-between gap-6')}>
        <Link href="/" aria-label="Relai home" className="rounded-control text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
          <RelaiLockup height={25} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-9">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          {theme()}
          <Link href={accountHref} className={link}>
            {accountLabel}
          </Link>
          <Link href="/#contact" className={demo}>
            Request a demo
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          {theme('size-11')}
          <button
            type="button"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-control border border-border bg-surface text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" hidden={!open} className="border-t border-border lg:hidden">
        <nav aria-label="Primary, mobile" className={cx(container, 'flex flex-col gap-1 py-4')}>
          {[...NAV_LINKS, { href: accountHref, label: accountLabel }].map((l) => (
            <Link key={l.href} href={l.href} className={cx(link, 'flex min-h-11 items-center')} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/#contact" className={cx(demo, 'mt-3 h-11 justify-center')} onClick={() => setOpen(false)}>
            Request a demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
