'use client';

/** Estrella reutilizable — modo lectura (promedio, reseñas) y modo interactivo (formulario de nueva reseña). */
export function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === 'function';

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const Element = interactive ? 'button' : 'span';
        return (
          <Element
            key={star}
            {...(interactive
              ? {
                  type: 'button',
                  onClick: () => onChange?.(star),
                  'aria-label': `${star} estrellas`,
                }
              : {})}
            className={interactive ? 'cursor-pointer' : undefined}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? 'var(--tf-accent)' : 'none'}
              stroke={filled ? 'var(--tf-accent)' : 'var(--tf-border-strong)'}
              strokeWidth={1.5}
            >
              <path
                d="M12 2.5l2.9 6.32 6.85.72-5.1 4.86 1.4 6.87L12 17.9l-6.05 3.37 1.4-6.87-5.1-4.86 6.85-.72L12 2.5z"
                strokeLinejoin="round"
              />
            </svg>
          </Element>
        );
      })}
    </div>
  );
}
