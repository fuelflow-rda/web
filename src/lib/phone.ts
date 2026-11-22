/**
 * Rwandan mobile numbers, the same way the attendant app handles them, so a
 * number added here matches the one the attendant types at sign-in.
 * Stored as E.164 (+250788123456); shown as people write them (078 812 3456).
 */
const PREFIX = '+250';

export function normalizeRwandaPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('250') && digits.length >= 12) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith('250')) return `+${digits}`;
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return PREFIX + local;
}

/** True once the input is a complete mobile number: 0788123456, 788123456 or +250788123456. */
export function isValidRwandaPhone(input: string): boolean {
  return /^\+2507\d{8}$/.test(normalizeRwandaPhone(input));
}

/** "+250788111111" → "078 811 1111"; anything else as it came. */
export function formatRwandaPhone(phone: string | null | undefined): string {
  const m = /^\+250(\d{2})(\d{3})(\d{4})$/.exec(phone ?? '');
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : (phone ?? '');
}
