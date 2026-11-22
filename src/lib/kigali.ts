/**
 * Calendar days as the stations count them. Rwanda keeps UTC+2 all year (no
 * daylight saving), so a fixed offset is exact: a station's day starts at
 * 22:00 UTC the evening before.
 */
export const KIGALI_OFFSET_MS = 2 * 3600_000;
const DAY_MS = 86_400_000;

/** The instant the Kigali day containing `at` began, as epoch ms. */
export function kigaliDayStart(at: number): number {
  const local = new Date(at + KIGALI_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return local.getTime() - KIGALI_OFFSET_MS;
}

/** YYYY-MM-DD of the Kigali day containing `at`. */
export const ymd = (at: number) => new Date(at + KIGALI_OFFSET_MS).toISOString().slice(0, 10);

/**
 * A period as API timestamps: the last `days` Kigali days up to now, or whole
 * Kigali days from one date to another, both inclusive.
 */
export function kigaliWindow(
  range: { days: number } | { from: string; to: string },
  now = Date.now(),
): { from: string; to?: string } {
  if ('days' in range) {
    return { from: new Date(kigaliDayStart(now) - (range.days - 1) * DAY_MS).toISOString() };
  }
  return {
    from: new Date(Date.parse(`${range.from}T00:00:00.000Z`) - KIGALI_OFFSET_MS).toISOString(),
    to: new Date(Date.parse(`${range.to}T23:59:59.999Z`) - KIGALI_OFFSET_MS).toISOString(),
  };
}
