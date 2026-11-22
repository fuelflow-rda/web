/**
 * "Friday 20 November 2026", as the design writes a full date. en-GB inserts a
 * comma after the weekday as soon as the year is included, so the parts are
 * joined here instead.
 */
export function fullDate(at: Date, timeZone = 'Africa/Kigali'): string {
  const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('weekday')} ${part('day')} ${part('month')} ${part('year')}`;
}
