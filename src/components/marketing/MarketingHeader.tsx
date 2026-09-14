'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { Logo } from './Logo';

/** Anchors on the landing page. Absolute so they work from the legal pages too. */
export const NAV_LINKS = [
  { href: '/#platform', label: 'Platform' },
  { href: '/#screens', label: 'Screens' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#contact', label: 'Contact' },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <header className="mk-hero-bg">
      <div className="mk-container mk-nav">
        <Logo />

        <nav aria-label="Primary" className="mk-nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="mk-nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mk-nav-actions">
          <Link href={accountHref} className="mk-nav-link">
            {accountLabel}
          </Link>
          <Link href="/#contact" className="mk-btn mk-btn-primary">
            Request a demo
          </Link>
        </div>

        <button
          type="button"
          className="mk-menu-btn"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div id="mobile-menu" hidden={!open} className="mk-mobile-menu">
        <nav aria-label="Primary, mobile" className="mk-container">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="mk-nav-link" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href={accountHref} className="mk-nav-link" onClick={() => setOpen(false)}>
            {accountLabel}
          </Link>
          <Link href="/#contact" className="mk-btn mk-btn-primary" onClick={() => setOpen(false)} style={{ marginTop: 12 }}>
            Request a demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
