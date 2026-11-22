import api from '@/lib/api';

export type BatchState = 'active' | 'ends_soon' | 'expired' | 'used_up';

interface BatchSummary {
  used: number;
  unused: number;
  voided: number;
  state: BatchState;
  value: number | null;
  used_value: number;
  value_left: number;
  expired_value: number;
}

/** GET /voucher-batches: one row. */
export interface BatchRow extends BatchSummary {
  id: string;
  name: string;
  kind: 'prepaid' | 'promo';
  customer: { id: string; name: string | null } | null;
  face_value: number | null;
  discount_per_unit: number | null;
  discount_fixed: number | null;
  count: number;
  expires_on: string;
  created_at: string;
}

export interface BatchTotals {
  prepaid_outstanding: number;
  prepaid_outstanding_count: number;
  used_month: number;
  used_month_prepaid_value: number;
  promo_discount_month: number;
  expiring_30: number;
  expiring_30_value: number;
}

export interface Voucher {
  id: string;
  code: string;
  status: 'unused' | 'used' | 'voided';
  used_at: string | null;
  amount_applied: number | null;
  station: string | null;
  sale: { id: string; total_amount: number | null; at: string | null; pump_number: number | null; attendant: string | null } | null;
  voided_at: string | null;
  void_reason: string | null;
  voided_by: string | null;
}

/** GET /voucher-batches/:id */
export interface Batch extends BatchRow {
  company_id: string;
  payment_reference: string | null;
  vouchers: Voucher[];
}

export interface BatchInput {
  kind: 'prepaid' | 'promo';
  customer_id?: string | null;
  name: string;
  count: number;
  face_value?: number;
  discount_per_unit?: number;
  discount_fixed?: number;
  expires_on: string;
  payment_reference?: string | null;
}

export const listBatches = (params: { kind?: string; search?: string } = {}) =>
  api.get('/voucher-batches', { params }).then((r) => r.data as { data: BatchRow[]; totals: BatchTotals });

export const getBatch = (id: string) => api.get(`/voucher-batches/${id}`).then((r) => r.data as Batch);

export const createBatch = (body: BatchInput) => api.post('/voucher-batches', body).then((r) => r.data as Batch);

export const extendBatch = (id: string, expires_on: string) =>
  api.patch(`/voucher-batches/${id}`, { expires_on }).then((r) => r.data as Batch);

export const voidUnused = (id: string, reason: string) =>
  api.post(`/voucher-batches/${id}/void-unused`, { reason }).then((r) => r.data as Batch);

export const voidVoucher = (id: string, reason: string) => api.post(`/vouchers/${id}/void`, { reason }).then((r) => r.data);

/** "RWF 20,000 each", "−50 RWF/L", "−RWF 2,000": what one voucher of a batch is worth. */
export function batchValue(b: Pick<BatchRow, 'kind' | 'face_value' | 'discount_per_unit' | 'discount_fixed'>, short = false): string {
  const rwf = (n: number) => n.toLocaleString('en-US');
  if (b.kind === 'prepaid') return short ? rwf(Number(b.face_value)) : `RWF ${rwf(Number(b.face_value))} each`;
  if (b.discount_per_unit) return `−${b.discount_per_unit} /L`;
  return short ? `−${rwf(Number(b.discount_fixed))}` : `−RWF ${rwf(Number(b.discount_fixed))}`;
}
