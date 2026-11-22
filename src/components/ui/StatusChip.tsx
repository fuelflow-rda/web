import type { ReactNode } from 'react';
import { CircleCheck, CircleDashed, Clock3, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE: Record<StatusTone, { box: string; icon: LucideIcon }> = {
  success: { box: 'bg-success-tint text-success', icon: CircleCheck },
  warning: { box: 'bg-warning-tint text-warning', icon: Clock3 },
  danger: { box: 'bg-danger-tint text-danger', icon: TriangleAlert },
  info: { box: 'bg-info-tint text-info', icon: Info },
  neutral: { box: 'bg-surface-muted text-text-secondary', icon: CircleDashed },
};

export interface StatusChipProps {
  tone: StatusTone;
  children: ReactNode;
  /** Replaces the tone's default icon. */
  icon?: LucideIcon;
  className?: string;
}

/**
 * A status label. Status always pairs colour with an icon and a word, never
 * colour alone, and the text keeps 4.5:1 on its tint in both themes.
 */
export function StatusChip({ tone, children, icon, className }: StatusChipProps) {
  const t = TONE[tone];
  const Icon = icon ?? t.icon;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-12 font-medium whitespace-nowrap',
        t.box,
        className,
      )}
    >
      <Icon size={14} aria-hidden className="shrink-0" />
      {children}
    </span>
  );
}
