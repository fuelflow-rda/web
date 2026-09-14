'use client';

import { Spin } from 'antd';
import { BrandMark } from './BrandMark';

/** Full-screen loader shown while auth state is resolved or redirects run. */
export function AppLoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-sunken">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <BrandMark size={24} color="white" />
        </div>
        <Spin size="large" />
      </div>
    </div>
  );
}
