import type { Metadata } from 'next';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, MapPin } from 'lucide-react';
import { CardsAndVouchersPoints, CardsAndVouchersVisual } from '@/components/marketing/CardsAndVouchers';
import { DemoRequestForm } from '@/components/marketing/DemoRequestForm';
import { HeroVisual } from '@/components/marketing/HeroVisual';
import { PlatformCards } from '@/components/marketing/PlatformCards';
import { container, Display, nightEdge, Overline, PRODUCTS, SectionHead } from '@/components/marketing/parts';
import { BUSINESS, formattedAddress } from '@/lib/business';
import { cx } from '@/lib/cx';
import evPhoto from '@/assets/photos/ev-charging.jpg';
import forecourtPhoto from '@/assets/photos/forecourt-dusk.jpg';
import managerPhoto from '@/assets/photos/manager-office.jpg';

export const metadata: Metadata = {
  title: { absolute: 'Relai: fuel and EV station management for Rwanda' },
  description:
    'Live sales, shift control and automatic daily reconciliation for multi-station fuel and EV charging operators. Attendants record a sale in four taps, online or offline.',
};

/* Every number is a rule the software enforces, not a marketing figure. */
const FACTS = [
  { value: '4', unit: 'taps', label: 'to record a sale on the attendant app' },
  { value: '2', unit: 'min', label: 'until a transaction locks and cannot be edited' },
  { value: '5', unit: 'products', label: 'on one platform: gasoline, diesel, three EV tiers' },
  { value: '7', unit: 'days', label: 'an attendant stays signed in on the phone, offline included' },
];

const STEPS = [
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
    text: 'Overnight, reconciliation runs for every station. Review the discrepancies in the morning, then export for accounting.',
  },
];

