'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

/** GET /analytics/station/:id/today */
export interface StationToday {
  date: string;
  generatedAt: string;
  kpis: {
    revenue: number;
    sales: number;
    avgTicket: number;
    liters: number;
    kwh: number;
    chargingSessions: number;
    fuelByProduct: Array<{ productType: string; quantity: number }>;
    revenueVsYesterday: number | null;
    yesterdayRevenueSameTime: number;
    yesterdayRevenue: number;
  };
  revenueByHour: Array<{ hour: number; today: number | null; yesterday: number; inProgress: boolean }>;
  reconciliation: ReconciliationSummary | null;
  onShift: Array<{ shiftId: string; attendant: { id: string; name: string | null } | null; startedAt: string; sales: number; revenue: number }>;
}

export interface ReconciliationSummary {
  id: string;
  date: string;
  generatedAt: string | null;
  reviewedAt: string | null;
  checks: number;
  toReview: number;
  unresolved: number;
  matched: number;
  offline: number;
  tolerance: number;
  items: Array<{
    pumpId: string;
    pumpNumber: number;
    productType: string;
    unit: string;
    reason: 'variance' | 'readings_missing' | null;
    meteredQuantity: number | null;
    recordedQuantity: number;
    volumeDifference: number | null;
    difference: number;
    resolution: { decision: 'explained' | 'flagged' } | null;
    shift: { attendant: { id: string; name: string | null } | null; startedAt: string | null; endedAt: string | null } | null;
  }>;
}

/** GET /analytics/station/:id/dashboard */
export interface Dashboard {
  totals: { revenue: number; transactions: number; liters: number; kwh: number; avgTicket: number };
  deltas: { revenue: number | null; transactions: number | null; liters: number | null; kwh: number | null; avgTicket: number | null };
  payments: Array<{ method: 'CASH' | 'MOMO' | 'CARD'; amount: number }>;
  series: Array<{ bucket: string; revenue: number; transactions: number }>;
  heatmap: Array<{ dow: number; hour: number; revenue: number; transactions: number }>;
  productMix: Array<{ productType: string; unit: string; revenue: number; quantity: number; transactions: number; share: number }>;
}

/** GET /pumps/live */
export interface LivePump {
  id: string;
  pump_number: number;
  product_type: string;
  unit: string;
  kind: 'pump' | 'charger';
  status: 'in_use' | 'idle' | 'charging' | 'available' | 'offline';
  today: { quantity: number; revenue: number; sales: number };
}

/** A row of GET /transactions */
export interface RecentSale {
  id: string;
  timestamp: string;
  quantity: number;
  unit: string;
  product_type: string;
  total_amount: number;
  payment_method: 'CASH' | 'MOMO' | 'CARD';
  sale_status: 'pending' | 'locked' | 'voided';
  users?: { name?: string | null } | null;
  pumps?: { pump_number?: number; product_type?: string } | null;
}

export type Loaded<T> = { data: T | null; error: string | null; loading: boolean; updatedAt: number | null; reload: () => void };

/**
 * Fetches on mount and when the key changes, then every `everyMs` while the
 * tab is visible. A failed refresh keeps the last good data and reports the
 * error alongside it, so a blip does not blank the screen.
 */
export function usePolled<T>(key: string | null, load: () => Promise<T>, everyMs: number): Loaded<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean; updatedAt: number | null }>({
    data: null,
    error: null,
    loading: key !== null,
    updatedAt: null,
  });
  const loadRef = useRef(load);
  // Before the polling effect below, which reads it: effects run in order.
  useEffect(() => {
    loadRef.current = load;
  });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (key === null) return;
    let live = true;
    const run = () => {
      if (document.visibilityState === 'hidden') return;
      loadRef
        .current()
        .then((data) => live && setState({ data, error: null, loading: false, updatedAt: Date.now() }))
        .catch((err: Error) => live && setState((s) => ({ ...s, error: err.message || 'Could not load', loading: false })));
    };
    run();
    const timer = window.setInterval(run, everyMs);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [key, everyMs, nonce]);

  // A new station starts empty rather than showing the last one's figures.
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setState({ data: null, error: null, loading: key !== null, updatedAt: null });
  }

  return { ...state, reload };
}

export const getToday = (stationId: string) =>
  api.get(`/analytics/station/${stationId}/today`).then((r) => r.data as StationToday);

export const getDashboard = (stationId: string, from: string, to: string) =>
  api.get(`/analytics/station/${stationId}/dashboard`, { params: { from, to } }).then((r) => r.data as Dashboard);

export const getLivePumps = (stationId: string) =>
  api.get('/pumps/live', { params: { stationId } }).then((r) => r.data as LivePump[]);

export const getRecentSales = (stationId: string) =>
  api
    .get('/transactions', { params: { station_id: stationId, limit: 6, include_voided: true, sortBy: 'timestamp', sortOrder: 'desc' } })
    .then((r) => ((r.data as { data?: RecentSale[] }).data ?? []) as RecentSale[]);
