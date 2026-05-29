'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth-store';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user, initialized } = useAuthStore();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

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
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
        {/* Animated decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-fuel-orange/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-fuel-blue/6 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse-soft" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center shadow-glow-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M13 10h4a2 2 0 0 1 2 2v10" />
              </svg>
            </div>
            <span className="text-white text-xl font-extrabold tracking-tight">StationIQ</span>
          </div>

          {/* Center - Hero content */}
          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Manage your stations
              <span className="text-gradient-orange block">with confidence.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Real-time monitoring, smart reconciliation, and complete oversight
              of your fuel operations all in one powerful platform.
            </p>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-extrabold text-white">99.9%</div>
                <div className="text-sm text-slate-500 mt-1">Uptime</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl font-extrabold text-white">50+</div>
                <div className="text-sm text-slate-500 mt-1">Stations</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl font-extrabold text-white">10K+</div>
                <div className="text-sm text-slate-500 mt-1">Daily Txns</div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-slate-600 text-sm">
            &copy; {new Date().getFullYear()} StationIQ. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white lg:bg-gray-50/50">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center shadow-glow-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M13 10h4a2 2 0 0 1 2 2v10" />
              </svg>
            </div>
            <span className="text-slate-800 text-xl font-extrabold tracking-tight">StationIQ</span>
          </div>

          <div className="mb-8">
            <Title level={2} className="!mb-2 !text-slate-800 !text-2xl !font-extrabold">
              Welcome back
            </Title>
            <Text className="!text-slate-400 !text-base">
              Sign in to your management portal
            </Text>
          </div>

          <Form form={form} onFinish={handleLogin} layout="vertical" size="large" requiredMark={false}>
            <Form.Item
              name="email"
              label={<span className="text-sm font-semibold text-slate-600">Email</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-slate-300" />}
                placeholder="you@company.com"
                className="!h-12 !rounded-xl !bg-white"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-sm font-semibold text-slate-600">Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-300" />}
                placeholder="Enter your password"
                className="!h-12 !rounded-xl !bg-white"
              />
            </Form.Item>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 4a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0V5Zm.75 6.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                  </svg>
                  {error}
                </div>
                {error === 'Invalid email or password' && (
                  <p className="mt-2 text-xs font-normal text-red-700/90 leading-relaxed">
                    Email sign-in uses Supabase Auth for this project. If you reset the database, only accounts still present in Authentication can sign in here (e.g. superadmin after seeds). Phone + PIN on mobile is a separate flow.
                  </p>
                )}
              </div>
            )}

            <Form.Item className="!mb-4 !mt-6">
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

            <div className="text-center">
              <button type="button" className="text-fuel-orange hover:text-fuel-orange-dark text-sm font-medium transition-colors bg-transparent border-0 cursor-pointer">
                Forgot your password?
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
