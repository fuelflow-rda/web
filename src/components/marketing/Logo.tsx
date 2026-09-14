import React from 'react';
import Link from 'next/link';
import { BUSINESS } from '@/lib/business';
import { BrandMark } from '../BrandMark';

/** Wordmark with the Relai mark used across the portal. Links home. */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="mk-logo" aria-label={`${BUSINESS.productName} home`}>
      <span className="mk-logo-mark" aria-hidden="true">
        <BrandMark size={20} color="#ffffff" />
      </span>
      <span className={`mk-logo-word${onDark ? ' on-dark' : ''}`}>{BUSINESS.productName}</span>
    </Link>
  );
}
