'use client';

import { SetPasswordFlow } from '@/components/auth/SetPasswordFlow';

/** Where an invitation email's link lands. */
export default function AcceptInvitePage() {
  return <SetPasswordFlow expected="invite" />;
}
