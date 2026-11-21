'use client';

import { useId } from 'react';
import { Switch, type SwitchProps } from 'antd';
import { cx } from '@/lib/cx';

export interface ToggleProps extends Omit<SwitchProps, 'id'> {
  /** The setting this switch turns on. Clicking it toggles the switch too. */
  label: string;
}

/** A 36 by 20 switch with its label. The label is the switch's accessible name. */
export function Toggle({ label, className, ...rest }: ToggleProps) {
  const id = `toggle-${useId()}`;
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Switch id={id} {...rest} />
      <label htmlFor={id} className="cursor-pointer text-14 text-text-secondary">
        {label}
      </label>
    </span>
  );
}
