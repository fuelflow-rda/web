import React from 'react';
import Link from 'next/link';
import { BUSINESS, formattedAddress } from '@/lib/business';
import { Logo } from './Logo';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/#platform', label: 'Platform' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#contact', label: 'Contact' },
  { href: '/login', label: 'Sign in' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms and Conditions' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/refunds', label: 'Refund Policy' },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-grid">
          <div>
            <Logo onDark />
            <p className="mk-footer-tagline">Fuel and EV station management</p>
            <p className="mk-footer-desc">
              Live sales, shift control and automatic daily reconciliation for operators in Rwanda.
            </p>
          </div>

          <nav className="mk-footer-col" aria-label="Quick links">
            <h2>Quick links</h2>
            <ul>
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="mk-footer-col is-legal" aria-label="Legal">
            <h2>Legal</h2>
            <ul>
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <ul className="mk-footer-contact">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>{formattedAddress()}</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>
              </li>
              {BUSINESS.phone && (
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                  </svg>
                  <a href={`tel:${BUSINESS.phone.replace(/\s+/g, '')}`}>{BUSINESS.phone}</a>
                </li>
              )}
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span>Support for existing customers: <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mk-footer-bottom">
          <p>
            Copyright {year} {BUSINESS.legalName}. All rights reserved. {formattedAddress()}.
            {BUSINESS.registrationNumber ? ` Company registration number ${BUSINESS.registrationNumber}.` : ''}
            {BUSINESS.tin ? ` TIN ${BUSINESS.tin}.` : ''}
          </p>
        </div>
      </div>
    </footer>
  );
}
