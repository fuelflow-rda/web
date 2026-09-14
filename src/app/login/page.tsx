'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth-store';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { ForecourtIllustration } from '@/components/ForecourtIllustration';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { BrandMark } from '@/components/BrandMark';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user, initialized } = useAuthStore();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [resetHelpOpen, setResetHelpOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !initialized || !user) return;
    router.replace(getDefaultRouteForUser(user));
  }, [mounted, initialized, user, router]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setError('');
    try {
      const loggedInUser = await login(values.email, values.password);
      message.success(`Welcome back, ${loggedInUser.name}!`);
      router.replace(getDefaultRouteForUser(loggedInUser));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      message.error(errorMessage);
    }
  };

  if (!mounted || !initialized || user) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="min-h-screen w-screen flex overflow-hidden fixed inset-0">
      {/* Left Panel - Artwork */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center"
        style={{
          background:
            'linear-gradient(155deg, var(--surface) 0%, var(--warn-tint) 52%, var(--product-gasoline-tint) 100%)',
        }}
      >
        {/* Corner spheres bleeding off the panel edges, as in the reference. */}
        <div
          className="absolute -top-24 -left-20 w-72 h-72 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, var(--accent-hover), var(--accent))',
            opacity: 0.75,
          }}
        />
        <div
          className="absolute -bottom-48 left-[58%] w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 30%, var(--accent), var(--accent-pressed))',
            opacity: 0.4,
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-12 w-full max-w-[600px]">
          <ForecourtIllustration className="w-full" style={{ maxHeight: '56vh' }} />

          <h1 className="mt-8 max-w-[400px] text-center text-[2rem] leading-tight font-extrabold text-accent">
            Manage your stations with confidence.
          </h1>
          <p className="mt-3 text-center text-ink-secondary text-base leading-relaxed max-w-[440px]">
            Real-time monitoring and reconciliation for every pump, shift and
            station you run.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-surface relative">
        <div className="w-full max-w-[380px] mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-accent rounded-control flex items-center justify-center">
              <BrandMark size={20} color="var(--accent-on)" />
            </div>
            <span className="text-ink text-xl font-extrabold tracking-tight">Relai</span>
          </div>

          <div className="mb-8">
            <Title level={2} className="!mb-1.5 !text-ink !text-2xl !font-extrabold">
              Welcome back
            </Title>
            <Text className="!text-ink-muted !text-sm">
              Sign in to your management portal
            </Text>
          </div>

          <Form form={form} onFinish={handleLogin} layout="vertical" size="large" requiredMark={false}>
            <Form.Item
              name="email"
              label={<span className="text-sm font-semibold text-ink-secondary">Email</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-ink-disabled" />}
                placeholder="you@company.com"
                className="!h-12 !rounded-xl !bg-surface"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-sm font-semibold text-ink-secondary">Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
              className="!mb-2"
            >
              <Input.Password
                prefix={<LockOutlined className="text-ink-disabled" />}
                placeholder="Enter your password"
                className="!h-12 !rounded-xl !bg-surface"
              />
            </Form.Item>

            <div className="flex justify-end mb-5">
              <button
                type="button"
                onClick={() => setResetHelpOpen(true)}
                className="text-accent hover:text-accent-hover text-sm font-medium transition-colors bg-transparent border-0 cursor-pointer p-0"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-danger-tint border border-danger-border rounded-xl text-danger text-sm font-medium">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 4a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0V5Zm.75 6.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                  </svg>
                  {error}
                </div>
                {error === 'Invalid email or password' && (
                  <p className="mt-2 text-xs font-normal text-danger leading-relaxed">
                    Email sign-in uses Supabase Auth for this project. If you reset the database, only accounts still present in Authentication can sign in here (e.g. superadmin after seeds). Phone + PIN on mobile is a separate flow.
                  </p>
                )}
              </div>
            )}

            <Form.Item className="!mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="!h-12 !rounded-xl !text-base !font-bold"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="absolute bottom-8 inset-x-0 text-center text-ink-muted text-sm">
          Need an account?{' '}
          <span className="text-ink-secondary font-medium">Ask your administrator.</span>
        </div>
      </div>

      <ForgotPasswordModal
        open={resetHelpOpen}
        onClose={() => setResetHelpOpen(false)}
      />
    </div>
  );
}
