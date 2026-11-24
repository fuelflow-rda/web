/** @type {import('next').NextConfig} */

/**
 * Response headers for every route.
 *
 * The Content-Security-Policy is not here: it carries a fresh nonce for every
 * response, so src/proxy.ts sets it (policy in src/lib/csp.ts). These are the
 * headers that are the same on every response.
 */
const securityHeaders = [
  // Stop MIME sniffing turning a response into something executable.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // The console has no embeddable surface; deny framing outright (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Features this app never uses.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Once a browser has reached the console over HTTPS, it refuses plain HTTP to
  // this host for a year, so a network attacker cannot downgrade a later visit.
  // Browsers ignore the header on plain-HTTP responses, so local dev is
  // unaffected. includeSubDomains and preload are left off on purpose: they
  // would bind every other subdomain of the production domain as well.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Do not advertise the framework version.
  poweredByHeader: false,
  transpilePackages: ['antd', 'recharts'],
  // The landing page's photos: AVIF where the browser takes it, WebP otherwise, resized per screen.
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
