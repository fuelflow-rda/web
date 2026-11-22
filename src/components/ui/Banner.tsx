import type { ReactNode } from 'react';
import { CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export type BannerTone = 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<BannerTone, { box: string; text: string; icon: LucideIcon }> = {
  success: { box: 'bg-success-tint', text: 'text-success', icon: CircleCheck },
  warning: { box: 'bg-warning-tint', text: 'text-warning', icon: TriangleAlert },
  danger: { box: 'bg-danger-tint', text: 'text-danger', icon: TriangleAlert },
  info: { box: 'bg-info-tint', text: 'text-info', icon: Info },
};

export interface BannerProps {
  tone: BannerTone;
  title: string;
  children?: ReactNode;
  /** Replaces the tone's icon, for example CloudOff for an unsynced sale. */
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Reports system state. Danger is announced at once (role="alert"); the rest
 * politely (role="status").
 */
export function Banner({ tone, title, children, icon, action, className }: BannerProps) {
  const t = TONE[tone];
  const Icon = icon ?? t.icon;
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('flex items-center gap-3 rounded-control px-4 py-3', t.box, className)}
    >
      <Icon size={18} aria-hidden className={cx('shrink-0', t.text)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cx('m-0 text-14 font-semibold', t.text)}>{title}</p>
        {children ? <div className="text-13 text-text-secondary">{children}</div> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className={cx('shrink-0 cursor-pointer rounded-badge border-0 bg-transparent p-0 text-13 font-semibold', t.text, focusRing)}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
