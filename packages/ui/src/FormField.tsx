import type { ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useId } from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Envuelve un control de formulario con su label y mensajes de error/ayuda,
 * conectados por `aria-describedby`/`aria-invalid` sin repetir el cableado
 * de accesibilidad en cada pantalla.
 */
export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error) || undefined,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-neutral-900">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      {child}
      {hint && !error && (
        <p id={hintId} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-danger-600 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
