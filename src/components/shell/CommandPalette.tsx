'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from 'antd';
import { CornerDownLeft, Search } from 'lucide-react';
import api from '@/lib/api';
import { cx } from '@/lib/cx';
import type { NavGroup, ShellArea } from './nav';

export interface PaletteResult {
  id: string;
  group: string;
  label: string;
  detail?: string;
  href: string;
}

type Row = Record<string, unknown>;
const rowsOf = (data: unknown): Row[] =>
  Array.isArray(data) ? (data as Row[]) : (((data as { data?: Row[] })?.data ?? []) as Row[]);

/**
 * Mounted only while open, so each opening starts empty.
 *
 * What the search box finds for a term, beyond the pages themselves.
 *
 * Company area: attendants by name or phone, and a jump to sales by plate or
 * phone. Platform: companies, stations and people. Every source is scoped by
 * the API to what the person may see.
 */
async function searchRemote(area: ShellArea, term: string, signal: AbortSignal): Promise<PaletteResult[]> {
  const q = encodeURIComponent(term);
  if (area === 'company') {
    const res = await api
      .get('/users', {
        params: { role: 'attendant', search: term, limit: 5 },
        signal,
      })
      .catch(() => null);
    const people = rowsOf(res?.data).map((u) => ({
      id: `att-${u.id}`,
      group: 'Attendants',
      label: String(u.name ?? 'Unnamed'),
      detail: (u.phone as string | undefined) ?? undefined,
      href: `/attendants?search=${encodeURIComponent(String(u.name ?? term))}`,
    }));
    return [
      {
        id: 'sales',
        group: 'Sales',
        label: `Sales with plate or phone “${term}”`,
        href: `/transactions?search=${q}`,
      },
      ...people,
    ];
  }

  const [companies, stations, users] = await Promise.all([
    api.get('/companies', { signal }).catch(() => null),
    api.get('/stations', { params: { search: term, limit: 5 }, signal }).catch(() => null),
    api.get('/users', { params: { search: term, limit: 5 }, signal }).catch(() => null),
  ]);
  const needle = term.toLowerCase();
  return [
    ...rowsOf(companies?.data)
      .filter((c) =>
        String(c.name ?? '')
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 5)
      .map((c) => ({
        id: `co-${c.id}`,
        group: 'Companies',
        label: String(c.name),
        href: `/admin/companies/${c.id}`,
      })),
    ...rowsOf(stations?.data).map((s) => ({
      id: `st-${s.id}`,
      group: 'Stations',
      label: String(s.name),
      detail: (s.location as string | undefined) ?? undefined,
      href: `/admin/stations?search=${encodeURIComponent(String(s.name))}`,
    })),
    ...rowsOf(users?.data).map((u) => ({
      id: `us-${u.id}`,
      group: 'People',
      label: String(u.name ?? u.email ?? 'Unnamed'),
      detail: (u.email ?? u.phone) as string | undefined,
      href: `/admin/users?search=${encodeURIComponent(String(u.email ?? u.name ?? term))}`,
    })),
  ];
}

export function CommandPalette({
  open,
  onClose,
  area,
  groups,
  placeholder,
}: {
  open: boolean;
  onClose: () => void;
  area: ShellArea;
  groups: NavGroup[];
  placeholder: string;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [remote, setRemote] = useState<PaletteResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [index, setIndex] = useState(0);

  // Debounced, and the previous request is cancelled when the term changes.
  const query = term.trim();
  useEffect(() => {
    if (!open || query.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      searchRemote(area, query, ctrl.signal)
        .then((r) => !ctrl.signal.aborted && setRemote(r))
        .finally(() => !ctrl.signal.aborted && setSearching(false));
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, open, area]);

  const results = useMemo((): PaletteResult[] => {
    const needle = term.trim().toLowerCase();
    const pages = groups
      .flatMap((g) => g.items)
      .filter((i) => !needle || i.label.toLowerCase().includes(needle))
      .map((i): PaletteResult => ({
        id: `page-${i.href}-${i.label}`,
        group: 'Go to',
        label: i.label,
        href: i.href,
      }));
    // A term too short to search shows pages only, whatever an earlier search found.
    return [...pages, ...(query.length >= 2 ? remote : [])];
  }, [term, query, groups, remote]);
  const active = Math.min(index, Math.max(results.length - 1, 0));

  const go = (r: PaletteResult | undefined) => {
    if (!r) return;
    onClose();
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex(Math.min(active + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex(Math.max(active - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  let lastGroup = '';
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      title={null}
      width={560}
      destroyOnHidden
      afterOpenChange={(visible) => visible && inputRef.current?.focus()}
      classNames={{ container: 'p-0! overflow-hidden' }}
      aria-label="Search"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Search size={18} aria-hidden className="shrink-0 text-text-muted" />
        <input
          ref={inputRef}
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          aria-label="Search"
          className="min-w-0 flex-1 border-0 bg-transparent text-15 text-text outline-none placeholder:text-text-muted"
        />
        <kbd className="shrink-0 rounded-badge border border-border px-1.5 py-px font-mono text-11 text-text-muted">
          Esc
        </kbd>
      </div>
      <ul id={listId} role="listbox" aria-label="Results" className="m-0 max-h-96 list-none overflow-y-auto p-2">
        {results.map((r, i) => {
          const header = r.group !== lastGroup ? r.group : null;
          lastGroup = r.group;
          return (
            <li key={r.id} role="presentation">
              {header ? <div className="px-2 pt-2 pb-1 type-overline text-10 text-text-muted">{header}</div> : null}
              <div
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setIndex(i)}
                onClick={() => go(r)}
                className={cx(
                  'flex cursor-pointer items-center gap-3 rounded-control px-2 py-2 text-14',
                  i === active ? 'bg-surface-muted text-text' : 'text-text-secondary',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                {r.detail ? <span className="shrink-0 font-mono text-12 text-text-muted">{r.detail}</span> : null}
                {i === active ? <CornerDownLeft size={14} aria-hidden className="shrink-0 text-text-muted" /> : null}
              </div>
            </li>
          );
        })}
        {results.length === 0 ? (
          <li role="presentation" className="px-2 py-6 text-center text-13 text-text-secondary">
            {searching && query.length >= 2 ? 'Searching…' : 'No matches.'}
          </li>
        ) : searching && query.length >= 2 ? (
          <li role="presentation" className="px-2 py-2 text-12 text-text-muted">
            Searching…
          </li>
        ) : null}
      </ul>
    </Modal>
  );
}
