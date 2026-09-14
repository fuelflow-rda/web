/**
 * Back-compat shim. These names predate EV support, when a station only sold fuel.
 * They now delegate to the product-aware helpers so existing call sites stop
 * collapsing EV charge tiers into "Gasoline".
 *
 * New code should import from `@/lib/product-types` directly.
 */
export {
  isGasolineFuelType,
  isEvProductType,
  productLabel as fuelTypeLabel,
  normalizeProductType as normalizeTransactionFuelType,
  normalizeProductType as normalizePumpFuelType,
} from '@/lib/product-types';
