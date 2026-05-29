'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/** Hydrates auth from localStorage once on the client. */
export function AuthBootstrap() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}
