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
  return type.toUpperCase() === 'PETROL' ? '#F97316' : '#3B82F6';
}

export function fuelTypeBg(type: string): string {
  return type.toUpperCase() === 'PETROL' ? '#FFF7ED' : '#EFF6FF';
}
