import api from '@/lib/api';

type Ref = { id: string; name: string | null };

/** GET /admin/platform-health */
export interface PlatformHealth {
  generatedAt: string;
  kpis: {
    companies: number;
    live: number;
    onboarding: number;
    stations: number;
    stationsReporting: number;
    shiftsOpen: number;
    attendantsActiveLastHour: number;
    revenueToday: number;
  };
  companies: Array<{
    id: string;
    name: string;
    createdAt: string;
    admins: number;
    stations: number;
    stationsReporting: number;
    revenueToday: number;
    salesToday: number;
    lastSyncAt: string | null;
    status: 'live' | 'devices_offline' | 'onboarding';
  }>;
  sync: { queuedSales: number; devicesWithQueue: number; devicesNotSynced: number; oldestQueuedAt: string | null };
  reconciliation: {
    date: string;
    stationsWithSales: number;
    reports: number;
    discrepancies: number;
    lastGeneratedAt: string | null;
  };
  signIns: { failedLast24h: number; lockedAccounts: number };
  api: {
    since: string;
    requests: number;
    errors: number;
    errorRate: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
  };
  needsAttention: Array<
    | { kind: 'devices_not_synced'; company: Ref; station: Ref | null; devices: number; sales: number; since: string }
    | { kind: 'reconciliation_missing'; company: Ref | null; station: Ref; date: string; since: string }
    | { kind: 'no_admin'; company: Ref; since: string }
    | {
        kind: 'invite_expired';
        company: Ref | null;
        user: { id: string; name: string | null; email: string | null };
        since: string;
      }
  >;
}

export interface Device {
  deviceId: string;
  attendant: Ref;
  station: Ref | null;
  company: Ref | null;
  platform: string | null;
  appVersion: string | null;
  queuedSales: number;
  oldestQueuedAt: string | null;
  lastSyncAt: string | null;
  reportedAt: string;
  state: 'synced' | 'pending' | 'not_synced';
}

/** GET /companies/:id/overview */
export interface CompanyOverview {
  company: {
    id: string;
    name: string;
    country: string;
    createdAt: string;
    legalName: string | null;
    taxId: string | null;
    billingEmail: string | null;
    dataRegion: string | null;
  };
  products: string[];
  administrators: number;
  kpis: {
    revenueToday: number;
    onShiftNow: number;
    attendants: number;
    openDiscrepancies: number;
    oldestOpenDiscrepancy: string | null;
  };
  stations: Array<{
    id: string;
    name: string;
    location: string | null;
    managers: Ref[];
    pumps: number;
    chargers: number;
    revenueToday: number;
    salesToday: number;
    toReview: number;
    status: 'live' | 'review' | 'no_sales_today';
  }>;
}

/** A row of GET /users */
export interface UserRow {
  id: string;
  name: string | null;
  role: 'superadmin' | 'company_admin' | 'station_manager' | 'attendant';
  phone: string | null;
  email: string | null;
  station_id: string | null;
  company_id: string | null;
  is_active: boolean | null;
  created_at: string;
  pin_locked_at: string | null;
  invited_at: string | null;
  invite_accepted_at: string | null;
  last_seen_at: string | null;
  invited_by_name: string | null;
  account_status: 'deactivated' | 'pin_locked' | 'invited' | 'not_synced' | 'on_shift' | 'active';
  companies?: { id: string; name: string } | null;
  stations?: { id: string; name: string } | null;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  actor: { id: string | null; name: string | null; role: string | null };
  companyId: string | null;
  stationId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: Record<string, unknown> | null;
}

export type Paged<T> = { data: T[]; pagination: { page: number; limit: number; total: number; total_pages: number } };

export const getPlatformHealth = () => api.get('/admin/platform-health').then((r) => r.data as PlatformHealth);
export const getDevices = () => api.get('/admin/platform-health/devices').then((r) => r.data as Device[]);
export const getPlatformSeries = (days: number) =>
  api
    .get('/admin/platform-stats', { params: { days } })
    .then((r) => r.data as { series?: Array<{ bucket: string; revenue: number }> });
export const getCompanyOverview = (id: string) =>
  api.get(`/companies/${id}/overview`).then((r) => r.data as CompanyOverview);
export const getUsers = (params: Record<string, unknown>) =>
  api.get('/users', { params }).then((r) => r.data as Paged<UserRow>);
export const getAudit = (params: Record<string, unknown>) =>
  api.get('/audit-events', { params }).then((r) => r.data as Paged<AuditEvent>);
export const updateCompany = (id: string, body: Record<string, unknown>) => api.patch(`/companies/${id}`, body);
export const createCompany = (name: string) =>
  api.post('/companies', { name, country: 'RW' }).then((r) => r.data as { id: string });
export const deleteCompany = (id: string) => api.delete(`/companies/${id}`);
export const inviteCompanyAdmin = (company_id: string, name: string, email: string, platform: boolean) =>
  platform
    ? api.post('/users/company-admins', { company_id, name, email })
    : api.post('/users', { company_id, name, email, role: 'company_admin' });
export const resendInvite = (id: string) =>
  api.post(`/users/${id}/invite`).then((r) => r.data as { sent: boolean; reason?: string });
