import api from '@/lib/api';

export interface Maintenance {
  id: string;
  pumpId: string;
  pumpNumber: number | null;
  startedAt: string;
  startedBy: string | null;
  reason: string;
  endedAt: string | null;
  endedBy: string | null;
  resolution: string | null;
}

/** GET /pumps/live, one row */
export interface Point {
  id: string;
  pump_number: number;
  product_type: string;
  unit: 'L' | 'KWH';
  kind: 'pump' | 'charger';
  connector_type: string | null;
  power_kw: number | null;
  status: 'in_use' | 'idle' | 'charging' | 'available' | 'offline';
  in_open_shift: boolean;
  last_sale_at: string | null;
  today: { quantity: number; revenue: number; sales: number };
  last_reading: number | null;
  price_per_unit: number | null;
  maintenance: Maintenance | null;
}

export interface PumpSeries {
  pumpId: string;
  days: Array<{ day: string; sales: number; revenue: number; quantity: number }>;
  totals: { sales: number; revenue: number; quantity: number };
}

export const getPoints = (stationId: string) =>
  api.get('/pumps/live', { params: { stationId } }).then((r) => r.data as Point[]);
export const getLog = (stationId: string) =>
  api.get('/pumps/maintenance', { params: { stationId, limit: 100 } }).then((r) => r.data as Maintenance[]);
export const startMaintenance = (pumpId: string, reason: string) =>
  api.post(`/pumps/${pumpId}/maintenance`, { reason }).then((r) => r.data as Maintenance);
export const endMaintenance = (pumpId: string, resolution?: string) =>
  api.post(`/pumps/${pumpId}/maintenance/end`, resolution ? { resolution } : {}).then((r) => r.data as Maintenance);
export const getSeries = (pumpId: string, from: string, to: string) =>
  api.get(`/analytics/pump/${pumpId}/series`, { params: { from, to } }).then((r) => r.data as PumpSeries);
export const nextNumber = (stationId: string) =>
  api.get('/pumps/next-number', { params: { stationId } }).then((r) => (r.data as { nextNumber: number }).nextNumber);
export const addPoint = (body: {
  station_id: string;
  pump_number: number;
  product_type: string;
  connector_type?: string;
  power_kw?: number;
}) => api.post('/pumps', body);
