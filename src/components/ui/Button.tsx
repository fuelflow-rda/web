'use client';

import { Button as AntButton, type ButtonProps as AntButtonProps } from 'antd';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

/**
 * The design's four button kinds. One primary per view; secondary is outlined,
 * ghost is text only, danger is a tint kept for irreversible actions. Labels are
 * sentence case.
 */
export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps
  extends Omit<AntButtonProps, 'type' | 'size' | 'icon' | 'danger' | 'variant' | 'color' | 'ghost'> {
  kind?: ButtonKind;
  /** md: 38px, 14px label. lg: 51px, 16px label, for a screen's main action. */
  size?: 'md' | 'lg';
  /** A Lucide icon, drawn before the label. */
  icon?: LucideIcon;
}

const KIND: Record<ButtonKind, Pick<AntButtonProps, 'type' | 'variant' | 'color'>> = {
  primary: { type: 'primary' },
  secondary: { variant: 'outlined', color: 'default' },
  ghost: { variant: 'text', color: 'default' },
  danger: { variant: 'filled', color: 'danger' },
};

/**
 * Built on antd's Button, so loading, disabled and form submission behave as
 * they do everywhere else in the app; the look comes from the antd theme
 * (src/theme/antd-theme.ts).
 */
export function Button({ kind = 'secondary', size = 'md', icon: Icon, className, ...rest }: ButtonProps) {
  return (
    <AntButton
      {...KIND[kind]}
      size={size === 'lg' ? 'large' : 'middle'}
      icon={Icon ? <Icon size={size === 'lg' ? 18 : 16} aria-hidden /> : undefined}
      className={cx(focusRing, className)}
      {...rest}
    />
  );
}
