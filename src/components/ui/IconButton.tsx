import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Required: the button has no visible text, so this is its accessible name. */
  label: string;
}

/** A 40px square button with one 18px icon, on the surface with a hairline border. */
export function IconButton({ icon: Icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border bg-surface text-text-secondary',
        'transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        className,
      )}
      {...rest}
    >
      <Icon size={18} aria-hidden />
    </button>
  );
}
