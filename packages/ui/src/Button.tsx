import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-200',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100 disabled:text-neutral-300',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 disabled:bg-danger-200',
};

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
    'transition-colors disabled:cursor-not-allowed',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
