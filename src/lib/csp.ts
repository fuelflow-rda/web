/**
 * The Content-Security-Policy for every page (audit finding 4).
 *
 * The session token sits in browser storage, so an injected script could read
 * it. Scripts therefore run only from this origin and only when they carry the
 * per-request nonce; 'strict-dynamic' lets those scripts load the chunks they
 * import. Next.js finds the nonce in this header on the request and adds it to
 * its own scripts; the theme script in the root layout reads it from `x-nonce`.
 *
 * Styles allow 'unsafe-inline' on purpose. Ant Design and the charts set inline
 * `style` attributes, which a nonce cannot cover, and a nonce in style-src would
 * make browsers ignore 'unsafe-inline' altogether. Injected CSS cannot run code.
 *
 * connect-src names the API origin, the one place the console sends data.
 */
export function buildCsp({ nonce, apiUrl, dev }: { nonce: string; apiUrl?: string; dev: boolean }): string {
  const api = apiOrigin(apiUrl);
  const directives = [
    "default-src 'self'",
    // React uses eval in development only, to rebuild server error stacks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${api ? ` ${api}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join('; ');
}

/** "https://api.relai.rw/api" → "https://api.relai.rw"; nothing for a missing or malformed value. */
export function apiOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, origin } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? origin : null;
  } catch {
    return null;
  }
}

/** 16 random bytes, base64: unguessable and fresh for every request. */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
