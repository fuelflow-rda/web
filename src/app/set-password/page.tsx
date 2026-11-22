'use client';

import { SetPasswordFlow } from '@/components/auth/SetPasswordFlow';

/** Where an administrator's "choose a new password" link lands. */
export default function SetPasswordPage() {
  return <SetPasswordFlow expected="reset" />;
}
