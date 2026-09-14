import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';
import { BUSINESS, formattedAddress } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: `The terms on which ${BUSINESS.legalName} provides the Relai website, web portal and attendant app.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      summary="These terms govern use of the Relai website and, together with a signed order form, use of the Relai service by our customers and their staff. Please read them before using either."
    >
      <h2>1. Who we are</h2>
      <p>
        The Relai website and service are provided by {BUSINESS.legalName}, {formattedAddress()}
        {BUSINESS.registrationNumber ? `, company registration number ${BUSINESS.registrationNumber}` : ''}.
        Contact: <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>.
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li><strong>Service</strong>: the Relai web portal, attendant mobile app and the API behind them.</li>
        <li><strong>Customer</strong>: the company that has signed an order form with us for the Service.</li>
        <li><strong>User</strong>: a person with an account on the Service, created by or for a Customer.</li>
        <li><strong>Customer Data</strong>: all records a Customer and its Users enter into the Service, including transactions, shifts, prices and reports.</li>
        <li><strong>Order Form</strong>: the document that names the Customer, the stations covered, the fees and the start date.</li>
      </ul>

      <h2>3. Using the website</h2>
      <p>
        You may browse the website and use the demo request form for their intended purpose.
        You may not scrape the site, probe it for vulnerabilities, or send automated submissions
        through the form. Personal data you submit is handled as described in the{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>4. The Service</h2>
      <h3>4.1 What we provide</h3>
      <p>
        The Service records fuel and EV charging sales, manages shifts and prices, generates
        reconciliation reports and exports them. The features available to a Customer are those
        described on the website on the date the Order Form is signed, plus anything we add later.
      </p>
      <h3>4.2 Accounts</h3>
      <p>
        We create the Customer&rsquo;s first administrator account. The Customer creates all
        other accounts and is responsible for who it gives access to. Each User must keep their
        password or PIN private. The Customer must tell us promptly if it believes an account has
        been compromised.
      </p>
      <h3>4.3 Availability</h3>
      <p>
        We aim to keep the Service available at all times. We may take it offline for planned
        maintenance, and we will give the Customer at least 48 hours&rsquo; notice by email when we
        do. The attendant app keeps recording sales during an outage and syncs them afterwards.
      </p>
      <h3>4.4 Changes</h3>
      <p>
        We may improve or change the Service. If a change removes a feature the Customer relies
        on, we will give at least 30 days&rsquo; notice.
      </p>

      <h2>5. Customer Data</h2>
      <ul>
        <li>Customer Data belongs to the Customer. We claim no rights in it.</li>
        <li>We process Customer Data only to provide the Service and as set out in the Privacy Policy.</li>
        <li>The Customer can export Customer Data at any time using the PDF and Excel exports in the portal.</li>
        <li>
          After the contract ends, we keep Customer Data for 60 days so the Customer can export
          it, then delete it.
        </li>
        <li>
          The Customer is responsible for the accuracy of what its Users enter. The Service records
          what Users record; it does not measure pump flow or charger output itself.
        </li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>The Customer and its Users must not:</p>
      <ul>
        <li>use the Service for anything unlawful;</li>
        <li>share accounts between people, or let a person use an account that is not theirs;</li>
        <li>attempt to access another Customer&rsquo;s data;</li>
        <li>reverse engineer the Service or attempt to bypass its access controls;</li>
        <li>resell or sublicense the Service without our written agreement.</li>
      </ul>

      <h2>7. Fees and payment</h2>
      <p>
        Fees are set out in the Order Form and are payable in Rwandan francs unless the Order
        Form says otherwise. Invoices are due within 30 days. If an invoice is more than 30 days
        overdue we may suspend access after giving 7 days&rsquo; written notice; suspended
        Customers can still export their data. Refunds are handled under the{' '}
        <Link href="/refunds">Refund Policy</Link>.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Service, its software, design and documentation belong to {BUSINESS.legalName}. The
        Customer receives a non-exclusive, non-transferable right to use the Service for its own
        stations for the term of the Order Form. Nothing in these terms transfers ownership of
        the Service to the Customer.
      </p>

      <h2>9. Confidentiality</h2>
      <p>
        Each party will keep the other&rsquo;s non-public information confidential and use it only
        for the purposes of the contract. This does not apply to information that is already
        public, was known before disclosure, or must be disclosed by law.
      </p>

      <h2>10. Warranties and disclaimers</h2>
      <p>
        We warrant that the Service will perform materially as described on the website. Beyond
        that, and to the extent the law allows, the Service is provided without other warranties.
        In particular, reconciliation reports and exports are working documents built from what
        Users entered; they are not accounting, tax or legal advice, and the Customer remains
        responsible for its own statutory records.
      </p>

      <h2>11. Limitation of liability</h2>
      <ul>
        <li>
          Neither party is liable to the other for loss of profit, loss of business, or indirect
          or consequential loss arising from the contract.
        </li>
        <li>
          Our total liability to a Customer in any 12-month period is limited to the fees that
          Customer paid us in that period.
        </li>
        <li>
          Nothing in these terms limits liability for death or personal injury caused by
          negligence, for fraud, or for anything else that cannot be limited by law.
        </li>
      </ul>

      <h2>12. Term and termination</h2>
      <p>
        The contract runs for the period in the Order Form and renews for the same period unless
        either party gives 30 days&rsquo; written notice before the renewal date. Either party may
        end the contract immediately if the other commits a material breach and does not fix it
        within 14 days of being told about it in writing. On termination, access ends and
        Customer Data is handled as described in section 5.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of the Republic of Rwanda. If a dispute arises, the
        parties will first try to resolve it by discussion between senior representatives within
        30 days. If that fails, the courts of Kigali have exclusive jurisdiction.
      </p>

      <h2>14. Changes to these terms</h2>
      <p>
        We may update these terms. The date at the top of the page shows the current version.
        For existing Customers, changes take effect at the next renewal unless the Customer
        agrees earlier in writing.
      </p>

      <h2>15. Contact</h2>
      <p>
        {BUSINESS.legalName}, {formattedAddress()}.<br />
        <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
