import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'What the Relai website and portal store in your browser, and why no cookie consent banner is shown.',
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      summary="The Relai website sets no cookies and stores nothing in your browser. This page lists the small amount of information the web portal and the attendant app keep on your device, what it is for, and how to remove it."
    >
      <h2>1. Cookies</h2>
      <p>
        Neither the public website nor the web portal sets cookies. There are no analytics
        cookies, no advertising cookies and no third-party cookies. We do not load any script from
        an advertising or analytics network.
      </p>

      <h2>2. Browser storage the portal uses</h2>
      <p>
        The public website stores nothing in your browser. Once you sign in, the portal uses the
        browser&rsquo;s storage for the items below. Browser storage is not sent to our servers
        with each request the way a cookie is; it stays on your device and is read only by the
        page that wrote it.
      </p>
      <p>
        The two sign-in items go to <em>session storage</em>, which the browser clears when you
        close the tab, unless you tick &ldquo;Keep me signed in&rdquo;. Then they go to{' '}
        <em>local storage</em> and stay until you sign out.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Set where</th>
            <th>Purpose</th>
            <th>Lifetime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>relai_theme</code></td>
            <td>Portal</td>
            <td>Remembers whether you chose the light or dark theme. Absent until you use the theme switch.</td>
            <td>Until you clear it</td>
          </tr>
          <tr>
            <td><code>relai_token</code></td>
            <td>Portal, after sign-in</td>
            <td>Keeps you signed in between page loads.</td>
            <td>Until you close the tab, or until you sign out with &ldquo;Keep me signed in&rdquo;</td>
          </tr>
          <tr>
            <td><code>relai_user</code></td>
            <td>Portal, after sign-in</td>
            <td>Your name, role and station so the portal can draw the right screens without a round trip.</td>
            <td>As <code>relai_token</code></td>
          </tr>
        </tbody>
      </table>
      <p>
        All three are strictly necessary for the feature you asked for: the theme switch or
        signing in. None of them is used for tracking.
      </p>

      <h2>3. The attendant app</h2>
      <p>
        The mobile app is not a website and has no cookies. It keeps your session in the
        device&rsquo;s secure storage for up to seven days after sign-in, and keeps a local queue
        of sales recorded while offline until they sync. It also creates a random identifier for
        the phone when it is first opened, which it sends with its reports of unsent sales (see
        the <Link href="/privacy">Privacy Policy</Link>, section 3.5). Signing out clears the
        session; the queue and the identifier stay, so sales recorded offline are never lost.
      </p>

      <h2>4. Third-party content</h2>
      <p>
        The website embeds no maps, videos, chat widgets or social media buttons. The typeface is
        served from our own domain, not from a font network, so loading a page makes no request
        to any third party.
      </p>

      <h2>5. Why there is no cookie banner</h2>
      <p>
        Consent banners are required for cookies and similar storage that are not strictly
        necessary, such as analytics and advertising. Everything listed above is strictly
        necessary for a function you chose to use, so no consent is needed and no banner is
        shown. If we ever add something that does need consent, we will add a banner before it
        goes live and update this page.
      </p>

      <h2>6. How to remove stored data</h2>
      <p>
        Sign out of the portal, or close the tab if you did not tick &ldquo;Keep me signed
        in&rdquo;, to remove the session keys. To remove the theme preference, clear site data
        for {BUSINESS.siteUrl} in your browser settings. Doing so has no effect other than
        returning the theme to your operating system&rsquo;s setting.
      </p>

      <h2>7. More information</h2>
      <p>
        How we handle personal data more generally is described in the{' '}
        <Link href="/privacy">Privacy Policy</Link>. Questions about this page can go to{' '}
        <a href={`mailto:${BUSINESS.privacyEmail}`}>{BUSINESS.privacyEmail}</a>.
      </p>
    </LegalPage>
  );
}
