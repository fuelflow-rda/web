'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Smartphone } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordField } from '@/components/auth/PasswordField';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { Banner, Button, Checkbox, TextField } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { cx } from '@/lib/cx';
import { useAuthStore } from '@/store/auth-store';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The API's wording for a wrong email or password, put the way a person would say it. */
function friendly(message: string): string {
  if (/invalid (email|credentials)|invalid login/i.test(message)) return 'That email and password do not match. Check both and try again.';
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user, initialized, initialize } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [failure, setFailure] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Already signed in: go straight to where this person works.
  useEffect(() => {
    if (initialized && user) router.replace(getDefaultRouteForUser(user));
  }, [initialized, user, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      email: !email.trim() ? 'Enter your email.' : !EMAIL.test(email.trim()) ? 'Enter an email such as name@company.rw.' : undefined,
      password: !password ? 'Enter your password.' : undefined,
    };
    setErrors(next);
    setFailure('');
    if (next.email || next.password) return;
    try {
      const signedIn = await login(email.trim(), password, remember);
      router.replace(getDefaultRouteForUser(signedIn));
    } catch (err) {
      setFailure(friendly(err instanceof Error ? err.message : 'Sign-in failed. Try again.'));
    }
  };

  if (!initialized || user) return <AppLoadingScreen />;

  return (
    <AuthLayout title="Sign in to Relai" description="Use the email your company administrator invited.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        {failure ? <Banner tone="danger" title={failure} /> : null}
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          inputMode="email"
          leadingIcon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="name@company.rw"
          autoFocus
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="flex items-center justify-between gap-4">
          <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
            Keep me signed in
          </Checkbox>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className={cx('cursor-pointer border-0 bg-transparent p-0 text-14 font-medium text-link hover:underline', focusRing)}
          >
            Forgot password?
          </button>
        </div>
        <Button kind="primary" size="lg" htmlType="submit" loading={loading} icon={LogIn} block>
          Sign in
        </Button>
        <p className="m-0 flex gap-3 rounded-control-lg bg-surface-muted p-4 text-14 leading-snug text-text-secondary">
          <Smartphone size={18} aria-hidden className="mt-px shrink-0" />
          Attendants sign in on the Relai app with their phone number and PIN, not here.
        </p>
      </form>
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </AuthLayout>
  );
}
