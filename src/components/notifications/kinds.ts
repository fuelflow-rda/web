import {
  Bell,
  CircleCheck,
  Clock3,
  Flag,
  Fuel,
  Info,
  KeyRound,
  LogOut,
  TrendingDown,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

export type NotificationTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

export interface NotificationKind {
  label: string;
  icon: LucideIcon;
  tone: NotificationTone;
}

/**
 * What each notification type the API sends is called on screen. The console
 * receives the first six; `reconciliation_flag` goes to attendants. The four
 * upper-case types are from before the API named its own, and only old rows
 * carry them.
 */
const KINDS: Record<string, NotificationKind> = {
  reconciliation_discrepancy: { label: 'Discrepancy', icon: TriangleAlert, tone: 'danger' },
  shift_overtime: { label: 'Long shift', icon: Clock3, tone: 'warning' },
  shift_early_end: { label: 'Shift ended early', icon: LogOut, tone: 'warning' },
  station_dormant: { label: 'Quiet station', icon: TrendingDown, tone: 'warning' },
  pump_inactivity: { label: 'Idle pump', icon: Fuel, tone: 'info' },
  pin_reset_request: { label: 'PIN request', icon: KeyRound, tone: 'info' },
  reconciliation_flag: { label: 'Flagged sale', icon: Flag, tone: 'warning' },
  ALERT: { label: 'Alert', icon: TriangleAlert, tone: 'danger' },
  WARNING: { label: 'Warning', icon: TriangleAlert, tone: 'warning' },
  INFO: { label: 'Notice', icon: Info, tone: 'info' },
  SUCCESS: { label: 'Done', icon: CircleCheck, tone: 'success' },
};

const FALLBACK: NotificationKind = { label: 'Notice', icon: Bell, tone: 'neutral' };

export const kindOf = (type: string | null | undefined): NotificationKind => (type && KINDS[type]) || FALLBACK;

/** The kinds a manager or admin can filter by, in the order they matter. */
export const FILTER_KINDS = [
  'reconciliation_discrepancy',
  'shift_overtime',
  'shift_early_end',
  'station_dormant',
  'pump_inactivity',
  'pin_reset_request',
].map((value) => ({ value, label: KINDS[value].label }));

/** The round icon badge beside a notification. */
export const TONE_BADGE: Record<NotificationTone, string> = {
  danger: 'bg-danger-tint text-danger',
  warning: 'bg-warning-tint text-warning',
  info: 'bg-info-tint text-info',
  success: 'bg-success-tint text-success',
  neutral: 'bg-surface-muted text-text-secondary',
};

/** "Sat 21 Nov, 08:12", in Kigali. */
export const kigaliWhen = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(new Date(iso));
