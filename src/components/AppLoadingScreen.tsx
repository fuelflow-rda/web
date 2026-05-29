'use client';

import { Spin } from 'antd';

/** Full-screen loader shown while auth state is resolved or redirects run. */
export function AppLoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-4 shadow-glow-orange">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
            <path d="M13 10h4a2 2 0 0 1 2 2v10" />
          </svg>
        </div>
        <Spin size="large" />
      </div>
    </div>
  );
}
