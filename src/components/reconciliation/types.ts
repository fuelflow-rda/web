import api from '@/lib/api';

export interface Decision {
  id: string;
  pumpId: string;
  shiftId: string | null;
  decision: 'explained' | 'flagged';
  note: string;
  attendant: { id: string; name: string | null } | null;
  decidedBy: { id: string; name: string | null };
  decidedAt: string;
}

export interface PumpLine {
  pumpId: string;
  pumpNumber: number;
  productType: string;
  unit: 'L' | 'KWH';
  quantity: number;
  expectedRevenue: number;
  expectedBasis: 'metered' | 'sales';
  recordedRevenue: number;
  difference: number;
  outcome: 'review' | 'matched' | 'offline';
  reviewReason: 'variance' | 'readings_missing' | null;
  openingReading: number | null;
  closingReading: number | null;
  meteredQuantity: number | null;
  volumeDifference: number | null;
  readingsComplete: boolean;
  outOfService: boolean;
  resolution: Decision | null;
}

/** GET /reconciliation/:stationId/:date */
export interface Report {
  id: string;
  stationId: string;
  date: string;
  expectedRevenue: number;
  recordedRevenue: number;
  difference: number;
  expectedBasis: 'metered' | 'sales' | 'mixed';
  status: 'BALANCED' | 'DISCREPANCY';
  pumpBreakdown: PumpLine[];
  paymentBreakdown: Array<{ method: string; count: number; amount: number }>;
  attendantBreakdown: Array<{
    attendantId: string;
    attendantName: string;
    transactionCount: number;
    liters: number;
    kwh: number;
    revenue: number;
  }>;
  totalLiters: number;
  totalKwh: number;
  totalTransactions: number;
  shiftCount: number | null;
  volumeDifference: { liters: number; kwh: number };
  tolerance: number;
  unresolvedCount: number;
  decisions: Decision[];
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string | null } | null;
  generatedAt: string | null;
}

/** GET /reconciliation/:stationId/:date/pumps/:pumpId/shifts */
export interface PumpShifts {
  pumpId: string;
  pumpNumber: number;
  label: string;
  unit: 'L' | 'KWH';
  date: string;
  shifts: Array<{
    shiftId: string | null;
    attendant: { id: string; name: string | null } | null;
    startedAt: string | null;
    endedAt: string | null;
    shiftOpen: boolean;
    openingReading: number | null;
    closingReading: number | null;
    meteredQuantity: number | null;
    recordedQuantity: number;
    sales: number;
    recordedRevenue: number;
    volumeDifference: number | null;
    readingsComplete: boolean;
  }>;
}

/** 404 means there is no report for that day yet, which the page offers to generate. */
export async function getReport(stationId: string, date: string): Promise<Report | null> {
  try {
    return (await api.get(`/reconciliation/${stationId}/${date}`)).data as Report;
  } catch (err) {
    if (err instanceof Error && /No reconciliation report/i.test(err.message)) return null;
    throw err;
  }
}

export const generateReport = (stationId: string, date: string) =>
  api.post(`/reconciliation/${stationId}/generate`, {}, { params: { date } }).then((r) => r.data as Report);

export const getPumpShifts = (stationId: string, date: string, pumpId: string) =>
  api.get(`/reconciliation/${stationId}/${date}/pumps/${pumpId}/shifts`).then((r) => r.data as PumpShifts);

export const decide = (
  stationId: string,
  date: string,
  body: { pump_id: string; shift_id?: string; decision: 'explained' | 'flagged'; note: string },
) => api.post(`/reconciliation/${stationId}/${date}/decisions`, body).then((r) => r.data as Decision);

export const markReviewed = (stationId: string, date: string) =>
  api.post(`/reconciliation/${stationId}/${date}/review`).then((r) => r.data as Report);

/** The latest report's day for a station, or null when it has none. */
export async function latestReportDate(stationId: string): Promise<string | null> {
  const rows = (await api.get(`/reconciliation/${stationId}`)).data as Array<{ date: string }>;
  return rows[0]?.date ?? null;
}
