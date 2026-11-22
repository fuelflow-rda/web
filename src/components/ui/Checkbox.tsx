'use client';

import type { ReactNode } from 'react';
import { Checkbox as AntCheckbox, type CheckboxProps as AntCheckboxProps } from 'antd';
import { cx } from '@/lib/cx';

export interface CheckboxProps extends Omit<AntCheckboxProps, 'children'> {
  children: ReactNode;
}

/** An 18px box in the primary colour with its label beside it (14px, text-secondary). */
export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  return (
    <AntCheckbox className={cx('text-14 text-text-secondary', className)} {...rest}>
      {children}
    </AntCheckbox>
  );
}
