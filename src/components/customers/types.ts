import api from '@/lib/api';

export interface Discount {
  product_type: string;
  amount_per_unit: number;
}

export type CustomerState = 'active' | 'low_balance' | 'empty' | 'suspended';

/** GET /customers: one row. */
export interface CustomerRow {
  id: string;
  kind: 'company' | 'person';
  name: string;
  contact_name: string | null;
  phone: string | null;
  balance: number;
  low_balance_alert: number | null;
  status: 'active' | 'suspended';
  state: CustomerState;
  cards: number;
  active_cards: number;
  discounts: Discount[];
  month_sales: number;
  month_discount: number;
  month_quantity: number;
  last_used_at: string | null;
}

export interface CustomerTotals {
  balances: number;
  active_cards: number;
  customers: number;
  month_sales: number;
  month_discount: number;
  month_quantity: number;
}

export interface Card {
  id: string;
  code: string;
  number: number;
  label: string;
  holder_name: string | null;
  vehicle_plate: string | null;
  daily_limit: number | null;
  monthly_limit: number | null;
  used_today: number;
  used_month: number;
  last_used_at: string | null;
  status: 'active' | 'deactivated';
  deactivated_at: string | null;
  deactivated_reason: string | null;
  created_at: string;
}

/** GET /customers/:id */
export interface Customer {
  id: string;
  company_id: string;
  kind: 'company' | 'person';
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  tin: string | null;
  balance: number;
  low_balance_alert: number | null;
  status: 'active' | 'suspended';
  created_at: string;
  discounts: Discount[];
  cards: Card[];
  month: { sales: number; discount: number; quantity: number; stations: number };
}

export interface StatementEntry {
  id: string;
  kind: 'topup' | 'sale' | 'refund' | 'adjustment';
  at: string;
  amount: number;
  balance_after: number;
  method: 'bank' | 'momo' | 'cash' | null;
  reference: string | null;
  note: string | null;
  received_on: string | null;
  sale: {
    id: string;
    station: string | null;
    pump_number: number | null;
    product_type: string;
    unit: string;
    quantity: number;
    discount_amount: number;
    total_amount: number;
    vehicle_plate: string | null;
    attendant: string | null;
    card: string | null;
    at: string;
  } | null;
}

export interface Statement {
  customer: { id: string; name: string };
  from: string;
  to: string;
  opening_balance: number;
  closing_balance: number;
  entries: StatementEntry[];
}

export interface CustomerInput {
  kind?: 'company' | 'person';
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  tin?: string | null;
  low_balance_alert?: number | null;
  discounts?: Discount[];
  status?: 'active' | 'suspended';
}

export interface CardInput {
  holder_name?: string | null;
  vehicle_plate?: string | null;
  daily_limit?: number | null;
  monthly_limit?: number | null;
  status?: 'active' | 'deactivated';
  reason?: string;
}

export const listCustomers = (params: { search?: string; status?: string } = {}) =>
  api.get('/customers', { params }).then((r) => r.data as { data: CustomerRow[]; totals: CustomerTotals });

export const getCustomer = (id: string) => api.get(`/customers/${id}`).then((r) => r.data as Customer);

export const createCustomer = (body: CustomerInput) => api.post('/customers', body).then((r) => r.data as Customer);

export const updateCustomer = (id: string, body: Partial<CustomerInput>) =>
  api.patch(`/customers/${id}`, body).then((r) => r.data as Customer);

export const recordTopUp = (
  id: string,
  body: { amount: number; method: 'bank' | 'momo' | 'cash'; reference?: string | null; received_on: string; note?: string | null },
) => api.post(`/customers/${id}/topups`, body).then((r) => r.data as { balance_after: number });

export const recordAdjustment = (id: string, body: { amount: number; note: string }) =>
  api.post(`/customers/${id}/adjustments`, body).then((r) => r.data as { balance_after: number });

export const getStatement = (id: string, params: { from?: string; to?: string } = {}) =>
  api.get(`/customers/${id}/statement`, { params }).then((r) => r.data as Statement);

export const createCard = (customerId: string, body: CardInput) =>
  api.post(`/customers/${customerId}/cards`, body).then((r) => r.data as Card);

export const updateCard = (customerId: string, cardId: string, body: CardInput) =>
  api.patch(`/customers/${customerId}/cards/${cardId}`, body).then((r) => r.data as Card);

/** "20 RWF/L · gas, diesel": a customer's discount in a few words. */
export function discountWords(discounts: Discount[]): string {
  if (!discounts.length) return 'No discount';
  const short: Record<string, string> = { GASOLINE: 'gas', DIESEL: 'diesel', EV_AC: 'EV AC', EV_DC_FAST: 'EV DC', EV_DC_ULTRA: 'EV ultra' };
  const amounts = [...new Set(discounts.map((d) => d.amount_per_unit))];
  const unit = discounts.every((d) => d.product_type.startsWith('EV')) ? 'RWF/kWh' : 'RWF/L';
  if (amounts.length === 1) return `${amounts[0]} ${unit} · ${discounts.map((d) => short[d.product_type] ?? d.product_type).join(', ')}`;
  return discounts.map((d) => `${short[d.product_type] ?? d.product_type} ${d.amount_per_unit}`).join(' · ');
}
