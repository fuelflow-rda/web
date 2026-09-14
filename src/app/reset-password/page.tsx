'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, Alert, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { BrandMark } from '@/components/BrandMark';

const { Title, Text } = Typography;

/**
 * Where the emailed recovery link lands.
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
  const [form] = Form.useForm();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');
  const [error, setError] = useState('');
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

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);

    const token = params.get('access_token');
    const errorDescription = params.get('error_description');

    if (errorDescription) {
      setLinkError(errorDescription.replace(/\+/g, ' '));
    } else if (!token) {
      setLinkError(
        'This page needs a valid reset link. Request a new one from the sign-in page.',
      );
    } else {
      setAccessToken(token);
    }

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (values: { password: string }) => {
    if (!accessToken) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/password/reset', {
        access_token: accessToken,
        new_password: values.password,
      });
      setDone(true);
      message.success('Password updated');
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12 bg-surface">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-accent rounded-control flex items-center justify-center">
            <BrandMark size={20} color="var(--accent-on)" />
          </div>
          <span className="text-ink text-xl font-extrabold tracking-tight">Relai</span>
        </div>

        <div className="mb-8">
          <Title level={2} className="!mb-1.5 !text-ink !text-2xl !font-extrabold">
            Choose a new password
          </Title>
          <Text className="!text-ink-muted !text-sm">
            At least 8 characters.
          </Text>
        </div>

        {done ? (
          <Alert
            type="success"
            showIcon
            message="Password updated"
            description="Taking you to the sign-in page…"
            className="!rounded-xl"
          />
        ) : linkError ? (
          <>
            <Alert type="error" showIcon message={linkError} className="!rounded-xl !mb-5" />
            <Button
              type="primary"
              block
              onClick={() => router.replace('/login')}
              className="!h-12 !rounded-xl !font-bold"
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <Form form={form} onFinish={handleSubmit} layout="vertical" size="large" requiredMark={false}>
            {error && (
              <Alert type="error" showIcon message={error} className="!mb-4 !rounded-xl" />
            )}

            <Form.Item
              name="password"
              label={<span className="text-sm font-semibold text-ink-secondary">New password</span>}
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-ink-disabled" />}
                placeholder="Enter a new password"
                className="!h-12 !rounded-xl !bg-surface"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              label={<span className="text-sm font-semibold text-ink-secondary">Confirm password</span>}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator: (_, value) =>
                    !value || getFieldValue('password') === value
                      ? Promise.resolve()
                      : Promise.reject(new Error('The two passwords do not match')),
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-ink-disabled" />}
                placeholder="Re-enter the new password"
                className="!h-12 !rounded-xl !bg-surface"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={!accessToken}
                block
                className="!h-12 !rounded-xl !text-base !font-bold"
              >
                Update password
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  );
}
