import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { DemoRequestForm } from '@/components/marketing/DemoRequestForm';
import {
  CompanyMock,
  OverviewMock,
  OverviewThumb,
  PhoneMock,
  PhoneThumb,
  PricesMock,
  ReconciliationMock,
  ShiftMock,
  TransactionsMock,
} from '@/components/marketing/mocks';
import { BUSINESS, formattedAddress } from '@/lib/business';

export const metadata: Metadata = {
  title: { absolute: 'Relai: fuel and EV station management for Rwanda' },
  description:
    'Live sales, shift control and automatic daily reconciliation for multi-station fuel and EV charging operators. Attendants record a sale in four taps, online or offline.',
};

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

/* Every number is a rule the software enforces, not a marketing figure. */
const stats = [
  { value: '4', unit: 'taps', label: 'to record a sale on the attendant app' },
  { value: '2', unit: 'min', label: 'until a transaction locks and cannot be edited' },
  { value: '5', unit: '', label: 'products on one platform: gasoline, diesel, three EV tiers' },
  { value: '7', unit: 'days', label: 'an attendant stays signed in on the phone, offline included' },
];

const platform = [
  {
    title: 'Attendant app for Android and iOS',
    text: 'Phone number and PIN sign-in. Sales queue on the device when the network drops and sync when it returns. Large buttons, sized for gloves and sunlight.',
    media: <PhoneThumb />,
  },
  {
    title: 'Live station overview',
    text: 'Revenue, volume, product mix and pump status for the current day, updated as sales are recorded. Recent transactions stream in without a refresh.',
    media: <OverviewThumb />,
  },
  {
    title: 'Daily reconciliation',
    text: 'Expected revenue against recorded revenue, per pump and per attendant, generated every night at midnight. Discrepancies are listed first.',
    media: <ReconciliationMock />,
  },
  {
    title: 'Reports and exports',
    text: 'Attendant, pump, station and company reports for any date range. Every table exports to PDF and Excel with the same figures the dashboard shows.',
    media: <CompanyMock />,
  },
];

const steps = [
  {
    title: 'Set up the company',
    text: 'We create your company and first administrator account. The administrator adds stations, pumps, charge points and managers.',
  },
  {
    title: 'Attendants start recording',
    text: 'Each attendant gets a phone number and PIN. They open a shift and record sales as they happen, with or without a connection.',
  },
  {
    title: 'Managers watch the day',
    text: 'The web dashboard shows the live overview, incoming transactions and alerts. Anything that looks wrong can be flagged on the spot.',
  },
  {
    title: 'Reconcile and export',
    text: 'At midnight, reconciliation runs for every station. Review the discrepancies in the morning, then export for accounting.',
  },
];

const products = [
  { name: 'Gasoline', unit: 'per litre', color: 'var(--mk-gasoline)' },
  { name: 'Diesel', unit: 'per litre', color: 'var(--mk-diesel)' },
  { name: 'EV AC', unit: 'per kWh', color: '#456b58' },
  { name: 'EV DC fast', unit: 'per kWh', color: '#286457' },
  { name: 'EV DC ultra-fast', unit: 'per kWh', color: '#14524a' },
];

const questions = [
  {
    tag: 'Connectivity',
    q: 'What happens when the forecourt loses signal?',
    a: 'The attendant app keeps recording. Each sale is queued on the phone and synced the moment the connection returns, with its original time and price.',
  },
  {
    tag: 'Records',
    q: 'Can a sale be edited after the fact?',
    a: 'No. An attendant can undo a mistake within two minutes of saving it. After that the transaction is locked for everyone, including us. The price in force at the time is stored with it.',
  },
  {
    tag: 'Access',
    q: 'Who sees what?',
    a: 'A station manager sees their station only. A company administrator sees every station in the company. Attendants use the mobile app and have no access to the web portal.',
  },
];

