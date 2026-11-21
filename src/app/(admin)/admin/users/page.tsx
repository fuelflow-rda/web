'use client';

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Drawer, Input, Select } from 'antd';
import { ChevronLeft, Eye, KeyRound, MailPlus, Search, Trash2, UserPlus, UserX } from 'lucide-react';
import api from '@/lib/api';
import ExportButton from '@/components/ExportButton';
import { Banner, Button, PageHeader, RowMenu, StatusChip, TextField, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { initialsOf } from '@/components/ui/Avatar';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { getUsers, resendInvite, type Paged, type UserRow } from '@/components/admin/data';
import { lastActive } from '@/components/admin/format';
import { ROLE, RolePill } from '@/components/admin/roles';
import { cx } from '@/lib/cx';
import { formatRwandaPhone } from '@/lib/phone';
import { useAuthStore } from '@/store/auth-store';
import { useStationStore } from '@/store/station-store';

const STATUS: Record<UserRow['account_status'], { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  on_shift: { label: 'On shift', tone: 'success' },
  pin_locked: { label: 'PIN locked', tone: 'warning' },
  not_synced: { label: 'Not synced', tone: 'warning' },
  invited: { label: 'Invite sent', tone: 'info' },
  deactivated: { label: 'Deactivated', tone: 'neutral' },
};
const PAGE = 20;

const shortName = (n?: string | null) => {
  const p = (n ?? '').trim().split(/\s+/).filter(Boolean);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : (p[0] ?? '');
};

export default function UsersPage() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}

