'use client';

import { useId, type ReactNode } from 'react';
import { Input, type InputProps } from 'antd';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cx } from '@/lib/cx';

export interface PasswordFieldProps extends Omit<InputProps, 'prefix' | 'suffix' | 'status' | 'size' | 'type'> {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
}

/** TextField's layout around antd's password input, with a show/hide toggle. */
export function PasswordField({ label, hint, error, id, className, ...rest }: PasswordFieldProps) {
  const auto = useId();
  const inputId = id ?? `field-${auto}`;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="text-13 font-medium text-text-secondary">
        {label}
      </label>
      <Input.Password
        id={inputId}
        status={error ? 'error' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        prefix={<Lock size={16} aria-hidden className="text-text-muted" />}
        iconRender={(visible) => (
          <span role="img" aria-label={visible ? 'Hide password' : 'Show password'} className="inline-flex text-text-muted">
            {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </span>
        )}
        className="font-mono"
        {...rest}
      />
      {note ? (
        <p id={noteId} className={cx('m-0 text-12', error ? 'text-danger' : 'text-text-muted')}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
