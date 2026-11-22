'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Save } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, Banner, Button, PageHeader, Panel, TextField } from '@/components/ui';
import { PanelError, PanelSkeleton } from '@/components/overview/panels';
import { ROLE_LABEL } from '@/components/shell/nav';
import { formatRwandaPhone, isValidRwandaPhone, normalizeRwandaPhone } from '@/lib/phone';

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  companies?: { name: string } | null;
  stations?: { name: string } | null;
}

type Notice = { tone: 'success' | 'danger'; text: string } | null;

/**
 * Your own account: name, phone, password. Not designed; restyled from the
 * components. Email is the sign-in address and only an admin changes it.
 */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your account" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ProfilePanel />
        <PasswordPanel />
      </div>
    </>
  );
}

function ProfilePanel() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [problems, setProblems] = useState<{ name?: string; phone?: string }>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    api
      .get('/auth/me')
      .then((r) => {
        if (!live) return;
        const p = r.data as Profile;
        setProfile(p);
        setName(p.name ?? '');
        setPhone(formatRwandaPhone(p.phone));
        setLoadError(null);
      })
      .catch((err: Error) => live && setLoadError(err.message));
    return () => {
      live = false;
    };
  }, [nonce]);

  const savedPhone = formatRwandaPhone(profile?.phone);
  const nameChanged = profile !== null && name.trim() !== (profile.name ?? '');
  const phoneChanged = profile !== null && phone.trim() !== savedPhone;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: { name?: string; phone?: string } = {};
    const found: typeof problems = {};
    if (nameChanged) {
      if (name.trim().length < 2) found.name = 'Enter your name.';
      else next.name = name.trim();
    }
    if (phoneChanged) {
      if (phone.trim() === '') next.phone = '';
      else if (!isValidRwandaPhone(phone)) found.phone = 'Enter a mobile number like 078 812 3456.';
      else next.phone = normalizeRwandaPhone(phone);
    }
    setProblems(found);
    setNotice(null);
    if (Object.keys(found).length || !Object.keys(next).length) return;
    setSaving(true);
    try {
      const r = await api.patch('/users/me', next);
      const saved = r.data as Pick<Profile, 'name' | 'phone'>;
      setProfile((p) => (p ? { ...p, name: saved.name, phone: saved.phone } : p));
      setName(saved.name ?? '');
      setPhone(formatRwandaPhone(saved.phone));
      if (saved.name) updateUser({ name: saved.name });
      setNotice({ tone: 'success', text: 'Your profile is saved.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: err instanceof Error ? err.message : 'Your profile could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const where = [profile?.companies?.name, profile?.stations?.name].filter(Boolean).join(' · ');
  const emailHint =
    user?.role === 'MANAGER'
      ? 'Your sign-in address. Your company admin can change it.'
      : 'Your sign-in address. Change it on the Users page.';

  return (
    <Panel title="Profile">
      {loadError && !profile ? (
        <PanelError message="Your profile could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
      ) : !profile ? (
        <PanelSkeleton rows={4} />
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name || user?.name || 'You'} className="size-14 text-16" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-16 font-semibold text-text">{profile.name}</span>
              <span className="text-13 text-text-secondary">
                {user ? ROLE_LABEL[user.role] : ''}
                {where ? ` · ${where}` : ''}
              </span>
            </div>
          </div>
          {notice ? <Banner tone={notice.tone} title={notice.text} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={problems.name}
              autoComplete="name"
              maxLength={160}
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={problems.phone}
              hint="Optional. A mobile number, like 078 812 3456."
              inputMode="tel"
              autoComplete="tel"
            />
            <TextField
              label="Email"
              value={profile.email ?? ''}
              readOnly
              variant="filled"
              hint={emailHint}
              className="sm:col-span-2"
            />
          </div>
          <div>
            <Button kind="primary" htmlType="submit" icon={Save} loading={saving} disabled={!nameChanged && !phoneChanged}>
              Save profile
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}

function PasswordPanel() {
  const email = useAuthStore((s) => s.user?.email ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problems, setProblems] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: typeof problems = {};
    if (!current) found.current = 'Enter your current password.';
    if (next.length < 8) found.next = 'Use at least 8 characters.';
    else if (next === current) found.next = 'Choose a password different from the current one.';
    if (!found.next && confirm !== next) found.confirm = 'The two passwords do not match.';
    setProblems(found);
    setNotice(null);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await api.post('/auth/password/change', { current_password: current, new_password: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      setNotice({ tone: 'success', text: 'Your password is changed. Use the new one next time you sign in.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Your password could not be changed.';
      if (/current password/i.test(message)) setProblems({ current: 'That is not your current password.' });
      else setNotice({ tone: 'danger', text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Password">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {/* Lets a password manager file the new password under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        {notice ? <Banner tone={notice.tone} title={notice.text} /> : null}
        <TextField
          label="Current password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={problems.current}
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={problems.next}
          hint="At least 8 characters."
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={problems.confirm}
          autoComplete="new-password"
        />
        <div>
          <Button kind="primary" htmlType="submit" icon={KeyRound} loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Panel>
  );
}