function UsersView() {
  const params = useSearchParams();
  const me = useAuthStore((s) => s.user);
  const platform = me?.role === 'SUPERADMIN';
  const { stations, fetchStations } = useStationStore();
  const [q, setQ] = useState(params.get('search') ?? '');
  const [query, setQuery] = useState(q);
  const [role, setRole] = useState<string | undefined>();
  const [company, setCompany] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paged<UserRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [inviting, setInviting] = useState(false);
  const [open, setOpen] = useState<UserRow | null>(null);
  const [openOnPin, setOpenOnPin] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);
  useEffect(() => {
    void fetchStations();
    if (platform)
      api
        .get('/companies')
        .then((r) =>
          setCompanies(
            ((r.data as Array<{ id: string; name: string }>) ?? []).map((c) => ({ id: c.id, name: c.name })),
          ),
        )
        .catch(() => {});
  }, [platform, fetchStations]);

  const filterKey = JSON.stringify([query, role, company, status]);
  const [lastFilter, setLastFilter] = useState(filterKey);
  if (filterKey !== lastFilter) {
    setLastFilter(filterKey);
    setPage(1);
  }
  const requestKey = JSON.stringify([filterKey, page, nonce]);
  useEffect(() => {
    let live = true;
    const p: Record<string, unknown> = { page, limit: PAGE, sortBy: 'last_seen_at', sortOrder: 'desc' };
    if (query) p.search = query;
    if (role) p.role = role;
    if (company) p.company_id = company;
    if (status) p.status = status;
    getUsers(p)
      .then((r) => live && (setResult(r), setError(null)))
      .catch((err: Error) => live && setError(err.message))
      .finally(() => live && setLoadedKey(requestKey));
    return () => {
      live = false;
    };
  }, [requestKey, page, query, role, company, status]);
  const loading = loadedKey !== requestKey;

  const stationName = useMemo(() => new Map(stations.map((s) => [s.id, s.name])), [stations]);
  const rows = result?.data ?? [];
  const total = result?.pagination.total ?? 0;
  const changed = (m: string) => {
    setNotice(m);
    setOpen(null);
    setInviting(false);
    setNonce((n) => n + 1);
  };

  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';

  return (
    <>
      <PageHeader
        title="Users"
        description={
          result
            ? `${num(total)} ${total === 1 ? 'person' : 'people'}${platform && companies.length ? ` across ${companies.length} companies` : ''} · administrators and managers use the web, attendants use the app`
            : 'Administrators and managers use the web, attendants use the app'
        }
        actions={
          <>
            <ExportButton
              filename="users"
              data={rows.map((u) => ({
                name: u.name ?? '',
                contact: u.email ?? formatRwandaPhone(u.phone),
                role: ROLE[u.role],
                company: u.companies?.name ?? '',
                station: u.stations?.name ?? (u.role === 'company_admin' ? 'All stations' : ''),
                last: lastActive(u),
                status: STATUS[u.account_status].label,
              }))}
              columns={[
                { header: 'Name', key: 'name' },
                { header: 'Email or phone', key: 'contact' },
                { header: 'Role', key: 'role' },
                { header: 'Company', key: 'company' },
                { header: 'Station', key: 'station' },
                { header: 'Last active', key: 'last' },
                { header: 'Status', key: 'status' },
              ]}
            />
            <Button kind="primary" icon={UserPlus} onClick={() => setInviting(true)}>
              Invite user
            </Button>
          </>
        }
      />
      {notice ? <Banner tone="success" title={notice} /> : null}

      <div role="search" aria-label="Filter people" className="flex flex-wrap gap-3">
        <Input
          aria-label="Search name, email or phone"
          placeholder="Search name, email or phone"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
          className="w-full sm:w-70"
        />
        <Select
          aria-label="Role"
          placeholder="All roles"
          allowClear
          value={role}
          onChange={setRole}
          className="w-full sm:w-45"
          options={(['company_admin', 'station_manager', 'attendant'] as const).map((r) => ({
            value: r,
            label: ROLE[r],
          }))}
        />
        {platform ? (
          <Select
            aria-label="Company"
            placeholder="All companies"
            allowClear
            showSearch
            optionFilterProp="label"
            value={company}
            onChange={setCompany}
            className="w-full sm:w-45"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
          />
        ) : null}
        <Select
          aria-label="Status"
          placeholder="All statuses"
          allowClear
          value={status}
          onChange={setStatus}
          className="w-full sm:w-45"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'invited', label: 'Invite sent' },
            { value: 'pin_locked', label: 'PIN locked' },
            { value: 'deactivated', label: 'Deactivated' },
          ]}
        />
      </div>

      <section
        aria-labelledby="people-title"
        className="min-w-0 overflow-hidden rounded-card border border-border bg-surface"
      >
        <header className="flex flex-col gap-0.5 border-b border-border px-5 py-3.5">
          <h2 id="people-title" className="m-0 text-15 font-semibold text-text">
            {num(total)} {total === 1 ? 'person' : 'people'}
          </h2>
          <p className="m-0 text-12 text-text-muted">Most recently active first</p>
        </header>
        {error && !result ? (
          <div className="p-5">
            <PanelError message="People could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : !result ? (
          <div className="p-5">
            <PanelSkeleton rows={8} />
          </div>
        ) : rows.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">Nobody matches these filters.</p>
        ) : (
          <div className={cx('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
            <table className="w-full min-w-225 border-collapse">
              <thead className="bg-surface-muted">
                <tr>
                  {['Person', 'Role', ...(platform ? ['Company'] : []), 'Station', 'Last active', 'Status'].map((h) => (
                    <th key={h} scope="col" className={head}>
                      {h}
                    </th>
                  ))}
                  <th scope="col" className={cx(head, 'w-12')}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const s = STATUS[u.account_status];
                  const contact =
                    u.account_status === 'invited' && u.invited_by_name
                      ? `Invited by ${shortName(u.invited_by_name)}`
                      : (u.email ?? formatRwandaPhone(u.phone));
                  return (
                    <tr
                      key={u.id}
                      onClick={() => (setOpenOnPin(false), setOpen(u))}
                      className="cursor-pointer transition-colors hover:bg-surface-muted"
                    >
                      <th scope="row" className={cx(cell, 'text-left font-normal')}>
                        <button
                          type="button"
                          onClick={(e) => (e.stopPropagation(), setOpenOnPin(false), setOpen(u))}
                          className={cx(
                            'flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left',
                            focusRing,
                          )}
                        >
                          <span
                            aria-hidden
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-12 font-semibold text-text-secondary"
                          >
                            {initialsOf(u.name || u.email || '?')}
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className="text-14 font-semibold text-text">{u.name || u.email}</span>
                            <span className={cx('text-12 text-text-muted', !u.email && 'font-mono')}>{contact}</span>
                          </span>
                        </button>
                      </th>
                      <td className={cell}>
                        <RolePill role={u.role} />
                      </td>
                      {platform ? <td className={cx(cell, 'text-14 text-text')}>{u.companies?.name ?? '—'}</td> : null}
                      <td className={cx(cell, 'text-14 text-text')}>
                        {u.role === 'company_admin'
                          ? 'All stations'
                          : (u.stations?.name ?? (u.station_id ? stationName.get(u.station_id) : null) ?? '—')}
                      </td>
                      <td className={cx(cell, 'text-14 whitespace-nowrap text-text-secondary')}>{lastActive(u)}</td>
                      <td className={cell}>
                        <StatusChip tone={s.tone}>{s.label}</StatusChip>
                      </td>
                      <td className={cx(cell, 'py-2 text-right')}>
                        <RowMenu
                          label={`Actions for ${u.name || u.email || 'this person'}`}
                          items={[
                            {
                              key: 'view',
                              label: 'View details',
                              icon: Eye,
                              onClick: () => (setOpenOnPin(false), setOpen(u)),
                            },
                            ...(u.role === 'attendant'
                              ? [
                                  {
                                    key: 'pin',
                                    label: u.pin_locked_at ? 'Unlock with a new PIN' : 'Set a new PIN',
                                    icon: KeyRound,
                                    onClick: () => (setOpenOnPin(true), setOpen(u)),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="m-0 text-13 text-text-secondary" aria-live="polite">
            {total === 0
              ? 'No results'
              : `Showing ${num((page - 1) * PAGE + 1)} to ${num(Math.min(page * PAGE, total))} of ${num(total)}`}
          </p>
          <div className="flex gap-2">
            <Button icon={ChevronLeft} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button disabled={page * PAGE >= total || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </footer>
      </section>

      <InviteUserDrawer
        open={inviting}
        platform={platform}
        companies={companies}
        onClose={() => setInviting(false)}
        onDone={changed}
      />
      <UserDrawer
        user={open}
        focusPin={openOnPin}
        meId={me?.id ?? null}
        onClose={() => setOpen(null)}
        onDone={changed}
      />
    </>
  );
}

function InviteUserDrawer({
  open,
  platform,
  companies,
  onClose,
  onDone,
}: {
  open: boolean;
  platform: boolean;
  companies: Array<{ id: string; name: string }>;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const me = useAuthStore((s) => s.user);
  const { stations } = useStationStore();
  const [role, setRole] = useState<'company_admin' | 'station_manager'>('station_manager');
  const [companyId, setCompanyId] = useState<string | undefined>(me?.companyId);
  const [stationId, setStationId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const companyStations = stations.filter((s) => !companyId || s.companyId === companyId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setProblem('Enter their name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setProblem('Enter an email such as name@company.rw.');
    if (!companyId) return setProblem('Choose their company.');
    if (role === 'station_manager' && !stationId) return setProblem('Choose the station they manage.');
    setSaving(true);
    setProblem('');
    try {
      const res = await api.post('/users', {
        name: name.trim(),
        email: email.trim(),
        role,
        company_id: companyId,
        ...(role === 'station_manager' ? { station_id: stationId } : {}),
      });
      const invite = (res.data as { invite?: { sent: boolean } }).invite;
      setName('');
      setEmail('');
      onDone(
        invite?.sent
          ? `Invitation sent to ${email.trim()}.`
          : `${name.trim()} is added, but the invitation could not be emailed. Resend it once mail is set up.`,
      );
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The invitation could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={460}
      title="Invite user"
      footer={
        <div className="flex gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="primary" icon={MailPlus} htmlType="submit" form="invite-user" loading={saving}>
            Send invitation
          </Button>
        </div>
      }
    >
      <form id="invite-user" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <p className="m-0 text-14 text-text-secondary">
          They get an email with a link to set their own password. Attendants are added from the Attendants page, with a
          phone number and PIN.
        </p>
        {problem ? <Banner tone="danger" title={problem} /> : null}
        <div className="flex flex-col gap-2">
          <label htmlFor="iu-role" className="text-13 font-medium text-text-secondary">
            Role
          </label>
          <Select
            id="iu-role"
            value={role}
            onChange={setRole}
            options={[
              { value: 'station_manager', label: 'Station manager' },
              { value: 'company_admin', label: 'Company admin' },
            ]}
          />
        </div>
        {platform ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="iu-company" className="text-13 font-medium text-text-secondary">
              Company
            </label>
            <Select
              id="iu-company"
              value={companyId}
              onChange={(v) => (setCompanyId(v), setStationId(undefined))}
              showSearch
              optionFilterProp="label"
              placeholder="Choose a company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        ) : null}
        {role === 'station_manager' ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="iu-station" className="text-13 font-medium text-text-secondary">
              Station
            </label>
            <Select
              id="iu-station"
              value={stationId}
              onChange={setStationId}
              placeholder="Choose a station"
              options={companyStations.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
        ) : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="They sign in with this address."
        />
      </form>
    </Drawer>
  );
}

function UserDrawer({
  user,
  focusPin = false,
  meId,
  onClose,
  onDone,
}: {
  user: UserRow | null;
  /** Opened from the row menu's PIN item: the PIN field takes focus. */
  focusPin?: boolean;
  meId: string | null;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const { modal } = App.useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const [pin, setPin] = useState('');
  if (!user) return <Drawer open={false} onClose={onClose} />;
  const s = STATUS[user.account_status];
  const self = user.id === meId;
  const run = async (key: string, fn: () => Promise<unknown>, message: string) => {
    setBusy(key);
    setProblem('');
    try {
      await fn();
      setPin('');
      onDone(message);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      setBusy(null);
    }
  };
  const remove = () =>
    modal.confirm({
      title: `Delete ${user.name ?? user.email}?`,
      content:
        'Their sign-in is removed. Sales and records they made stay, under their name. Deactivating is usually enough.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => run('delete', () => api.delete(`/users/${user.id}`), `${user.name ?? 'The user'} is deleted.`),
    });
  const rows: Array<[string, string]> = [
    ['Role', ROLE[user.role]],
    ['Company', user.companies?.name ?? '—'],
    ['Station', user.role === 'company_admin' ? 'All stations' : (user.stations?.name ?? '—')],
    [user.email ? 'Email' : 'Phone', user.email ?? formatRwandaPhone(user.phone)],
    ['Last active', lastActive(user)],
    ...(user.invited_at
      ? ([
          [
            'Invited',
            `${new Date(user.invited_at).toLocaleDateString('en-GB')}${user.invited_by_name ? ` by ${user.invited_by_name}` : ''}`,
          ],
        ] as Array<[string, string]>)
      : []),
  ];
  return (
    <Drawer open onClose={onClose} size={460} title={user.name ?? user.email ?? 'User'}>
      <div className="flex flex-col gap-5">
        <StatusChip tone={s.tone} className="self-start">
          {s.label}
        </StatusChip>
        {problem ? <Banner tone="danger" title={problem} /> : null}
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-13 text-text-muted">{k}</dt>
              <dd className="m-0 text-14 text-text">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2.5 border-t border-border pt-5">
          {user.account_status === 'invited' ? (
            <Button
              icon={MailPlus}
              loading={busy === 'invite'}
              onClick={() => run('invite', () => resendInvite(user.id), `A new invitation went to ${user.email}.`)}
            >
              Resend invitation
            </Button>
          ) : null}
          {user.email && user.role !== 'attendant' && user.account_status !== 'invited' && !self ? (
            <Button
              icon={KeyRound}
              loading={busy === 'reset'}
              onClick={() =>
                run(
                  'reset',
                  () => api.post(`/users/${user.id}/reset-password`, {}),
                  `A link to choose a new password went to ${user.email}.`,
                )
              }
            >
              Send a password reset link
            </Button>
          ) : null}
          {user.role === 'attendant' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d{4,6}$/.test(pin)) return setProblem('Use 4 to 6 digits.');
                void run(
                  'pin',
                  () => api.post(`/users/${user.id}/unlock-pin`, { pin }),
                  `New PIN set for ${user.name}. Tell them in person.`,
                );
              }}
              noValidate
              className="flex items-end gap-2"
            >
              <TextField
                label={user.pin_locked_at ? 'Unlock with a new PIN' : 'New PIN'}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                revealable
                inputMode="numeric"
                mono
                autoFocus={focusPin}
                className="flex-1"
              />
              <Button htmlType="submit" loading={busy === 'pin'}>
                Set PIN
              </Button>
            </form>
          ) : null}
          {!self ? (
            <Button
              icon={UserX}
              loading={busy === 'active'}
              onClick={() =>
                run(
                  'active',
                  () => api.patch(`/users/${user.id}`, { is_active: user.account_status === 'deactivated' }),
                  user.account_status === 'deactivated'
                    ? `${user.name} is active again.`
                    : `${user.name} is deactivated.`,
                )
              }
            >
              {user.account_status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
            </Button>
          ) : null}
          {!self ? (
            <Button kind="danger" icon={Trash2} onClick={remove} loading={busy === 'delete'}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