const benefits = [
  {
    title: 'Fewer end-of-day surprises',
    text: 'Expected against recorded revenue is computed per pump and per attendant, so a shortfall is traced to a shift rather than discovered at month end.',
  },
  {
    title: 'Works without a signal',
    text: 'The attendant app keeps a local queue and syncs when the connection returns. A weak network does not stop a sale from being recorded.',
  },
  {
    title: 'One view across all sites',
    text: 'Company administrators compare stations side by side and open any one of them for the detail.',
  },
  {
    title: 'Ready for EV charging',
    text: 'Charge points sit alongside pumps, priced per kilowatt hour by tier, on the same reports. Type 2, CCS, CHAdeMO, GB/T and Tesla connectors are supported.',
  },
  {
    title: 'Records your accountant can use',
    text: 'Every table exports to PDF and Excel for the date range you choose, with the same figures the dashboard shows.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="mk-hero-bg">
        <div className="mk-container mk-hero">
          <div className="mk-hero-copy">
            <h1 id="hero-heading" className="mk-h1">
              Fuel and EV Station{' '}
              <br className="mk-br" />
              Management{' '}
              <br className="mk-br" />
              for Rwanda
            </h1>
            <p className="mk-lead">
              Relai gives multi-station operators live sales, shift control and automatic daily
              reconciliation, with an attendant app that keeps working when the signal drops.
            </p>
            <div className="mk-hero-actions">
              <Link href="/#contact" className="mk-btn mk-btn-primary">
                Request a demo
              </Link>
              <Link href="/#how-it-works" className="mk-btn mk-btn-white">
                See how it works
              </Link>
            </div>
            <div className="mk-hero-proof">
              <div className="mk-hero-proof-chips" aria-hidden="true">
                <span style={{ background: 'var(--mk-gasoline)' }}>PMS</span>
                <span style={{ background: 'var(--mk-diesel)' }}>AGO</span>
                <span style={{ background: 'var(--mk-ev)' }}>EV</span>
              </div>
              <p className="mk-hero-proof-text">Gasoline, diesel and EV charging on one platform</p>
            </div>
          </div>

          <div className="mk-hero-visual">
            <div className="mk-hero-main">
              <OverviewMock />
            </div>
            <div className="mk-hero-phone">
              <PhoneMock />
            </div>
            <div className="mk-hero-thumbs" aria-hidden="true">
              <div className="mk-hero-thumb">
                <span className="mk-hero-thumb-label">Live overview</span>
                <span className="mk-hero-thumb-bars">
                  {[40, 60, 80, 55, 90, 70].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </span>
              </div>
              <div className="mk-hero-thumb is-active">
                <span className="mk-hero-thumb-label">New sale</span>
                <span className="mk-hero-thumb-bars">
                  {[70, 70, 30, 30, 100, 100].map((h, i) => (
                    <i key={i} style={{ height: `${h}%`, opacity: i > 3 ? 1 : 0.35 }} />
                  ))}
                </span>
              </div>
              <div className="mk-hero-thumb">
                <span className="mk-hero-thumb-label">Reconciliation</span>
                <span className="mk-hero-thumb-bars">
                  {[100, 100, 100, 85, 100, 100].map((h, i) => (
                    <i key={i} style={{ height: `${h}%`, opacity: 0.5 }} />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section aria-labelledby="about-heading" className="mk-about mk-section">
        <div className="mk-container">
          <div className="mk-about-head">
            <div>
              <p className="mk-eyebrow">About Relai</p>
              <h2 id="about-heading" className="mk-h2" style={{ marginTop: 16 }}>
                Built for How a Forecourt Runs
              </h2>
            </div>
            <p className="mk-statement">
              Relai is built in Kigali for operators who run more than one station and need
              every shift to add up. One app on the forecourt, one portal in the office, one set
              of records.
            </p>
          </div>

          <div className="mk-collage">
            <div className="mk-collage-left">
              <ShiftMock />
            </div>
            <div className="mk-collage-center">
              <OverviewMock />
            </div>
            <div className="mk-collage-right">
              <PricesMock />
            </div>
          </div>

          <dl className="mk-stats">
            {stats.map((s) => (
              <div key={s.label} className="mk-stat">
                <dt className="mk-stat-value">
                  {s.value}
                  {s.unit && <small>{s.unit}</small>}
                </dt>
                <dd className="mk-stat-label">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" aria-labelledby="platform-heading" className="mk-section" style={{ scrollMarginTop: 24 }}>
        <div className="mk-container">
          <div className="mk-head-center">
            <p className="mk-eyebrow">Platform</p>
            <h2 id="platform-heading" className="mk-h2">
              One System From the Nozzle to the Ledger
            </h2>
          </div>
          <ul className="mk-service-grid">
            {platform.map((p) => (
              <li key={p.title} className="mk-service-card">
                <div className="mk-service-media">
                  <div className="mock-vignette is-crop">{p.media}</div>
                </div>
                <div className="mk-service-body">
                  <h3 className="mk-h3">{p.title}</h3>
                  <p className="mk-body">{p.text}</p>
                  <Link href="/#screens" className="mk-textlink">
                    See the screens <ArrowIcon />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Screens */}
      <section id="screens" aria-labelledby="screens-heading" className="mk-screens mk-section" style={{ scrollMarginTop: 24 }}>
        <div className="mk-container">
          <div className="mk-screens-head">
            <div>
              <p className="mk-eyebrow">Screens</p>
              <h2 id="screens-heading" className="mk-h2">
                What You See Every Day
              </h2>
            </div>
            <Link href="/#contact" className="mk-btn mk-btn-outline">
              Request a walkthrough
            </Link>
          </div>

          <div className="mk-screens-grid">
            <div className="mk-screens-col is-left">
              <ScreenCard tag="Mobile app" title="New sale in four taps" tall>
                <div className="mock-vignette">
                  <PhoneMock />
                </div>
              </ScreenCard>
              <ScreenCard tag="Web portal" title="Live transaction feed" tall>
                <div className="mock-vignette">
                  <TransactionsMock />
                </div>
              </ScreenCard>
            </div>
            <div className="mk-screens-col is-right">
              <ScreenCard tag="Web portal" title="Station overview">
                <div className="mock-vignette">
                  <OverviewMock />
                </div>
              </ScreenCard>
              <ScreenCard tag="Web portal" title="Daily reconciliation" tall>
                <div className="mock-vignette">
                  <ReconciliationMock />
                </div>
              </ScreenCard>
              <ScreenCard tag="Web portal" title="Fuel prices and EV tariffs">
                <div className="mock-vignette">
                  <PricesMock />
                </div>
              </ScreenCard>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-heading" className="mk-section" style={{ scrollMarginTop: 24 }}>
        <div className="mk-container">
          <div className="mk-head-center">
            <p className="mk-eyebrow">How it works</p>
            <h2 id="how-heading" className="mk-h2">
              From First Login to the First Reconciled Day
            </h2>
          </div>
          <ol className="mk-process-grid">
            {steps.map((s, i) => (
              <li key={s.title} className="mk-process-card">
                <div className="mk-process-icon" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mk-h3">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mk-body">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why Relai */}
      <section aria-labelledby="why-heading" className="mk-section mk-why">
        <div className="mk-container">
          <div className="mk-head-split">
            <div>
              <p className="mk-eyebrow">Why Relai</p>
              <h2 id="why-heading" className="mk-h2">
                The Rules That Keep Records Honest
              </h2>
            </div>
            <p className="mk-body">
              Shortfalls, price changes and staff turnover are normal on a forecourt. Relai is
              designed so none of them can quietly change a record: transactions lock after two
              minutes, the price at the time of sale is stored with each one, and access follows
              the role.
            </p>
          </div>

          <ul className="mk-product-row" aria-label="Products supported">
            {products.map((p) => (
              <li key={p.name} className="mk-product-card">
                <i style={{ background: p.color }} aria-hidden="true" />
                <span>
                  {p.name}
                  <small>{p.unit}</small>
                </span>
              </li>
            ))}
          </ul>

          <div className="mk-feature-media">
            <div className="mk-feature-media-inner">
              <CompanyMock />
            </div>
            <Link href="/#contact" className="mk-feature-badge">
              <i aria-hidden="true">
                <ArrowIcon size={20} />
              </i>
              <span>
                <b>Book a live walkthrough</b>
                <span>20 minutes, on a video call or on site</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section aria-labelledby="questions-heading" className="mk-questions mk-section">
        <div className="mk-container">
          <div className="mk-head-center">
            <p className="mk-eyebrow">Questions</p>
            <h2 id="questions-heading" className="mk-h2">
              What Operators Ask Before Switching
            </h2>
          </div>
          <ul className="mk-question-row">
            {questions.map((q, i) => (
              <li
                key={q.q}
                className={`mk-question-card ${i === 1 ? 'is-featured' : `is-side${i === 2 ? ' is-right' : ''}`}`}
              >
                <span className="mk-question-tag">{q.tag}</span>
                <h3 className="mk-question-q">{q.q}</h3>
                <p className="mk-question-a">{q.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Benefits */}
      <section aria-labelledby="benefits-heading" className="mk-section">
        <div className="mk-container mk-benefits">
          <div className="mk-benefits-copy">
            <p className="mk-eyebrow">Benefits</p>
            <h2 id="benefits-heading" className="mk-h2">
              What Operators Get Out of Relai
            </h2>
            <div className="mk-benefits-media">
              <ReconciliationMock />
            </div>
          </div>
          <ol className="mk-benefit-list">
            {benefits.map((b, i) => (
              <li key={b.title} className="mk-benefit">
                <h3 className="mk-benefit-title">
                  <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {b.title}
                </h3>
                <p className="mk-body">{b.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" aria-labelledby="contact-heading" className="mk-section" style={{ paddingTop: 0, scrollMarginTop: 24 }}>
        <div className="mk-container">
          <div className="mk-contact-card">
            <div>
              <p className="mk-eyebrow">Request a demo</p>
              <h2 id="contact-heading" className="mk-h2">
                Ready to See Every Station in One Place?
              </h2>

              <div className="mk-contact-block">
                <h3>Easy ways to reach us</h3>
                <p className="mk-contact-line">
                  <b>Email:</b> <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>
                </p>
                {BUSINESS.phone && (
                  <p className="mk-contact-line">
                    <b>Phone:</b> <a href={`tel:${BUSINESS.phone.replace(/\s+/g, '')}`}>{BUSINESS.phone}</a>
                  </p>
                )}
                <p className="mk-contact-line">
                  <b>Existing customers:</b>{' '}
                  <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
                </p>
              </div>

              <div className="mk-contact-block">
                <h3>Our address</h3>
                <p className="mk-contact-line">{formattedAddress()}</p>
              </div>

              <div className="mk-contact-block">
                <div className="mk-contact-call">
                  <i aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </i>
                  <div>
                    <small>Sales enquiries</small>
                    <b>
                      <a href={`mailto:${BUSINESS.contactEmail}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {BUSINESS.contactEmail}
                      </a>
                    </b>
                  </div>
                </div>
              </div>
            </div>

            <div className="mk-form-card">
              <h3>Tell us about your stations</h3>
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ScreenCard({
  tag,
  title,
  tall = false,
  children,
}: {
  tag: string;
  title: string;
  tall?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="mk-screen">
      <div className={`mk-screen-media ${tall ? 'is-tall' : 'is-wide'}`}>{children}</div>
      <div className="mk-screen-meta">
        <div>
          <span className="mk-tag">{tag}</span>
          <h3 className="mk-h3">{title}</h3>
        </div>
        <Link href="/#contact" className="mk-circle-btn" aria-label={`Request a walkthrough of ${title}`}>
          <ArrowIcon size={22} />
        </Link>
      </div>
    </article>
  );
}
