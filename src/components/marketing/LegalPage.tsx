import React from 'react';
import { BUSINESS } from '@/lib/business';

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Shared frame for the legal documents: title, effective date, prose body. */
export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mk-section">
      <div className="mk-container">
        <header className="mk-legal-head">
          <h1 className="mk-h1">{title}</h1>
          <p className="mk-small">
            Last updated {formatDate(BUSINESS.policiesUpdated)}. Operated by {BUSINESS.legalName}.
          </p>
          <p className="mk-lead">{summary}</p>
        </header>
        <div className="mk-prose">{children}</div>
      </div>
    </article>
  );
}
