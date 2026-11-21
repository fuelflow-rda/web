import { describe, expect, it } from 'vitest';
import { apiOrigin, buildCsp, newNonce } from './csp';

const directive = (csp: string, name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `));

describe('buildCsp', () => {
  const csp = buildCsp({ nonce: 'abc123', apiUrl: 'https://api.relai.rw/api', dev: false });

  it('runs only scripts from this origin that carry the nonce', () => {
    expect(directive(csp, 'script-src')).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain('unsafe-eval');
  });

  it('allows eval in development only', () => {
    expect(directive(buildCsp({ nonce: 'n', dev: true }), 'script-src')).toContain("'unsafe-eval'");
  });

  it('sends data only to this origin and the API', () => {
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self' https://api.relai.rw");
    expect(directive(buildCsp({ nonce: 'n', dev: false }), 'connect-src')).toBe("connect-src 'self'");
  });

  it('keeps inline styles without a nonce, so browsers honour unsafe-inline', () => {
    expect(directive(csp, 'style-src')).toBe("style-src 'self' 'unsafe-inline'");
  });

  it('refuses plugins, framing, base and form hijacks', () => {
    for (const d of ["object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(csp.split('; ')).toContain(d);
    }
  });
});

describe('apiOrigin', () => {
  it('keeps scheme, host and port only', () => {
    expect(apiOrigin('http://localhost:3100/api')).toBe('http://localhost:3100');
    expect(apiOrigin('https://api.relai.rw')).toBe('https://api.relai.rw');
  });

  it('ignores missing, malformed and non-web values', () => {
    expect(apiOrigin(undefined)).toBeNull();
    expect(apiOrigin('not a url')).toBeNull();
    expect(apiOrigin('javascript:alert(1)')).toBeNull();
  });
});

describe('newNonce', () => {
  it('is 16 random bytes, different every time', () => {
    const a = newNonce();
    expect(atob(a)).toHaveLength(16);
    expect(newNonce()).not.toBe(a);
  });
});
