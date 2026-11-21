'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordField } from '@/components/auth/PasswordField';
import { Banner, Button } from '@/components/ui';

const MIN = 8;

/**
 * Where the emailed recovery link lands (the "Forgot password?" flow).
 *
 * Supabase redirects here with the session in the URL *fragment*
 * (`#access_token=...&type=recovery`). A fragment never leaves the browser — it is not
 * sent to the server and stays out of access logs and Referer headers — so the token is
 * read client-side and posted to the API, which uses it to set the new password.
 *
 * The fragment is cleared from the address bar immediately so the token is not left
 * sitting in browser history or captured by a copied URL.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [failure, setFailure] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Reading the fragment destroys it, so this must happen exactly once. React StrictMode
  // invokes effects twice in development: without this guard the first pass captured the
  // token and cleared the hash, and the second pass saw an empty hash and declared the
  // link invalid — a valid reset link rendered as a broken one.
  const parsedHash = useRef(false);
  useEffect(() => {
    if (parsedHash.current) return;
    parsedHash.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('access_token');
    const errorDescription = params.get('error_description');
    // The fragment exists only in the browser, so it is read after hydration, once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (errorDescription) setLinkError(errorDescription.replace(/\+/g, ' '));
    else if (!token) setLinkError('This page needs a valid reset link. Request a new one from the sign-in page.');
    else setAccessToken(token);
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const next = {
      password: password.length < MIN ? `Use at least ${MIN} characters.` : undefined,
      confirm: confirm !== password ? 'The two passwords are different.' : undefined,
    };
    setErrors(next);
    setFailure('');
    if (next.password || next.confirm) return;
    setSubmitting(true);
    try {
      await api.post('/auth/password/reset', { access_token: accessToken, new_password: password });
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Your password could not be updated.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" description={`At least ${MIN} characters.`}>
      {done ? (
        <Banner tone="success" title="Password updated">
          Taking you to the sign-in page…
        </Banner>
      ) : linkError ? (
        <>
          <Banner tone="warning" title={linkError} />
          <Button kind="primary" size="lg" block onClick={() => router.replace('/login')}>
            Back to sign in
          </Button>
        </>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          {failure ? <Banner tone="danger" title={failure} /> : null}
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoFocus
          />
          <PasswordField
            label="Type it again"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <Button kind="primary" size="lg" htmlType="submit" loading={submitting} disabled={!accessToken} block>
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
