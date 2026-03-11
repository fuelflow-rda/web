'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth-store';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [form] = Form.useForm();
  const [error, setError] = useState('');

  const handleLogin = async (values: { email: string; password: string }) => {
    setError('');
    try {
      const user = await login(values.email, values.password);
      message.success(`Welcome back, ${user.name}!`);
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      message.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-fuel-orange/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuel-blue/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 !rounded-2xl !shadow-2xl !border-0" bodyStyle={{ padding: '40px 32px' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-fuel-orange to-fuel-orange-dark rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
              <path d="M13 10h4a2 2 0 0 1 2 2v10" />
              <path d="M7 8v.01" />
              <path d="M7 12v.01" />
              <path d="M7 16v.01" />
            </svg>
          </div>
          <Title level={2} className="!mb-1 !text-slate-800">
            FuelFlow
          </Title>
          <Text type="secondary" className="text-base">
            Station Management Portal
          </Text>
        </div>

        <Divider className="!my-6" />

        <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Email address"
              className="!rounded-lg !h-12"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              className="!rounded-lg !h-12"
            />
          </Form.Item>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Form.Item className="!mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="!h-12 !rounded-lg !text-base !font-semibold"
            >
              Sign In
            </Button>
          </Form.Item>

          <div className="text-center">
            <Button type="link" className="!text-fuel-orange !p-0">
              Forgot your password?
            </Button>
          </div>
        </Form>

        <div className="mt-8 text-center">
          <Text type="secondary" className="text-xs">
            &copy; {new Date().getFullYear()} FuelFlow. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
}
