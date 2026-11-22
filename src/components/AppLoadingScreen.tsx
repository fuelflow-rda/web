'use client';

import { RelaiMark } from './brand/RelaiMark';

/**
 * Full-screen loader shown while sign-in state is resolved or a redirect runs:
 * the mark alone, pulsing gently, and a name for assistive tech.
 */
export function AppLoadingScreen() {
  return (
    <div role="status" aria-label="Loading Relai" className="flex min-h-screen items-center justify-center bg-bg">
      <span className="animate-pulse text-primary motion-reduce:animate-none">
        <RelaiMark size={48} />
      </span>
    </div>
  );
}
