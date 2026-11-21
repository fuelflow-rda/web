import api from '@/lib/api';

export interface PriceRow {
  id: string;
  product_type: string;
  unit: string;
  price_per_unit: number;
  effective_at: string;
  set_at?: string;
  users?: { id: string; name: string | null } | null;
}

export interface HistoryRow extends PriceRow {
  previous_price: number | null;
  change: number | null;
}

export const getCurrent = (stationId: string) =>
  api
    .get(`/fuel-prices/${stationId}/current`)
    .then((r) => r.data as { prices: Record<string, PriceRow | null>; scheduled: PriceRow[] });

export const getHistory = (stationId: string, from: string) =>
  api
    .get(`/fuel-prices/${stationId}/history`, { params: { from, limit: 100 } })
    .then((r) => (r.data as { data: HistoryRow[] }).data);

export const setPrice = (body: {
  station_id: string;
  product_type: string;
  price_per_unit: number;
  effective_at?: string;
}) => api.post('/fuel-prices', body);
export const updateScheduled = (id: string, body: { price_per_unit?: number; effective_at?: string }) =>
  api.patch(`/fuel-prices/scheduled/${id}`, body);
export const cancelScheduled = (id: string) => api.delete(`/fuel-prices/scheduled/${id}`);

/** Kigali wall time for a picker, and back: a price change happens at the station's 06:00, wherever the browser is. */
export const KIGALI = '+02:00';
export const toKigaliWall = (iso: string) => new Date(Date.parse(iso) + 2 * 3600_000).toISOString().slice(0, 16);
export const fromKigaliWall = (wall: string) => new Date(`${wall}:00${KIGALI}`).toISOString();

/** The next 06:00 in Kigali, as wall time: the usual moment for a change. */
export function nextSixAm(now = Date.now()): string {
  const wall = new Date(now + 2 * 3600_000);
  const six = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate(), 6));
  if (six.getTime() <= wall.getTime()) six.setUTCDate(six.getUTCDate() + 1);
  return six.toISOString().slice(0, 16);
}
