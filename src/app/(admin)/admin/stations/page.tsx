'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Input, Modal, Select } from 'antd';
import { MapPinPlus, Pencil, Search, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Banner, Button, PageHeader, Panel, TextField } from '@/components/ui';
import { focusRing } from '@/components/ui/focus';
import { PanelError, PanelSkeleton, num } from '@/components/overview/panels';
import { cx } from '@/lib/cx';
import { useAuthStore } from '@/store/auth-store';

interface StationRow {
  id: string;
  name: string;
  location: string | null;
  company_id: string;
  created_at: string;
  companies?: { id: string; name: string } | null;
}
const PAGE = 20;

/**
 * Stations: the platform's list across companies, or a company admin's own.
 * Not designed; restyled from the components. Create, rename, move address,
 * delete.
 */
export default function StationsPage() {
  return (
    <Suspense>
      <StationsView />
    </Suspense>
  );
}

function StationsView() {
  const { modal } = App.useApp();
  const params = useSearchParams();
  const me = useAuthStore((s) => s.user);
  const platform = me?.role === 'SUPERADMIN';
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [company, setCompany] = useState<string | undefined>(params.get('company') ?? undefined);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'name' | 'created_at'>('name');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ rows: StationRow[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [editing, setEditing] = useState<StationRow | 'new' | null>(params.get('new') === '1' ? 'new' : null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (!platform) return;
    api
      .get('/companies')
      .then((r) =>
        setCompanies(((r.data as Array<{ id: string; name: string }>) ?? []).map((c) => ({ id: c.id, name: c.name }))),
      )
      .catch(() => {});
  }, [platform]);

  const filterKey = JSON.stringify([query, company, sort]);
  const [lastFilter, setLastFilter] = useState(filterKey);
  if (filterKey !== lastFilter) {
    setLastFilter(filterKey);
    setPage(1);
  }
  useEffect(() => {
    let live = true;
    api
      .get('/stations', {
        params: {
          search: query || undefined,
          sortBy: sort,
          sortOrder: sort === 'name' ? 'asc' : 'desc',
          page,
          limit: PAGE,
          ...(platform && company ? { company_id: company } : {}),
        },
      })
      .then((r) => {
        if (!live) return;
        const body = r.data as { data?: StationRow[]; pagination?: { total: number } } | StationRow[];
        const rows = Array.isArray(body) ? body : (body.data ?? []);
        setResult({ rows, total: Array.isArray(body) ? rows.length : (body.pagination?.total ?? rows.length) });
        setError(null);
      })
      .catch((err: Error) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [query, company, sort, page, platform, nonce]);

  const remove = (s: StationRow) =>
    modal.confirm({
      title: `Delete ${s.name}?`,
      content: 'Its pumps, prices, shifts and sales go with it. This cannot be undone.',
      okText: 'Delete station',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api.delete(`/stations/${s.id}`);
        setNotice(`${s.name} is deleted.`);
        setNonce((n) => n + 1);
      },
    });

  const head =
    'px-3 py-2.5 text-left type-overline text-11 font-medium whitespace-nowrap text-text-muted first:pl-5 last:pr-5';
  const cell = 'border-t border-border px-3 py-3 first:pl-5 last:pr-5';
  const total = result?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Stations"
        description={platform ? 'Every station on the platform' : 'Your company’s stations'}
        actions={
          <Button kind="primary" icon={MapPinPlus} onClick={() => setEditing('new')}>
            Add station
          </Button>
        }
      />
      {notice ? <Banner tone="success" title={notice} /> : null}
      <div role="search" aria-label="Filter stations" className="flex flex-wrap gap-3">
        <Input
          aria-label="Search stations"
          placeholder="Search name or location"
          prefix={<Search size={16} aria-hidden className="text-text-muted" />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          allowClear
          className="w-full sm:w-70"
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
            className="w-full sm:w-50"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
          />
        ) : null}
        <Select
          aria-label="Sort"
          value={sort}
          onChange={setSort}
          className="w-full sm:w-40"
          options={[
            { value: 'name', label: 'By name' },
            { value: 'created_at', label: 'Newest first' },
          ]}
        />
      </div>
      <Panel title={`${num(total)} ${total === 1 ? 'station' : 'stations'}`} padded={false}>
        {error && !result ? (
          <div className="p-5">
            <PanelError message="Stations could not be loaded." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : !result ? (
          <div className="p-5">
            <PanelSkeleton rows={6} />
          </div>
        ) : result.rows.length === 0 ? (
          <p className="m-0 px-5 py-12 text-center text-14 text-text-secondary">
            {query || company ? 'No station matches.' : 'No stations yet. Add the first one.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse">
              <thead className="bg-surface-muted">
                <tr>
                  <th scope="col" className={head}>
                    Station
                  </th>
                  {platform ? (
                    <th scope="col" className={head}>
                      Company
                    </th>
                  ) : null}
                  <th scope="col" className={head}>
                    Added
                  </th>
                  <th scope="col" className={cx(head, 'text-right')}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className={cx(cell, 'text-left font-normal')}>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-14 font-semibold text-text">{s.name}</span>
                        <span className="text-12 text-text-muted">{s.location || 'No address'}</span>
                      </span>
                    </th>
                    {platform ? <td className={cx(cell, 'text-14 text-text')}>{s.companies?.name ?? '—'}</td> : null}
                    <td className={cx(cell, 'text-14 text-text-secondary')}>
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className={cx(cell, 'text-right')}>
                      <span className="inline-flex gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${s.name}`}
                          onClick={() => setEditing(s)}
                          className={cx(
                            'inline-flex size-8 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-text-secondary hover:bg-surface-muted',
                            focusRing,
                          )}
                        >
                          <Pencil size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${s.name}`}
                          onClick={() => remove(s)}
                          className={cx(
                            'inline-flex size-8 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-danger hover:bg-danger-tint',
                            focusRing,
                          )}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="m-0 text-13 text-text-secondary">
            {total ? `Page ${page} of ${Math.max(1, Math.ceil(total / PAGE))}` : ''}
          </p>
          <div className="flex gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button disabled={page * PAGE >= total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Panel>

      {editing ? (
        <StationModal
          station={editing === 'new' ? null : editing}
          platform={platform}
          companies={companies}
          defaultCompany={company ?? me?.companyId}
          onClose={() => setEditing(null)}
          onDone={(m) => {
            setEditing(null);
            setNotice(m);
            setNonce((n) => n + 1);
          }}
        />
      ) : null}
    </>
  );
}

function StationModal({
  station,
  platform,
  companies,
  defaultCompany,
  onClose,
  onDone,
}: {
  station: StationRow | null;
  platform: boolean;
  companies: Array<{ id: string; name: string }>;
  defaultCompany?: string;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [name, setName] = useState(station?.name ?? '');
  const [location, setLocation] = useState(station?.location ?? '');
  const [companyId, setCompanyId] = useState<string | undefined>(station?.company_id ?? defaultCompany);
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (name.trim().length < 2) return setProblem('Enter the station name.');
    if (!station && !companyId) return setProblem('Choose the company it belongs to.');
    setSaving(true);
    try {
      if (station) await api.patch(`/stations/${station.id}`, { name: name.trim(), location: location.trim() });
      else await api.post('/stations', { name: name.trim(), location: location.trim(), company_id: companyId });
      onDone(station ? `${name.trim()} is updated.` : `${name.trim()} is added. Add its pumps and prices next.`);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'The station could not be saved.');
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onCancel={onClose}
      title={station ? `Edit ${station.name}` : 'Add station'}
      okText={station ? 'Save' : 'Add station'}
      onOk={() => submit()}
      confirmLoading={saving}
      destroyOnHidden
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {problem ? <Banner tone="danger" title={problem} /> : null}
        {platform && !station ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="st-company" className="text-13 font-medium text-text-secondary">
              Company
            </label>
            <Select
              id="st-company"
              value={companyId}
              onChange={setCompanyId}
              showSearch
              optionFilterProp="label"
              placeholder="Choose a company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        ) : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <TextField
          label="Address"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          hint="Street and district, as on the sign: KN 3 Rd, Nyarugenge."
        />
      </form>
    </Modal>
  );
}
