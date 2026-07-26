import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, ...props },
  ref,
) {
  const classes = [
    'w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900',
    'placeholder:text-neutral-400',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
    hasError
      ? 'border-danger-500 focus-visible:outline-danger-500'
      : 'border-neutral-200 focus-visible:outline-brand-500',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <input ref={ref} className={classes} aria-invalid={hasError || undefined} {...props} />;
});
