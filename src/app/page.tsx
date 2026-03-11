'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/auth-store';

export default function Home() {
  const router = useRouter();
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}
