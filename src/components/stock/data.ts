import api from '@/lib/api';
import type { Paged } from '@/components/admin/data';
import { fromKigaliWall } from '@/components/prices/data';
import { formatMeter, productColor, unitLabel } from '@/lib/product-types';

/** What a station keeps stock of: fuel in its tanks, and electricity bought for its chargers. */
export type StockProduct = 'GASOLINE' | 'DIESEL' | 'ELECTRICITY';
export type StockUnit = 'L' | 'KWH';
export type StockKind = 'delivery' | 'count';

export const STOCK_PRODUCTS: StockProduct[] = ['GASOLINE', 'DIESEL', 'ELECTRICITY'];

/** GET /stock/:stationId, one product. Without a count, the level and its parts are null: unknown, not zero. */
export interface StockLevel {
  product: StockProduct;
  unit: StockUnit;
  /** Last count + deliveries since − recorded sales since. Below zero when sales outran recorded deliveries. */
  level: number | null;
  counted_at: string | null;
  counted_quantity: number | null;
  delivered_since_count: number | null;
  sold_since_count: number | null;
  last_delivery: { id: string; occurred_at: string; quantity: number; supplier: string | null } | null;
}

export interface StockLevels {
  station_id: string;
  products: StockLevel[];
}

/** GET /stock/:stationId/entries, one row: a delivery or a count. */
export interface StockEntry {
  id: string;
  station_id: string;
  product: StockProduct;
  kind: StockKind;
  quantity: number;
  unit: StockUnit;
  occurred_at: string;
  supplier: string | null;
  reference: string | null;
  cost_rwf: number | null;
  note: string | null;
  recorded_by: { id: string; name: string } | null;
  created_at: string;
}

export interface DeliveryInput {
  station_id: string;
  product: StockProduct;
  quantity: number;
  occurred_at: string;
  supplier?: string;
  reference?: string;
  cost_rwf?: number;
  note?: string;
}

export interface CountInput {
  station_id: string;
  product: StockProduct;
  quantity: number;
  occurred_at: string;
  note?: string;
}

export const getLevels = (stationId: string) =>
  api.get(`/stock/${stationId}`).then((r) => r.data as StockLevels);

export const getEntries = (
  stationId: string,
  filter: { product?: StockProduct; kind?: StockKind; page: number; limit: number },
) => {
  const params: Record<string, unknown> = { page: filter.page, limit: filter.limit };
  if (filter.product) params.product = filter.product;
  if (filter.kind) params.kind = filter.kind;
  return api.get(`/stock/${stationId}/entries`, { params }).then((r) => r.data as Paged<StockEntry>);
};

export const recordDelivery = (body: DeliveryInput) =>
  api.post('/stock/deliveries', body).then((r) => r.data as StockEntry);

export const recordCount = (body: CountInput) => api.post('/stock/counts', body).then((r) => r.data as StockEntry);

export const removeEntry = (id: string, reason: string) =>
  api.post(`/stock/entries/${id}/remove`, { reason }).then((r) => r.data as { id: string; removed_at: string });

/* ------------------------------------------------------------- Wording */

const PRODUCT: Record<StockProduct, { name: string; unit: StockUnit; color: string; hint: string | null }> = {
  GASOLINE: { name: 'Gasoline', unit: 'L', color: productColor('GASOLINE'), hint: null },
  DIESEL: { name: 'Diesel', unit: 'L', color: productColor('DIESEL'), hint: null },
  // The EV ramp's middle step stands for charging as a whole.
  ELECTRICITY: { name: 'Electricity', unit: 'KWH', color: productColor('EV_DC_FAST'), hint: 'for EV charging' },
};

const known = (p: string): StockProduct => ((STOCK_PRODUCTS as string[]).includes(p) ? (p as StockProduct) : 'GASOLINE');
export const stockName = (p: string) => PRODUCT[known(p)].name;
export const stockUnit = (p: string): StockUnit => PRODUCT[known(p)].unit;
export const stockColor = (p: string) => PRODUCT[known(p)].color;
export const stockHint = (p: string) => PRODUCT[known(p)].hint;
/** The card's line under the name: "In litres", "In kWh, for EV charging". */
export const stockSubline = (p: string) => {
  const { unit, hint } = PRODUCT[known(p)];
  return unit === 'KWH' ? `In kWh${hint ? `, ${hint}` : ''}` : 'In litres';
};
/** "litre" or "kWh", as in "per litre". */
export const perUnit = (unit: string) => (unitLabel(unit) === 'kWh' ? 'kWh' : 'litre');

