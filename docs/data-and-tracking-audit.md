# Data and tracking audit: public website

Audited 2026-09-12 against the `relai-web` source tree. Re-run the checks in the
last section whenever a dependency or script is added.

## 1. Analytics and tracking scripts

**None.** A search of `src/`, `public/` and `next.config.js` for `gtag`,
`googletagmanager`, `analytics`, `hotjar`, `posthog`, `sentry`, `mixpanel`,
`plausible` and `clarity` finds only the internal `/analytics` API route that feeds
the manager dashboard. That endpoint aggregates station sales; it is not a visitor
tracker and is never called from the public pages.

There is no `<Script>` tag, no `beacon`, no pixel and no error-reporting SDK.

## 2. Third-party embeds

| Embed type | Present | Notes |
|---|---|---|
| Maps | No | The office address is plain text. A Google Maps iframe would set cookies and send the visitor's IP to Google before any interaction, so it was deliberately left out. |
| Video | No | No YouTube or Vimeo iframes. |
| Chat or support widget | No | |
| Social buttons | No | |
| Web fonts | No third-party request | Inter (portal), Rethink Sans and Instrument Sans (public site) are loaded through `next/font/google`, which downloads the font files at build time and serves them from our own origin. The browser never contacts `fonts.googleapis.com` or `fonts.gstatic.com`. |
| Icon fonts or CDN scripts | No | Ant Design icons are bundled; the marketing pages use inline SVG. |

**Flagged: nothing.** No embed on the public pages sets a cookie or transfers data
to a third party.

## 3. Cookies

The website and portal set **no cookies** of their own. Next.js in this
configuration sets none either. Verified by loading `/`, `/privacy` and `/login`
and inspecting response headers: no `Set-Cookie`.

## 4. Browser storage (localStorage)

| Key | Set by | Contents | Sent to server? | Consent needed? |
|---|---|---|---|---|
| `relai_theme` | Theme toggle | `"light"` or `"dark"` | No | No: user-initiated preference |
| `relai_token` | Portal sign-in | Access token | Yes, as a bearer header on API calls | No: strictly necessary for the session |
| `relai_user` | Portal sign-in | Name, role, station and company ids | No | No: strictly necessary for the session |

Legacy keys `relai_token` and `relai_user` are migrated to the new names on
first load and then removed.

## 5. Cookie consent banner

**Not required.** Consent is needed for storage that is not strictly necessary
(analytics, advertising, personalisation). Every item in section 4 is set only in
response to an action the visitor took and is necessary for that action to work.
Nothing is set on first visit to the landing page. This reasoning is repeated on
the public [Cookie Policy](../src/app/(marketing)/cookies/page.tsx).

If any of the following are added later, a consent banner becomes mandatory
**before** the change ships: analytics of any kind, a maps or video embed, a chat
widget, a fonts CDN, session replay, or an error reporter that captures IPs.

## 6. Data the public site collects

| Source | Fields | Where it goes | Retention |
|---|---|---|---|
| Server request logs | IP, URL, timestamp, user agent | Hosting provider logs | 30 days (stated in Privacy Policy; confirm the host's retention setting matches) |
| Demo request form | Name, work email, company (required); station count, message (optional); consent flag | `POST /api/contact/demo-request` on the API. Stored as an in-app notification for each active super admin (the `notifications` table) and, when `RESEND_API_KEY` and `CONTACT_INBOX` are set, also emailed to the sales inbox. | Until the enquiry closes, max 12 months; super admins delete the notification once handled |

The form is the minimum needed to reply. It does not ask for phone number, job
title, address or company size. The consent checkbox is enforced on the client and
again on the API (`consent` must be `true`), so a hand-crafted request cannot skip
it.

## 7. Outbound requests from the public pages

Loading the landing page makes requests only to our own origin. Submitting the
demo form makes one request to our API. The API then calls `api.resend.com`
server-side; the visitor's browser never talks to Resend.

## 8. How to re-check

```bash
# Scripts and SDKs
grep -rniE 'gtag|googletagmanager|hotjar|posthog|sentry|mixpanel|plausible|clarity|<Script' src public next.config.js

# Cookies on the public routes (run against a dev server)
curl -sI http://localhost:3001/ | grep -i set-cookie
curl -sI http://localhost:3001/privacy | grep -i set-cookie

# Third-party hosts referenced anywhere in the bundle
grep -rhoE 'https?://[a-z0-9.-]+' src | sort -u
```

The last command should list only `api.resend.com` (server side, in the API
project, not here), `supabase.com` in comments, and documentation links.
