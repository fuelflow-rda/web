import { NextResponse, type NextRequest } from 'next/server';
import { buildCsp, newNonce } from '@/lib/csp';

/**
 * Gives every page a fresh nonce and the Content-Security-Policy built on it
 * (src/lib/csp.ts). The policy goes on the request too: Next.js reads the nonce
 * from there and adds it to its own scripts. A nonce has to be new for every
 * response, so pages render per request rather than at build time.
 */
export function proxy(request: NextRequest) {
  const nonce = newNonce();
  const csp = buildCsp({
    nonce,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    dev: process.env.NODE_ENV === 'development',
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not built assets, image optimisation or the files in public/.
      source:
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
      // Prefetches carry no page scripts of their own.
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
