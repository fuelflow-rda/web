'use client';

import { useId, useState, type ReactNode } from 'react';
import { Input, type InputProps } from 'antd';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export interface TextFieldProps extends Omit<InputProps, 'prefix' | 'suffix' | 'status' | 'size'> {
  /** Always visible above the field. Placeholders are not labels. */
  label: string;
  /** Below the field: how to fill it in. Replaced by `error` when there is one. */
  hint?: ReactNode;
  /** Below the field in the danger colour. Should say how to fix the value. */
  error?: ReactNode;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  /** Set numbers in Geist Mono, as the design does for every figure. */
  mono?: boolean;
  /** For a PIN: the value is hidden, and an eye button after it shows it. Replaces trailingIcon. */
  revealable?: boolean;
}

/**
 * Label above, value inside, hint below. The field is antd's Input (41px, a
 * border-strong boundary that becomes a 2px focus border, danger on error),
 * styled by the antd theme.
 */
export function TextField({
  label,
  hint,
  error,
  leadingIcon: Leading,
  trailingIcon: Trailing,
  mono,
  revealable,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const auto = useId();
  const [shown, setShown] = useState(false);
  const Reveal = shown ? EyeOff : Eye;
  const inputId = id ?? `field-${auto}`;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;

  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="text-13 font-medium text-text-secondary">
        {label}
      </label>
      <Input
        id={inputId}
        status={error ? 'error' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        prefix={Leading ? <Leading size={16} aria-hidden className="text-text-muted" /> : undefined}
        suffix={
          revealable ? (
            <button
              type="button"
              aria-label={shown ? `Hide ${label}` : `Show ${label}`}
              aria-pressed={shown}
              onClick={() => setShown((v) => !v)}
              className={cx(
                '-mr-1 inline-flex cursor-pointer items-center justify-center rounded-4 border-0 bg-transparent p-1 text-text-muted hover:text-text',
                focusRing,
              )}
            >
              <Reveal size={16} aria-hidden />
            </button>
          ) : Trailing ? (
            <Trailing size={16} aria-hidden className="text-text-muted" />
          ) : undefined
        }
        className={mono ? 'font-mono' : undefined}
        {...rest}
        {...(revealable ? { type: shown ? 'text' : 'password' } : {})}
      />
      {note ? (
        <p id={noteId} className={cx('m-0 text-12', error ? 'text-danger' : 'text-text-muted')}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
