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
      summary="The Relai website sets no cookies. This page lists the small amount of information the site and the web portal keep in your browser, what it is for, and how to remove it."
    >
      <h2>1. Cookies</h2>
      <p>
        Neither the public website nor the web portal sets cookies. There are no analytics
        cookies, no advertising cookies and no third-party cookies. We do not load any script from
        an advertising or analytics network.
      </p>

      <h2>2. Browser storage we do use</h2>
      <p>
        The site and portal use the browser&rsquo;s local storage for the items below. Local
        storage is not sent to our servers with each request the way a cookie is; it stays on
        your device and is read only by the page that wrote it.
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
            <td>Website and portal</td>
            <td>Remembers whether you chose the light or dark theme. Absent until you use the theme switch.</td>
            <td>Until you clear it</td>
          </tr>
          <tr>
            <td><code>relai_token</code></td>
            <td>Portal, after sign-in</td>
            <td>Keeps you signed in between page loads.</td>
            <td>Until you sign out, or the token expires</td>
          </tr>
          <tr>
            <td><code>relai_user</code></td>
            <td>Portal, after sign-in</td>
            <td>Your name, role and station so the portal can draw the right screens without a round trip.</td>
            <td>Until you sign out</td>
          </tr>
        </tbody>
      </table>
      <p>
        All three are strictly necessary for the feature you asked for: the theme switch or
        signing in. None of them identifies you to us on the public website, and none is used for
        tracking.
      </p>

      <h2>3. The attendant app</h2>
      <p>
        The mobile app is not a website and has no cookies. It keeps your session in the
        device&rsquo;s secure storage for up to seven days after sign-in, and keeps a local queue
        of sales recorded while offline until they sync. Signing out clears the session.
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
        Sign out of the portal to remove the session keys. To remove the theme preference, clear
        site data for {BUSINESS.siteUrl} in your browser settings. Doing so has no effect other
        than returning the theme to your operating system&rsquo;s setting.
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
