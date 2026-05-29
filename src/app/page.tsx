'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getDefaultRouteForUser } from '@/lib/auth-routes';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';

export default function Home() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !initialized) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    router.replace(getDefaultRouteForUser(user));
  }, [mounted, initialized, user, router]);

  return <AppLoadingScreen />;
}
