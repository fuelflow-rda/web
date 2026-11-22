'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from 'antd';
import { Mail } from 'lucide-react';
import api from '@/lib/api';
import { Banner, Button, TextField } from '@/components/ui';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Password recovery for the management portal.
 *
 * Only managers and admins can recover from here, because only they have a password:
 * the API mails them a single-use Supabase recovery link. Attendants sign in on mobile
 * with phone + PIN and have no password at all — their PIN is reset by a station
 * manager, so there is nothing for them to self-serve on the web.
 *
 * The endpoint answers identically whether or not the account exists, so this component
 * shows the same confirmation either way. Do not add "no account found" feedback here:
 * that would turn the form into a way to discover which emails are registered.
 */
export function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    onClose();
    // Reset after the closing animation so the content doesn't visibly change.
    setTimeout(() => {
      setSent(false);
      setError('');
      setFieldError('');
      setEmail('');
    }, 250);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    const problem = !value ? 'Enter your email.' : !EMAIL.test(value) ? 'Enter an email such as name@company.rw.' : '';
    setFieldError(problem);
    if (problem) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/password/forgot', { email: value });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onCancel={close} title="Reset your password" footer={null} destroyOnHidden>
      {sent ? (
        <div className="flex flex-col gap-5">
          <Banner tone="success" title="Check your inbox">
            If that email is registered, a link to choose a new password is on its way. It works once and expires
            shortly. Look in spam if it does not arrive.
          </Banner>
          <Button kind="primary" onClick={close} block>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          {error ? <Banner tone="danger" title={error} /> : null}
          <p className="m-0 text-14 text-text-secondary">
            Enter the email you sign in with and we will send you a link to choose a new password.
          </p>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            leadingIcon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
            placeholder="name@company.rw"
          />
          <Button kind="primary" htmlType="submit" loading={submitting} block>
            Send reset link
          </Button>
          {/* Without this an attendant who lands here has no idea where to go instead. */}
          <p className="m-0 text-12 text-text-muted">
            Attendants sign in on the app with a phone number and PIN. Ask your station manager to set a new PIN.
          </p>
        </form>
      )}
    </Modal>
  );
}
