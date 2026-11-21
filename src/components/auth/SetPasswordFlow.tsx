'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordField } from '@/components/auth/PasswordField';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { Banner, Button } from '@/components/ui';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { useAuthStore } from '@/store/auth-store';

type Info = { purpose: 'invite' | 'reset'; name: string | null; email: string; companyName: string | null };
type State =
  | { step: 'checking' }
  | { step: 'broken'; message: string }
  | { step: 'form'; token: string; info: Info }
  | { step: 'done'; email: string };

const MIN = 8;

/** The token from `#token=…`, read once and removed from the address bar and history. */
function takeToken(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  const token = new URLSearchParams(hash).get('token');
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

/**
 * Where an invitation or an administrator's reset link lands (audit finding 6:
 * no password is ever emailed). The token sits in the URL fragment, which never
 * reaches a server log; it is posted to the API, which knows only its hash.
 */
export function SetPasswordFlow({ expected }: { expected: 'invite' | 'reset' }) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [state, setState] = useState<State>({ step: 'checking' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  // Reading the fragment destroys it. StrictMode runs effects twice in development,
  // and the second run must not see an empty hash and call a good link broken.
  const read = useRef(false);

  useEffect(() => {
    if (read.current) return;
    read.current = true;
    const token = takeToken();
    if (!token) {
      // The fragment exists only in the browser, so it is read after hydration, once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ step: 'broken', message: 'This link is incomplete. Open the whole link from the email, or ask for a new one.' });
      return;
    }
    api
      .post('/auth/invitations/inspect', { token })
      .then((res) => setState({ step: 'form', token, info: res.data as Info }))
      .catch((err: Error) => setState({ step: 'broken', message: err.message }));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state.step !== 'form') return;
    const next = {
      password: password.length < MIN ? `Use at least ${MIN} characters.` : undefined,
      confirm: confirm !== password ? 'The two passwords are different.' : undefined,
    };
    setErrors(next);
    setFailure('');
    if (next.password || next.confirm) return;
    setSaving(true);
    try {
      const res = await api.post('/auth/invitations/accept', { token: state.token, password });
      const email = (res.data as { email: string }).email;
      try {
        const user = await login(email, password, true);
        router.replace(getDefaultRouteForUser(user));
      } catch {
        // The password is set; if signing straight in fails, the sign-in page still works.
        setState({ step: 'done', email });
      }
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The password could not be set. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (state.step === 'checking') return <AppLoadingScreen />;

  if (state.step === 'broken') {
    return (
      <AuthLayout title={expected === 'invite' ? 'This invitation cannot be used' : 'This link cannot be used'}>
        <Banner tone="warning" title={state.message} />
        <Button kind="primary" size="lg" block onClick={() => router.push('/login')}>
          Go to sign in
        </Button>
      </AuthLayout>
    );
  }

  if (state.step === 'done') {
    return (
      <AuthLayout title="Password set">
        <Banner tone="success" title={`Sign in with ${state.email} and your new password.`} />
        <Button kind="primary" size="lg" block onClick={() => router.push('/login')}>
          Go to sign in
        </Button>
      </AuthLayout>
    );
  }

  const { info } = state;
  const invite = info.purpose === 'invite';
  return (
    <AuthLayout
      title={invite ? `Welcome to ${info.companyName ?? 'Relai'}` : 'Choose a new password'}
      description={
        invite ? (
          <>
            Choose a password for <strong className="font-semibold text-text">{info.email}</strong>. You will sign in with this
            email from now on.
          </>
        ) : (
          <>
            For <strong className="font-semibold text-text">{info.email}</strong>. Your old password works until you save this one.
          </>
        )
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <PasswordField
          label={invite ? 'Password' : 'New password'}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`At least ${MIN} characters. A short phrase is easier to remember than symbols.`}
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
        <Button kind="primary" size="lg" htmlType="submit" loading={saving} block>
          {invite ? 'Set password and sign in' : 'Save and sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
