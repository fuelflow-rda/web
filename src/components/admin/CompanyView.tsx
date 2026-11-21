'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { App, Drawer } from 'antd';
import { MailPlus, MapPinPlus, Pencil, Trash2 } from 'lucide-react';
import { Banner, Button, KpiTile, PageHeader, Panel, StatusChip, TextField, type StatusTone } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { initialsOf } from '@/components/ui/Avatar';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { usePolled } from '@/components/overview/data';
import { useShellCrumb } from '@/components/shell/AppShell';
import { cx } from '@/lib/cx';
import { productName } from '@/lib/product-types';
import {
  deleteCompany,
  getCompanyOverview,
  getUsers,
  inviteCompanyAdmin,
  resendInvite,
  updateCompany,
  type CompanyOverview,
  type UserRow,
} from './data';

const STATION: Record<CompanyOverview['stations'][number]['status'], StatusTone> = {
  live: 'success',
  review: 'warning',
  no_sales_today: 'neutral',
};
const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));
const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));
const weekday = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
const tin = (t: string | null) => (t ? `${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6)}` : null);

function InviteDrawer({
  open,
  companyId,
  platform,
  onClose,
  onDone,
}: {
  open: boolean;
  companyId: string;
  platform: boolean;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setProblem('Enter their name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setProblem('Enter an email such as name@company.rw.');
    setSaving(true);
    setProblem('');
    try {
      const res = await inviteCompanyAdmin(companyId, name.trim(), email.trim(), platform);
      const body = res.data as { emailSent?: boolean; invite?: { sent: boolean; reason?: string } };
      const sent = body.emailSent ?? body.invite?.sent ?? false;
      setName('');
      setEmail('');
      onDone(
        sent
          ? `Invitation sent to ${email.trim()}.`
          : `${name.trim()} is added, but the invitation could not be emailed. Use Resend once mail is set up.`,
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
      title="Invite an administrator"
      footer={
        <div className="flex gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="primary" icon={MailPlus} htmlType="submit" form="invite-admin" loading={saving}>
            Send invitation
          </Button>
        </div>
      }
    >
      <form id="invite-admin" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <p className="m-0 text-14 text-text-secondary">
          They get an email with a link to set their own password. The link works once and lasts 7 days.
        </p>
        {problem ? <Banner tone="danger" title={problem} /> : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="They sign in with this address."
        />
        <Banner tone="info" title="Company administrators see every station">
          They can add stations, managers and attendants, and change prices.
        </Banner>
      </form>
    </Drawer>
  );
}

function DetailsDrawer({
  open,
  company,
  platform,
  onClose,
  onDone,
}: {
  open: boolean;
  company: CompanyOverview['company'];
  platform: boolean;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [form, setForm] = useState({
    name: company.name,
    legal_name: company.legalName ?? '',
    tax_id: tin(company.taxId) ?? '',
    billing_email: company.billingEmail ?? '',
    data_region: company.dataRegion ?? '',
  });
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.tax_id && !/^\d{9}$/.test(form.tax_id.replace(/\s+/g, '')))
      return setProblem('Tax ID (TIN) must be nine digits.');
    setSaving(true);
    setProblem('');
    try {
      const { data_region, ...rest } = form;
      await updateCompany(company.id, { ...rest, ...(platform ? { data_region } : {}) });
      onDone('Company details saved.');
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The details could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={460}
      title="Company details"
      footer={
        <div className="flex gap-2.5 py-1">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="primary" htmlType="submit" form="company-details" loading={saving}>
            Save
          </Button>
        </div>
      }
    >
      <form id="company-details" onSubmit={submit} noValidate className="flex flex-col gap-5">
        {problem ? <Banner tone="danger" title={problem} /> : null}
        <TextField label="Name" value={form.name} onChange={set('name')} hint="As customers and staff know it." />
        <TextField
          label="Legal name"
          value={form.legal_name}
          onChange={set('legal_name')}
          hint="As registered with RDB."
        />
        <TextField
          label="Tax ID (TIN)"
          value={form.tax_id}
          onChange={set('tax_id')}
          mono
          inputMode="numeric"
          hint="Nine digits."
        />
        <TextField
          label="Billing contact"
          type="email"
          value={form.billing_email}
          onChange={set('billing_email')}
          hint="Where invoices go."
        />
        {platform ? (
          <TextField
            label="Data region"
            value={form.data_region}
            onChange={set('data_region')}
            hint="Where this company's data is hosted, as you state it to them."
          />
        ) : null}
      </form>
    </Drawer>
  );
}

/**
 * A company at a glance (Pencil "Admin / Company"): takings today, who is on
 * shift, discrepancies nobody has signed off, its stations, its
 * administrators and its details. The platform sees any company; a company
 * admin sees their own.
 */
export function CompanyView({
  companyId,
  platform,
  startInviting = false,
}: {
  companyId: string;
  platform: boolean;
  startInviting?: boolean;
}) {
  const { modal } = App.useApp();
  const router = useRouter();
  const overview = usePolled(`company-${companyId}`, () => getCompanyOverview(companyId), 60_000);
  const admins = usePolled(
    `admins-${companyId}`,
    () => getUsers({ company_id: companyId, role: 'company_admin', limit: 50, sortBy: 'name', sortOrder: 'asc' }),
    60_000,
  );
  const [inviting, setInviting] = useState(startInviting);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const o = overview.data;
  useShellCrumb(platform ? o?.company.name : null);

  const done = (m: string) => {
    setNotice(m);
    setInviting(false);
    setEditing(false);
    overview.reload();
    admins.reload();
  };

  const remove = () =>
    modal.confirm({
      title: `Delete ${o?.company.name}?`,
      content: 'This removes the company, its stations, people and records. It cannot be undone.',
      okText: 'Delete company',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteCompany(companyId);
        router.replace('/admin/companies');
      },
    });

  if (overview.error && !o) {
    return (
      <>
        <PageHeader title="Company" />
        <Panel title="Company">
          <PanelError message="The company could not be loaded." onRetry={overview.reload} />
        </Panel>
      </>
    );
  }
  if (!o) return <PanelSkeleton rows={8} />;

  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';
  const adminRows = (admins.data?.data ?? []) as UserRow[];

  return (
    <>
      <PageHeader
        title={o.company.name}
        description={`Customer since ${longDate(o.company.createdAt)} · ${o.stations.length} ${o.stations.length === 1 ? 'station' : 'stations'} · ${o.administrators} ${o.administrators === 1 ? 'administrator' : 'administrators'}`}
        actions={
          <>
            <Button icon={Pencil} onClick={() => setEditing(true)}>
              Edit company
            </Button>
            <Button
              kind="primary"
              icon={MapPinPlus}
              onClick={() => router.push(`/admin/stations?new=1&company=${companyId}`)}
            >
              Add station
            </Button>
          </>
        }
      />
      {notice ? <Banner tone="success" title={notice} /> : null}
      {o.administrators === 0 ? (
        <Banner
          tone="warning"
          title="This company has no administrator yet"
          action={{ label: 'Invite one', onClick: () => setInviting(true) }}
        >
          Someone needs to add its stations and people.
        </Banner>
      ) : null}

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiTile
          label="Revenue today"
          prefix="RWF"
          value={num(o.kpis.revenueToday)}
          delta={{
            text: `Across ${o.stations.length} ${o.stations.length === 1 ? 'station' : 'stations'}`,
            direction: 'flat',
          }}
        />
        <KpiTile
          label="On shift now"
          value={num(o.kpis.onShiftNow)}
          delta={{ text: `of ${o.kpis.attendants} attendants`, direction: 'flat' }}
        />
        <KpiTile
          label="Open discrepancies"
          value={num(o.kpis.openDiscrepancies)}
          delta={{
            text: o.kpis.oldestOpenDiscrepancy
              ? `Oldest from ${weekday(o.kpis.oldestOpenDiscrepancy)}`
              : 'All reviewed',
            direction: 'flat',
          }}
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Stations" padded={false}>
          {o.stations.length === 0 ? (
            <p className="m-0 p-5 text-14 text-text-secondary">
              No stations yet. Add the first one to start recording sales.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 border-collapse">
                <thead className="bg-surface-muted">
                  <tr>
                    <th scope="col" className={head}>
                      Station
                    </th>
                    <th scope="col" className={head}>
                      Manager
                    </th>
                    <th scope="col" className={cx(head, 'text-right')}>
                      Pumps
                    </th>
                    <th scope="col" className={cx(head, 'text-right')}>
                      Revenue today
                    </th>
                    <th scope="col" className={head}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.stations.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" className={cx(cell, 'text-left font-normal')}>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-14 font-semibold text-text">{s.name}</span>
                          <span className="text-12 text-text-muted">{s.location ?? '—'}</span>
                        </span>
                      </th>
                      <td className={cx(cell, 'text-14 text-text')}>
                        {s.managers.map((m) => m.name).join(', ') || (
                          <span className="text-text-muted">No manager</span>
                        )}
                      </td>
                      <td
                        className={cx(cell, 'text-right font-mono text-13 text-text')}
                        title={`${s.pumps} pumps and ${s.chargers} chargers`}
                      >
                        {s.pumps} + {s.chargers}
                      </td>
                      <td className={cx(cell, 'text-right font-mono text-13 font-semibold text-text')}>
                        {num(s.revenueToday)}
                      </td>
                      <td className={cell}>
                        <StatusChip tone={STATION[s.status]}>
                          {s.status === 'review'
                            ? `${s.toReview} to review`
                            : s.status === 'live'
                              ? 'Live'
                              : 'No sales today'}
                        </StatusChip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel
            title="Administrators"
            meta="Can see every station in this company"
            extra={
              <Button size="md" icon={MailPlus} onClick={() => setInviting(true)}>
                Invite
              </Button>
            }
          >
            {admins.error && !admins.data ? (
              <PanelError message="Administrators could not be loaded." onRetry={admins.reload} />
            ) : !admins.data ? (
              <PanelSkeleton rows={2} />
            ) : adminRows.length === 0 ? (
              <p className="m-0 text-14 text-text-secondary">Nobody yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {adminRows.map((u) => {
                  const invited = u.account_status === 'invited';
                  return (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span
                        aria-hidden
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-12 font-semibold text-text-secondary"
                      >
                        {initialsOf(u.name || u.email || '?')}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-14 font-semibold text-text">{u.name || u.email}</span>
                        <span className="truncate text-12 text-text-muted">
                          {invited && u.invited_at ? `Invited ${day(u.invited_at)}` : u.email}
                        </span>
                      </span>
                      {invited ? (
                        <button
                          type="button"
                          onClick={() =>
                            void resendInvite(u.id)
                              .then((r) =>
                                done(
                                  r.sent
                                    ? `A new invitation went to ${u.email}.`
                                    : 'The invitation was renewed but could not be emailed.',
                                ),
                              )
                              .catch((err: Error) => setNotice(err.message))
                          }
                          className={cx(
                            'shrink-0 cursor-pointer border-0 bg-transparent p-0 text-13 font-semibold text-link hover:underline',
                            focusRing,
                          )}
                        >
                          Resend
                        </button>
                      ) : (
                        <StatusChip tone={u.account_status === 'deactivated' ? 'neutral' : 'success'}>
                          {u.account_status === 'deactivated' ? 'Deactivated' : 'Active'}
                        </StatusChip>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Company details"
            extra={
              <Button size="md" kind="ghost" icon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
            }
          >
            <dl className="m-0 flex flex-col gap-3">
              {(
                [
                  ['Legal name', o.company.legalName],
                  ['Tax ID (TIN)', tin(o.company.taxId)],
                  ['Billing contact', o.company.billingEmail],
                  ['Products', o.products.map(productName).join(', ') || null],
                  ['Data region', o.company.dataRegion],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <dt className="text-12 text-text-muted">{k}</dt>
                  <dd className={cx('m-0 text-14', v ? 'text-text' : 'text-text-muted')}>{v ?? 'Not set'}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          {platform ? (
            <Panel title="Danger zone">
              <div className="flex flex-col items-start gap-3">
                <p className="m-0 text-13 text-text-secondary">
                  Deleting removes the company with all its stations, people and records.
                </p>
                <Button kind="danger" icon={Trash2} onClick={remove}>
                  Delete company
                </Button>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>

      <InviteDrawer
        open={inviting}
        companyId={companyId}
        platform={platform}
        onClose={() => setInviting(false)}
        onDone={done}
      />
      {editing ? (
        <DetailsDrawer open company={o.company} platform={platform} onClose={() => setEditing(false)} onDone={done} />
      ) : null}
    </>
  );
}
