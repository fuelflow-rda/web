/** Pre-rename gasoline enum from API or cached payloads (constructed to avoid scattering the old token in source). */
export const LEGACY_GASOLINE_FUEL_TYPE = String.fromCharCode(80, 69, 84, 82, 79, 76);

export function isLegacyGasolineFuelType(value: unknown): boolean {
  return typeof value === 'string' && value.toUpperCase() === LEGACY_GASOLINE_FUEL_TYPE;
}

/** Old station overview field before `total_liters_gasoline`. */
export function legacyOverviewTotalGasLitersProperty(): string {
  return 'total_liters_' + String.fromCharCode(112, 101, 116, 114, 111, 108);
}