/** "+3,000.0 L", "−5,654.4 L": a change, signed, one decimal as meters read. */
export function signedQty(n: number, unit: string): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${formatMeter(Math.abs(n), unit)}`;
}

/** A level, which may be below zero: "−120.0 L". */
export const levelQty = (n: number, unit: string) => (n < 0 ? signedQty(n, unit) : formatMeter(n, unit));

/* ---------------------------------------------------------------- Cost */

/** RWF per litre or kWh; null when either side is missing or the quantity is not above zero. */
export function costPerUnit(cost: number | null | undefined, quantity: number | null | undefined): number | null {
  if (cost === null || cost === undefined || !Number.isFinite(cost)) return null;
  if (quantity === null || quantity === undefined || !Number.isFinite(quantity) || quantity <= 0) return null;
  return cost / quantity;
}

/** "RWF 1,200 per litre", "RWF 245.5 per kWh": up to two decimals, as a litre rarely costs a whole number. */
export function formatCostPerUnit(cost: number | null | undefined, quantity: number | null | undefined, unit: string): string | null {
  const per = costPerUnit(cost, quantity);
  if (per === null) return null;
  return `RWF ${per.toLocaleString('en-US', { maximumFractionDigits: 2 })} per ${perUnit(unit)}`;
}

/* ---------------------------------------------------------- Validation */

export const MAX_DELIVERY = 1_000_000;
/** The API's caps (src/stock/dto/stock.dto.ts): counts share the delivery ceiling. */
export const MAX_COUNT = MAX_DELIVERY;
export const SUPPLIER_MAX = 120;
export const REFERENCE_MAX = 120;
export const NOTE_MAX = 500;
export const REASON_MIN = 5;
export const REASON_MAX = 300;

/** A quantity as typed: "8,000" or "8000.5". Empty is null; anything else that is not a number is NaN. */
export function parseQuantity(raw: string): number | null {
  const s = raw.replace(/[,\s]/g, '');
  if (!s) return null;
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Whole RWF as typed: "9,600,000". Decimals are refused, not dropped, so 1,200.50 never becomes 120,050. */
export function parseCost(raw: string): number | null {
  const s = raw.replace(/[,\s]/g, '');
  if (!s) return null;
  return /^\d+$/.test(s) ? Number(s) : NaN;
}

export interface DeliveryDraft {
  product: StockProduct;
  quantity: string;
  /** Kigali wall time, YYYY-MM-DDTHH:mm, as a datetime field holds it. */
  wall: string;
  supplier: string;
  reference: string;
  cost: string;
  note: string;
}

export interface CountDraft {
  product: StockProduct;
  quantity: string;
  wall: string;
  note: string;
}

export type Problems = Partial<Record<'quantity' | 'wall' | 'cost', string>>;

/** A minute's grace, so a time set to "now" is not refused by the clock moving on. */
const GRACE_MS = 60_000;

function checkWall(wall: string, now: number, verb: string): string | undefined {
  const at = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wall) ? Date.parse(fromKigaliWall(wall)) : NaN;
  if (Number.isNaN(at)) return `Enter the date and time it was ${verb}.`;
  if (at > now + GRACE_MS) return `That time has not come yet. Enter when it was ${verb}.`;
  return undefined;
}

/** The delivery form's checks, as the API makes them; a body to send when there are none. */
export function checkDelivery(
  stationId: string,
  d: DeliveryDraft,
  now = Date.now(),
): { problems: Problems; body: DeliveryInput | null } {
  const unit = unitLabel(stockUnit(d.product));
  const ev = stockUnit(d.product) === 'KWH';
  const problems: Problems = {};
  const quantity = parseQuantity(d.quantity);
  if (quantity === null) problems.quantity = ev ? 'Enter how many kWh were bought.' : 'Enter how many litres arrived.';
  else if (Number.isNaN(quantity)) problems.quantity = 'Enter a number, such as 8000 or 8000.5.';
  else if (quantity <= 0) problems.quantity = 'Enter a quantity above 0.';
  else if (quantity > MAX_DELIVERY) problems.quantity = `One delivery can be at most 1,000,000 ${unit}. Check the figure.`;
  const wall = checkWall(d.wall, now, ev ? 'bought' : 'received');
  if (wall) problems.wall = wall;
  const cost = parseCost(d.cost);
  if (cost !== null && Number.isNaN(cost)) problems.cost = 'Enter the total in whole RWF, such as 9,600,000.';

  if (Object.keys(problems).length) return { problems, body: null };
  const body: DeliveryInput = {
    station_id: stationId,
    product: d.product,
    quantity: quantity as number,
    occurred_at: fromKigaliWall(d.wall),
  };
  if (d.supplier.trim()) body.supplier = d.supplier.trim();
  if (d.reference.trim()) body.reference = d.reference.trim();
  if (cost !== null) body.cost_rwf = cost;
  if (d.note.trim()) body.note = d.note.trim();
  return { problems, body };
}

/** The count form's checks: zero is a real count (an empty tank), a blank is not. */
export function checkCount(stationId: string, d: CountDraft, now = Date.now()): { problems: Problems; body: CountInput | null } {
  const problems: Problems = {};
  const quantity = parseQuantity(d.quantity);
  if (quantity === null) problems.quantity = 'Enter the quantity you measured. Enter 0 if it is empty.';
  else if (Number.isNaN(quantity)) problems.quantity = 'Enter a number, such as 15000 or 15000.5.';
  else if (quantity > MAX_COUNT) problems.quantity = `A count can be at most 1,000,000 ${d.product === 'ELECTRICITY' ? 'kWh' : 'L'}. Check the figure.`;
  const wall = checkWall(d.wall, now, 'measured');
  if (wall) problems.wall = wall;

  if (Object.keys(problems).length) return { problems, body: null };
  const body: CountInput = {
    station_id: stationId,
    product: d.product,
    quantity: quantity as number,
    occurred_at: fromKigaliWall(d.wall),
  };
  if (d.note.trim()) body.note = d.note.trim();
  return { problems, body };
}

/** A removal's reason, as the API takes it: 5 to 300 characters. */
export function checkReason(reason: string): string | undefined {
  const r = reason.trim();
  if (r.length < REASON_MIN) return 'Give a reason of at least 5 characters, so the next person knows why.';
  if (r.length > REASON_MAX) return 'Keep the reason to 300 characters.';
  return undefined;
}
