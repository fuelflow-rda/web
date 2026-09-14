/** @type {import('next').NextConfig} */

/**
 * Response headers for every route.
 *
 * No CSP here: Ant Design and the chart libraries inject styles at runtime, and
 * the pre-paint theme script is inline, so a policy strict enough to be worth
 * having would need nonce plumbing through the App Router. Tracked separately —
 * these are the headers that are safe to set unconditionally.
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
];

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Do not advertise the framework version.
  poweredByHeader: false,
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/charts', 'recharts'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
