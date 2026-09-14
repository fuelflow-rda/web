import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';
import { BUSINESS, formattedAddress } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: `When ${BUSINESS.legalName} refunds Relai subscription fees, and how to ask.`,
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      summary="Relai is sold to businesses as a subscription under an order form. This page sets out when fees are refunded, when they are not, and how to request one."
    >
      <h2>1. How Relai is billed</h2>
      <p>
        Fees are agreed in the Order Form and invoiced in advance for each billing period, either
        monthly or annually. The number of stations covered and the price per period are stated
        on the Order Form. Nothing is charged on the website, and the demo request form does not
        take payment details.
      </p>

      <h2>2. Trial periods</h2>
      <p>
        Where we agree a trial in writing, no fees are charged for the trial period, and the
        Customer may stop at the end of it without paying anything. A trial only becomes a paid
        subscription when the Customer signs an Order Form.
      </p>

      <h2>3. When we refund</h2>
      <ul>
        <li>
          <strong>Billing errors.</strong> If we invoice the wrong amount or charge twice, we
          refund the difference in full within 10 working days of confirming the error.
        </li>
        <li>
          <strong>Sustained unavailability.</strong> If the portal or API is unavailable for more
          than 24 consecutive hours because of a fault on our side, the Customer may request a
          credit for the affected days, calculated pro rata against the current billing period.
          Outages caused by the Customer&rsquo;s own network, devices or internet provider do not
          qualify.
        </li>
        <li>
          <strong>Termination for our breach.</strong> If the Customer ends the contract because
          we materially breached it and did not fix the breach within 14 days of written notice,
          we refund any fees already paid for the period after the termination date.
        </li>
        <li>
          <strong>Feature removal.</strong> If we withdraw a feature the Customer relies on and the
          Customer ends the contract within 30 days of our notice, we refund fees paid for the
          period after termination.
        </li>
      </ul>

      <h2>4. When we do not refund</h2>
      <ul>
        <li>
          Cancellation part-way through a billing period for reasons other than those in section
          3. Access continues until the end of the paid period and no further invoices are raised.
        </li>
        <li>Periods during which the Service was available but not used.</li>
        <li>
          Losses arising from data entered incorrectly by the Customer&rsquo;s staff, or from
          reconciliation discrepancies the software reported.
        </li>
        <li>Charges from third parties, such as the Customer&rsquo;s mobile network or device supplier.</li>
      </ul>

      <h2>5. How to request a refund or credit</h2>
      <ol>
        <li>
          Email <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a> from an
          administrator account&rsquo;s email address, with the invoice number and the reason.
        </li>
        <li>We acknowledge within 2 working days and give a decision within 10 working days.</li>
        <li>
          Approved refunds are paid to the account the original payment came from. Credits are
          applied to the next invoice.
        </li>
      </ol>

      <h2>6. Disputes</h2>
      <p>
        If you disagree with a decision, the dispute process in section 13 of the{' '}
        <Link href="/terms">Terms and Conditions</Link> applies.
      </p>

      <h2>7. Contact</h2>
      <p>
        {BUSINESS.legalName}, {formattedAddress()}.<br />
        <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
