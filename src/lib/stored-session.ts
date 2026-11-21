/**
 * Where the signed-in session is kept in the browser.
 *
 * "Keep me signed in" keeps it in localStorage, which survives closing the
 * browser; without it, sessionStorage, which a closed tab forgets. Readers
 * look in both, so the choice only matters at sign-in.
 */
export const TOKEN_KEY = 'relai_token';
export const USER_KEY = 'relai_user';

function stores(): Storage[] {
  if (typeof window === 'undefined') return [];
  return [window.localStorage, window.sessionStorage];
}

function read(key: string): string | null {
  for (const s of stores()) {
    try {
      const v = s.getItem(key);
      if (v !== null) return v;
    } catch {
      // Storage can be blocked (private mode, site settings): treat as signed out.
    }
  }
  return null;
}

export const readStoredToken = () => read(TOKEN_KEY);
export const readStoredUser = () => read(USER_KEY);

export function storeSession(token: string, userJson: string, remember: boolean) {
  clearStoredSession();
  const target = remember ? window.localStorage : window.sessionStorage;
  target.setItem(TOKEN_KEY, token);
  target.setItem(USER_KEY, userJson);
}

export function clearStoredSession() {
  for (const s of stores()) {
    try {
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
    } catch {
      // Nothing stored, or storage blocked: nothing to clear.
    }
  }
}
