export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = 'Cargando' }: SpinnerProps) {
  const classes = [
    'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
    className ?? 'h-4 w-4',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span role="status" className="inline-flex items-center">
      <span className={classes} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
