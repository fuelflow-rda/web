import type { ConnectorType, ProductType, ProductUnit } from '@/types';
import { isLegacyGasolineFuelType } from '@/lib/legacy-gasoline-fuel-type';

export const PRODUCT_TYPES: ProductType[] = [
  'GASOLINE',
  'DIESEL',
  'EV_AC',
  'EV_DC_FAST',
  'EV_DC_ULTRA',
];

export const FUEL_PRODUCT_TYPES: ProductType[] = ['GASOLINE', 'DIESEL'];
export const EV_PRODUCT_TYPES: ProductType[] = ['EV_AC', 'EV_DC_FAST', 'EV_DC_ULTRA'];

export const CONNECTOR_TYPES: ConnectorType[] = ['TYPE2', 'CCS', 'CHADEMO', 'GBT', 'TESLA'];

const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  TYPE2: 'Type 2 (AC)',
  CCS: 'CCS Combo',
  CHADEMO: 'CHAdeMO',
  GBT: 'GB/T',
  TESLA: 'Tesla',
};

const PRODUCT_LABELS: Record<ProductType, string> = {
  GASOLINE: 'Gasoline',
  DIESEL: 'Diesel',
  EV_AC: 'EV · AC (Normal)',
  EV_DC_FAST: 'EV · DC Fast',
  EV_DC_ULTRA: 'EV · DC Ultra-Fast',
};

/** Compact label for table tags and chart axes, where the full name does not fit. */
const PRODUCT_SHORT_LABELS: Record<ProductType, string> = {
  GASOLINE: 'Gasoline',
  DIESEL: 'Diesel',
  EV_AC: 'AC',
  EV_DC_FAST: 'DC Fast',
  EV_DC_ULTRA: 'DC Ultra',
};

/**
 * Product marks, resolved from tokens so they follow the active theme.
 *
 * Deliberately separate from the accent: the accent means "interactive", so reusing
 * it to encode a product would make green mean both "electric" and "clickable".
 * Fuels are opposed hues; the three EV tiers form a sequential ramp.
 *
 * Colour is never the only encoding — deuteranopes cannot reliably separate the
 * ochre from the sage greens, so every series carries a direct label as well.
 */
const PRODUCT_COLORS: Record<ProductType, string> = {
  GASOLINE: 'var(--product-gasoline)',
  DIESEL: 'var(--product-diesel)',
  EV_AC: 'var(--product-ev-ac)',
  EV_DC_FAST: 'var(--product-ev-dc-fast)',
  EV_DC_ULTRA: 'var(--product-ev-dc-ultra)',
};

/** Quiet backing for a product chip, in the same theme-aware form. */
const PRODUCT_TINTS: Record<ProductType, string> = {
  GASOLINE: 'var(--product-gasoline-tint)',
  DIESEL: 'var(--product-diesel-tint)',
  EV_AC: 'var(--product-ev-ac-tint)',
  EV_DC_FAST: 'var(--product-ev-dc-fast-tint)',
  EV_DC_ULTRA: 'var(--product-ev-dc-ultra-tint)',
};

/** Ant Design tag colors, which take names rather than hex values. */
const PRODUCT_TAG_COLORS: Record<ProductType, string> = {
  GASOLINE: 'orange',
  DIESEL: 'default',
  EV_AC: 'green',
  EV_DC_FAST: 'success',
  EV_DC_ULTRA: 'cyan',
};

export function isEvProductType(type: string | undefined | null): boolean {
  return String(type ?? '').toUpperCase().startsWith('EV_');
}

export function isGasolineFuelType(type: string | undefined | null): boolean {
  const u = String(type ?? '').toUpperCase();
  return u === 'GASOLINE' || isLegacyGasolineFuelType(u);
}

/** Map anything the API or a cached payload can carry onto a current product code. */
export function normalizeProductType(type: string | null | undefined): ProductType {
  const u = String(type ?? '').toUpperCase();
  if (isLegacyGasolineFuelType(u)) return 'GASOLINE';
  return (PRODUCT_TYPES as string[]).includes(u) ? (u as ProductType) : 'GASOLINE';
}

export function productLabel(type: string | undefined | null): string {
  return PRODUCT_LABELS[normalizeProductType(type)];
}

export function productShortLabel(type: string | undefined | null): string {
  return PRODUCT_SHORT_LABELS[normalizeProductType(type)];
}

export function productColor(type: string | undefined | null): string {
  return PRODUCT_COLORS[normalizeProductType(type)];
}

/**
 * Backing colour for a product chip. Use this instead of appending hex alpha to
 * `productColor` — the tokens are CSS variables, so concatenation produces garbage.
 */
export function productTint(type: string | undefined | null): string {
  return PRODUCT_TINTS[normalizeProductType(type)];
}

export function productTagColor(type: string | undefined | null): string {
  return PRODUCT_TAG_COLORS[normalizeProductType(type)];
}

export function connectorLabel(connector: string | undefined | null): string {
  const u = String(connector ?? '').toUpperCase() as ConnectorType;
  return CONNECTOR_LABELS[u] ?? (connector ? String(connector) : '');
}

export function unitForProduct(type: string | undefined | null): ProductUnit {
  return isEvProductType(type) ? 'KWH' : 'L';
}

export function unitLabel(unit: ProductUnit | string | undefined | null): string {
  return String(unit ?? 'L').toUpperCase() === 'KWH' ? 'kWh' : 'L';
}

export function unitLabelForProduct(type: string | undefined | null): string {
  return unitLabel(unitForProduct(type));
}

/** "32.4 kWh" / "25.5 L" — the number is meaningless without its unit. */
export function formatQuantity(
  quantity: number | undefined | null,
  unit: ProductUnit | string | undefined | null,
  fractionDigits = 2,
): string {
  const value = Number(quantity ?? 0);
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })} ${unitLabel(unit)}`;
}

/** "RWF 420/kWh" — price is per liter for fuel, per kWh for EV. */
export function formatUnitPrice(price: number | undefined | null, unit: ProductUnit | string): string {
  return `RWF ${Number(price ?? 0).toLocaleString()}/${unitLabel(unit)}`;
}
