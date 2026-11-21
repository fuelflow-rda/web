import type { UserRow } from './data';

/** "Now", "2 min ago", "1 h ago", "Today 08:12", "Mon 16 Nov", "Never". */
export function lastActive(u: Pick<UserRow, 'last_seen_at' | 'account_status'>, now = Date.now()): string {
  if (u.account_status === 'on_shift') return 'Now';
  if (!u.last_seen_at) return 'Never';
  const t = Date.parse(u.last_seen_at);
  const m = Math.round((now - t) / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  if (m < 240) return `${Math.round(m / 60)} h ago`;
  const kday = (ms: number) => new Date(ms + 2 * 3600_000).toISOString().slice(0, 10);
  const hhmm = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(t);
  if (kday(t) === kday(now)) return `Today ${hhmm}`;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Kigali',
  }).format(t);
}

