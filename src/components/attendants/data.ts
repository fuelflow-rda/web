import api from '@/lib/api';

/** GET /users/attendants/:stationId/roster, one row */
export interface RosterRow {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  pinLockedAt: string | null;
  pinFailedAttempts: number;
  lastSeenAt: string | null;
  status: 'on_shift' | 'off_shift' | 'pin_locked' | 'deactivated';
  openShift: { id: string; startedAt: string; points: Array<{ number: number; productType: string }> } | null;
  lastShift: { startedAt: string; endedAt: string | null } | null;
  salesToday: number;
  revenueToday: number;
  varianceWeek: { liters: number; kwh: number; shifts: number };
}

export interface Summary {
  sales: number;
  revenue: number;
  liters: number;
  kwh: number;
  pending: number;
  voided: number;
}

export const getRoster = (stationId: string) =>
  api.get(`/users/attendants/${stationId}/roster`).then((r) => r.data as RosterRow[]);

export const getAttendantSummary = (stationId: string, attendantId: string, from: string) =>
  api
    .get('/transactions/summary', { params: { station_id: stationId, attendant_id: attendantId, from } })
    .then((r) => r.data as Summary);

export const addAttendant = (body: {
  name: string;
  phone: string;
  pin: string;
  company_id: string;
  station_id: string;
}) => api.post('/users', { ...body, role: 'attendant' });

export const updateAttendant = (
  id: string,
  body: { name?: string; phone?: string; pin?: string; is_active?: boolean },
) => api.patch(`/users/${id}`, body);

export const unlockPin = (id: string, pin?: string) => api.post(`/users/${id}/unlock-pin`, pin ? { pin } : {});