const BENEFITS = [
  {
    title: 'Fewer end-of-day surprises',
    text: 'Expected against recorded revenue is computed per pump and per attendant, so a shortfall is traced to a shift rather than discovered at month end.',
  },
  {
    title: 'Works without internet',
    text: 'The attendant app keeps a local queue and syncs when the internet is back. Losing the internet does not stop a sale from being recorded.',
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

const QUESTIONS = [
  {
    topic: 'Connectivity',
    q: 'What happens when the internet goes down at the forecourt?',
    a: 'The attendant app keeps recording. Each sale is queued on the phone and synced the moment the internet is back, with its original time and price.',
  },
  {
    topic: 'Customers',
    q: 'Can customers pay with a prepaid balance or a voucher?',
    a: 'Yes. Give a company or a person an account with a prepaid balance and membership cards, or print vouchers. The attendant scans the QR code at the pump, the balance or voucher pays, and any rest is paid in cash or MoMo. Paying from a balance or a voucher needs internet; a card’s discount does not.',
  },
  {
    topic: 'Records',
    q: 'Can a sale be edited after the fact?',
    a: 'No. An attendant can undo a mistake within two minutes of saving it. After that the transaction is locked for everyone, including us. The price in force at the time is stored with it.',
  },
  {
    topic: 'Access',
    q: 'Who sees what?',
    a: 'A station manager sees their station only. A company administrator sees every station in the company. Attendants use the mobile app and have no access to the web portal.',
  },
];

/** Where Relai is used. The photos are AI-generated stand-ins until real pilot-station photography replaces them. */
const PLACES: { photo: StaticImageData; alt: string; title: string; text: string }[] = [
  {
    photo: forecourtPhoto,
    alt: 'Attendants in green vests serving cars and moto-taxis at a fuel station at dusk, with an EV charger to one side',
    title: 'On the forecourt',
    text: 'Attendants sign in with a phone number and PIN and record each sale at the pump, with or without internet.',
  },
  {
    photo: managerPhoto,
    alt: 'A station manager smiles at sales charts on his laptop in an office overlooking the forecourt',
    title: 'In the office',
    text: 'Managers follow the day’s sales as they are recorded and open the reconciliation in the morning.',
  },
  {
    photo: evPhoto,
    alt: 'A driver checks his phone while his white electric car charges at a station charger',
    title: 'At the charger',
    text: 'Charging sessions are recorded in kilowatt hours, on the same reports as fuel.',
  },
];

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** The public landing page (Pencil "Landing / Home"). */
export default function LandingPage() {
  return (
    <>
      <section data-theme="dark" aria-labelledby="hero-heading" className="overflow-hidden bg-bg text-text">
        <div className={cx(container, 'grid items-start gap-10 pt-16 pb-20 lg:pt-24 xl:grid-cols-[600px_minmax(0,1fr)] xl:pb-0')}>
          <div className="flex max-w-150 flex-col gap-8 xl:pt-6 xl:pb-24">
            <Overline tone="accent">Fuel and EV station management · Rwanda</Overline>
            <h1 id="hero-heading" className="m-0 font-display text-48 leading-none font-normal tracking-n10 sm:text-56 lg:text-80">
              Every litre and every kilowatt hour, accounted for.
            </h1>
            <p className="m-0 max-w-135 text-18 leading-[1.55] text-text-secondary lg:text-20">
              Relai gives multi-station operators live sales, shift control and automatic daily reconciliation, with an
              attendant app that keeps working when the internet drops.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/#contact"
                className={cx('inline-flex h-12 items-center gap-2 rounded-control bg-primary px-6 text-16 font-semibold text-on-primary no-underline hover:bg-primary-hover', focus)}
              >
                <ArrowRight size={18} aria-hidden />
                Request a demo
              </Link>
              <Link
                href="/#how-it-works"
                className={cx('inline-flex h-12 items-center rounded-control border border-border-strong px-6 text-16 font-semibold text-text no-underline hover:bg-surface', focus)}
              >
                See how it works
              </Link>
            </div>
            <ul aria-label="Products" className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
              {PRODUCTS.map((p) => (
                <li key={p.label} className="flex items-center gap-2 text-14 text-text-secondary">
                  <span aria-hidden className={cx('size-2 rounded-full', p.dot)} />
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section aria-label="Relai in four numbers" className="bg-surface-muted">
        <ul className={cx(container, 'm-0 grid list-none gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0')}>
          {FACTS.map((f, i) => (
            <li key={f.unit} className={cx('flex flex-col gap-2.5 lg:px-8', i === 0 ? 'lg:pl-0' : 'lg:border-l lg:border-border-strong/40')}>
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-52 leading-none font-medium tracking-n20">{f.value}</span>
                <span className="text-18 font-medium text-text-secondary">{f.unit}</span>
              </span>
              <span className="text-15 leading-[1.45] text-text-secondary">{f.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="platform" aria-labelledby="platform-heading" className="scroll-mt-6">
        <div className={cx(container, 'flex flex-col gap-14 py-20 lg:py-30')}>
          <SectionHead
            overline="Platform"
            titleId="platform-heading"
            title="One system from the nozzle to the ledger."
            lead="One app on the forecourt, one portal in the office, one set of numbers that every shift has to add up to."
          />
          <PlatformCards />
        </div>
      </section>

      <section id="cards" aria-labelledby="cards-heading" className="scroll-mt-6 bg-surface-muted">
        <div className={cx(container, 'grid gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-20 lg:py-30')}>
          <div className="flex flex-col gap-12">
            <SectionHead
              overline="Customers"
              titleId="cards-heading"
              title="Membership cards and vouchers, scanned at the pump."
              lead="Give fleets and regular drivers an account at your stations. The attendant scans the code, and Relai applies the discount or takes the payment from the balance or the voucher."
            />
            <CardsAndVouchersPoints />
          </div>
          <CardsAndVouchersVisual />
        </div>
      </section>

      <section aria-labelledby="sites-heading" className="py-20 lg:py-30">
        <div className={cx(container, 'flex flex-col gap-12')}>
          <SectionHead overline="On site" titleId="sites-heading" title="Made for the forecourt, the office and the charger." />
          <ul className="m-0 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-6">
            {PLACES.map((p) => (
              <li key={p.title} className="flex flex-col gap-4">
                <div className="relative aspect-4/3 overflow-hidden rounded-16">
                  <Image src={p.photo} alt={p.alt} fill placeholder="blur" sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </div>
                <h3 className="m-0 text-22 font-semibold tracking-n10">{p.title}</h3>
                <p className="m-0 text-16 leading-[1.55] text-text-secondary">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-6 bg-surface-muted">
        <div className={cx(container, 'flex flex-col gap-14 py-20 lg:py-28')}>
          <SectionHead overline="How it works" titleId="how-heading" title="From first login to the first reconciled day." />
          <ol className="m-0 grid list-none gap-10 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-4">
                <span aria-hidden className="flex items-center">
                  <span className="size-3 shrink-0 rounded-full bg-accent" />
                  {i < STEPS.length - 1 ? <span className="hidden h-0.5 flex-1 bg-accent/70 lg:block" /> : null}
                </span>
                <span className="font-mono text-14 font-semibold text-accent-text">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="m-0 text-22 font-semibold tracking-n10">{s.title}</h3>
                <p className="m-0 text-16 leading-[1.55] text-text-secondary">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="rules-heading" className="bg-inverse-bg text-inverse-text">
        <div className={cx(container, 'grid gap-14 py-20 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-24 lg:py-30')}>
          <div className="flex flex-col gap-6">
            <Overline tone="inverse-accent">Why operators switch</Overline>
            <Display id="rules-heading">The rules that keep records honest.</Display>
            <p className="m-0 text-17 leading-[1.6] text-inverse-text-secondary">
              Shortfalls, price changes and staff turnover are normal on a forecourt. Relai is designed so none of them
              can quietly change a record: transactions lock two minutes after they are saved, and every sale keeps the
              price that was in force.
            </p>
            <dl aria-label="An example shift" className="m-0 flex flex-wrap gap-x-10 gap-y-4 border-t border-inverse-text-muted/30 pt-6">
              {[
                { k: 'Metered', v: '1,482.0 L', danger: false },
                { k: 'Recorded', v: '1,478.8 L', danger: false },
                { k: 'Variance', v: '−3.2 L', danger: true },
              ].map((f) => (
                <div key={f.k} className="flex flex-col gap-1">
                  <dt className="text-13 text-inverse-text-muted">{f.k}</dt>
                  <dd className={cx('m-0 font-mono text-20 font-medium', f.danger ? 'text-inverse-danger' : 'text-inverse-text')}>{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ol className="m-0 flex list-none flex-col border-b border-inverse-text-muted/30 p-0">
            {BENEFITS.map((b, i) => (
              <li key={b.title} className="flex gap-6 border-t border-inverse-text-muted/30 py-7">
                <span className="pt-1 font-mono text-14 font-semibold text-inverse-accent">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex flex-col gap-2">
                  <h3 className="m-0 text-22 font-semibold tracking-n10">{b.title}</h3>
                  <p className="m-0 text-16 leading-[1.55] text-inverse-text-secondary">{b.text}</p>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="questions" aria-labelledby="questions-heading" className="scroll-mt-6">
        <div className={cx(container, 'grid gap-12 py-20 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24 lg:py-30')}>
          <div className="flex flex-col gap-4.5">
            <Overline>Questions</Overline>
            <Display id="questions-heading" size={48}>
              What operators ask before switching.
            </Display>
          </div>
          <div className="flex flex-col border-b border-border">
            {QUESTIONS.map((x) => (
              <div key={x.q} className="flex flex-col gap-3 border-t border-border py-8">
                <Overline tone="text-muted" className="text-11">
                  {x.topic}
                </Overline>
                <h3 className="m-0 text-22 font-semibold tracking-n10">{x.q}</h3>
                <p className="m-0 text-17 leading-[1.6] text-text-secondary">{x.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-6">
        <div className={cx(container, 'pb-20 lg:pb-30')}>
          <div data-theme="dark" className={cx('grid gap-12 rounded-20 bg-bg p-6 text-text sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-16', nightEdge)}>
            <div className="flex flex-col gap-6">
              <Overline tone="accent">Contact</Overline>
              <Display id="contact-heading">Ready to see every station in one place?</Display>
              <p className="m-0 max-w-110 text-17 leading-[1.6] text-text-secondary">
                Tell us how many stations you run. We will walk you through the dashboard and the attendant app with your
                own pumps and prices.
              </p>
              <ul className="m-0 mt-auto flex list-none flex-col gap-3 p-0 pt-6 text-16">
                <li className="flex items-center gap-3">
                  <Mail size={18} aria-hidden className="text-text-secondary" />
                  <a href={`mailto:${BUSINESS.contactEmail}`} className={cx('rounded-control text-text no-underline hover:underline', focus)}>
                    {BUSINESS.contactEmail}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={18} aria-hidden className="text-text-secondary" />
                  <span>{formattedAddress()}</span>
                </li>
              </ul>
            </div>
            <div data-theme="light" className="rounded-16 bg-surface p-6 text-text sm:p-8">
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
