import type { FuelType, PumpFuelType } from '@/types';
import { isLegacyGasolineFuelType } from '@/lib/legacy-gasoline-fuel-type';

/** True for stored/API gasoline including pre-rename enum. */
export function isGasolineFuelType(type: string | undefined | null): boolean {
  const u = String(type ?? '').toUpperCase();
  return u === 'GASOLINE' || isLegacyGasolineFuelType(u);
}

/** User-facing labels (only gasoline and diesel products). */
export function fuelTypeLabel(type: string | undefined | null): string {
  const u = String(type ?? '').toUpperCase();
  if (u === 'GASOLINE' || isLegacyGasolineFuelType(u)) return 'Gasoline';
  if (u === 'DIESEL') return 'Diesel';
  return type ? String(type) : '';
}

/** Map API / legacy DB values to current transaction fuel enum. */
export function normalizeTransactionFuelType(t: string | null | undefined): FuelType {
  const u = String(t ?? '').toUpperCase();
  if (u === 'DIESEL') return 'DIESEL';
  return 'GASOLINE';
}

/** Map API / legacy DB values to pump fuel (only gasoline or diesel). */
export function normalizePumpFuelType(t: string | null | undefined): PumpFuelType {
  return normalizeTransactionFuelType(t);
}
