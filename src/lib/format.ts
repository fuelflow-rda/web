import { isGasolineFuelType } from '@/lib/fuel-type-labels';

export function formatRWF(amount: number): string {
  return `RWF ${amount.toLocaleString('en-US')}`;
}

export function formatLiters(liters: number): string {
  return `${liters.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function fuelTypeColor(type: string): string {
  return isGasolineFuelType(type) ? 'var(--product-gasoline)' : 'var(--product-diesel)';
}

export function fuelTypeBg(type: string): string {
  return isGasolineFuelType(type) ? 'var(--warn-tint)' : 'var(--surface-muted)';
}
