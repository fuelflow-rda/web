import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';
import { BUSINESS, formattedAddress } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${BUSINESS.legalName} collects, uses and protects personal data on the Relai website, web portal and attendant app.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy explains what personal data we collect through the Relai website, the web portal and the attendant mobile app, why we collect it, who we share it with, and the rights you have over it."
    >
      <h2>1. Who we are</h2>
      <p>
        Relai is operated by {BUSINESS.legalName}, {formattedAddress()}
        {BUSINESS.registrationNumber ? `, company registration number ${BUSINESS.registrationNumber}` : ''}.
        In this policy, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean {BUSINESS.legalName}.
      </p>
      <p>
        For anything about your personal data, write to{' '}
        <a href={`mailto:${BUSINESS.privacyEmail}`}>{BUSINESS.privacyEmail}</a>.
      </p>

      <h2>2. What this policy covers</h2>
      <p>It covers three things:</p>
      <ul>
        <li>The public website at {BUSINESS.siteUrl}, including the demo request form.</li>
        <li>The Relai web portal used by company administrators and station managers.</li>
        <li>The Relai attendant app for Android and iOS.</li>
      </ul>
      <p>
        For the portal and the app, we act as a processor for the company that employs you. That
        company is the controller of its operational data and decides who has an account. Requests
        about your account should go to your employer first; we will help them respond.
      </p>

      <h2>3. Data we collect and why</h2>

      <h3>3.1 Visitors to the website</h3>
      <p>
        When you load a page, our hosting provider records the request in a server log: your IP
        address, the page requested, the time, and the browser identification string your
        browser sends. We use these logs only to keep the site running and to investigate abuse.
        Logs are deleted after 30 days.
      </p>
      <p>
        The site sets no cookies and uses no analytics or advertising trackers. The only item
        it stores in your browser is your light or dark theme preference, and that never leaves
        your device. See the <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <h3>3.2 Demo request form</h3>
      <p>The form asks for:</p>
      <ul>
        <li>your name, work email address and company name (required);</li>
        <li>the number of stations you operate and a message (optional).</li>
      </ul>
      <p>
        We use these details for one purpose: to reply to your request and arrange a demo. The
        legal basis is your consent, which you give by ticking the box on the form, and our
        legitimate interest in answering an enquiry you sent us. The submission is delivered to
        our sales team as an internal notification in the Relai system and, where email is
        configured, also to our sales inbox. We keep it until the enquiry is closed and for no
        longer than 12 months, then delete it.
      </p>

      <h3>3.3 Portal and app accounts</h3>
      <p>For each user account, the platform stores:</p>
      <ul>
        <li>name, role, and the company and station the account belongs to;</li>
        <li>email address and a hashed password for administrators and managers;</li>
        <li>phone number and a hashed PIN for attendants.</li>
      </ul>
      <p>
        Accounts are created by your employer, not by you. We process this data to provide the
        service under our contract with your employer. Passwords and PINs are never stored in
        readable form.
      </p>

      <h3>3.4 Operational records</h3>
      <p>
        Sales transactions, shift start and end times, price changes, pump readings and
        reconciliation reports are business records that belong to the company operating the
        station. They identify which attendant recorded a sale and which manager set a price.
        We process them on that company&rsquo;s instructions and do not use them for any purpose
        of our own.
      </p>

      <h3>3.5 Sessions</h3>
      <p>
        After you sign in to the portal, your browser holds an access token so you stay signed
        in. The attendant app holds its session in the device&rsquo;s secure storage for up to
        seven days. Signing out removes both.
      </p>

      <h3>3.6 Emails we send</h3>
      <p>
        We send account welcome messages and password reset links to administrators and managers.
        These are transactional; we do not send marketing email.
      </p>

      <h2>4. Who we share data with</h2>
      <p>We use three categories of service provider, each bound by a data processing agreement:</p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>What they do for us</th>
            <th>Data involved</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Database hosting and authentication</td>
            <td>Account details, hashed credentials, operational records</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Sending transactional email</td>
            <td>Recipient name and email address, message content</td>
          </tr>
          <tr>
            <td>Our hosting provider</td>
            <td>Running the website, portal and API</td>
            <td>Server logs including IP addresses</td>
          </tr>
        </tbody>
      </table>
      <p>
        We do not sell personal data and we do not share it with advertisers. We will disclose
        data where the law requires it, for example to a court or regulator with proper authority.
      </p>

      <h2>5. Storage outside Rwanda</h2>
      <p>
        Some of the providers above run their servers outside Rwanda. Where personal data is
        stored or processed abroad, we do so in line with Law No. 058/2021 relating to the
        protection of personal data and privacy, including the requirements of the National
        Cyber Security Authority on storage outside Rwanda, and under contracts that require the
        provider to protect the data to the same standard we do.
      </p>

      <h2>6. How long we keep data</h2>
      <ul>
        <li>Server logs: 30 days.</li>
        <li>Demo requests: until closed, and no longer than 12 months.</li>
        <li>User accounts: for as long as the account exists. Your employer can deactivate it at any time.</li>
        <li>
          Operational records: for the life of the customer contract and for 60 days after it
          ends, so the customer can export them. They are then deleted.
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>Under Rwandan data protection law, and where it applies to you, the GDPR, you can ask us to:</p>
      <ul>
        <li>confirm whether we hold personal data about you, and give you a copy;</li>
        <li>correct data that is wrong or incomplete;</li>
        <li>delete data we no longer have a reason to keep;</li>
        <li>stop a particular use of your data, or object to it;</li>
        <li>give you your data in a machine-readable format;</li>
        <li>withdraw consent you gave earlier, for example for a demo request.</li>
      </ul>
      <p>
        Send requests to <a href={`mailto:${BUSINESS.privacyEmail}`}>{BUSINESS.privacyEmail}</a>.
        We answer within 30 days. If your account was created by your employer, we may need to
        confirm the request with them. You can also complain to the National Cyber Security
        Authority of Rwanda or, if you are in the European Union, to your local supervisory
        authority.
      </p>

      <h2>8. Security</h2>
      <p>
        All traffic between your browser or phone and our servers is encrypted with TLS.
        Passwords and PINs are hashed. Access to records is limited by role: a station manager
        cannot see another station, and an attendant cannot open the portal at all. Transactions
        become immutable two minutes after they are recorded, which protects the record from
        later alteration by anyone, including us.
      </p>

      <h2>9. Children</h2>
      <p>
        Relai is a business tool. Accounts are issued to employees of our customers, and the
        website is not directed at children. We do not knowingly collect data from anyone under 18.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        When we change this policy we update the date at the top of the page. If a change
        affects how we use data we already hold, we will tell affected customers by email before
        it takes effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        {BUSINESS.legalName}, {formattedAddress()}.<br />
        Privacy requests: <a href={`mailto:${BUSINESS.privacyEmail}`}>{BUSINESS.privacyEmail}</a>
        <br />
        General enquiries: <a href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
