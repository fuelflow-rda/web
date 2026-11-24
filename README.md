# Relai Web

The Relai website and dashboard, in one Next.js app:

- **Public site:** the landing page and legal pages.
- **Company dashboard,** for company admins and station managers: sales, reconciliation, attendants, pumps, prices, stock, customers and vouchers.
- **Platform pages** for the Relai superadmin.

It talks only to the [Relai API](https://github.com/relai-rw/api). Attendants don't use this app: they record sales in the [mobile app](https://github.com/relai-rw/mobile).

## Stack

- Next.js 16 (App Router) with React 19, TypeScript, pnpm 11, Node 22.12 or later.
- Ant Design 6 and Tailwind CSS 4, both styled from one set of design tokens.
- Zustand for state, Axios for the API, Recharts for charts.
- ExcelJS and jsPDF for exports; qrcode for printed cards and vouchers.
- Vitest with Testing Library.

## Getting started

```bash
pnpm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
pnpm dev                           # http://localhost:3001
```

Run the API locally on port 3000, or point `NEXT_PUBLIC_API_URL` at the staging API.

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_API_URL` | The API's base URL. It is also the only API origin the Content-Security-Policy allows, so the page can call nothing else. |

That is the only setting. The browser never talks to Supabase directly.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server on port 3001 |
| `pnpm build`, `pnpm start` | Production build, and serving it on port 3001 |
| `pnpm lint` | ESLint |
| `pnpm test` | Typecheck, token check, contrast check, hard-coded style check, then unit tests |
| `pnpm test:unit` | Unit tests only (Vitest) |
| `pnpm tokens` | Regenerate everything built from `design-tokens/tokens.json` |

Before a pull request, run `pnpm lint`, `pnpm test` and `pnpm build`. CI runs the same.

## Design tokens

`design-tokens/tokens.json` holds every colour, type size, space and radius, for light and dark. `pnpm tokens` writes it out to:

- the CSS variables Tailwind reads;
- `src/theme/tokens.ts`, for Ant Design and charts;
- `relai-mobile/src/theme/tokens.ts`, when the mobile repository sits next to this one.

Rules for keeping the design consistent:

- **Change a colour or size in `tokens.json`, then run `pnpm tokens`.** Don't edit the generated files.
- **No hard-coded colours or pixel sizes in components.** `pnpm check:styles` fails the build on new ones.
- **Text and background pairs must keep their contrast.** `pnpm check:contrast` checks every pair in both themes.
- **The designs live in the Pencil file `relay.pen`.** A screen that changes in code should match its frame there.

## Pages

| Route | Who | What |
|---|---|---|
| `/`, `/privacy`, `/terms`, `/cookies`, `/refunds` | everyone | Landing page and legal pages |
| `/login`, `/reset-password`, `/set-password`, `/accept-invite` | staff | Sign-in, password reset, accepting an invitation |
| `/dashboard` | admins, managers | The day at a glance |
| `/transactions`, `/reconciliation` | admins, managers | Sales with filters and exports; daily expected against recorded takings |
| `/attendants`, `/pumps`, `/fuel-prices` | admins, managers | People, pumps and chargers, prices and scheduled changes |
| `/stock` | admins, managers | Fuel and electricity stock: levels from the last count, deliveries with their cost, and counts |
| `/customers`, `/vouchers` | admins; managers can read | Customers, cards, balances and statements; voucher batches and printable sheets |
| `/notifications`, `/settings` | admins, managers | Alerts; your own account |
| `/admin/...` | superadmin | Companies, stations, pumps, users, phone sync health, audit log |
| `/design-system` | developers | Every component in every state |

## Layout

```
src/
  app/            routes: (marketing), (dashboard), (admin), and the auth pages
  components/     ui/ for shared pieces; one folder per area (customers/, vouchers/, reconciliation/, ...)
  lib/            api.ts (Axios), csp.ts, links.ts, formatting, business details
  store/          auth and station selection (Zustand)
  theme/ styles/  generated tokens and the Tailwind theme
  proxy.ts        a fresh nonce and Content-Security-Policy on every response
design-tokens/    tokens.json, the source of every colour and size
scripts/          token build and the style and contrast checks
```

## Deployment

- **Vercel** builds and serves `main` at https://relairda.vercel.app (moving to https://relai.rw). `NEXT_PUBLIC_API_URL` is set in the Vercel project.
- **GitHub Actions** checks every pull request. They also publish Docker images and bump the version with bot commits marked `[skip ci]`. If a bump makes a pull request conflict, merge `main` in and keep `main`'s version.

## Privacy

Keep it this way: the legal pages promise it.

- **No trackers:** no analytics, tracking scripts, maps, video embeds, chat widgets or font CDNs. Fonts are downloaded at build time and served from our own origin.
- **No cookies.** The browser stores only:
  - the theme choice (`relai_theme`);
  - after sign-in, the session (`relai_token`, `relai_user`).

  All of these are set by the user's own action and strictly necessary, so no consent banner is needed.
- **The demo request form** asks only for what a reply needs, and needs its consent box ticked. The API checks that too.
- **Anything new that tracks or embeds a third party needs a consent banner before it ships.** That includes analytics, an embed, a chat widget, a font CDN, session replay, or an error reporter that captures IP addresses.

To re-check:

```bash
grep -rniE 'gtag|googletagmanager|hotjar|posthog|sentry|mixpanel|plausible|clarity|<Script' src public
curl -sI http://localhost:3001/ | grep -i set-cookie   # should print nothing
```

## License

Private. All rights reserved.
