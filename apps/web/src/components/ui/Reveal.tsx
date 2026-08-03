'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Envuelve contenido y le aplica `animate-fade-in-up` (globals.css) la primera vez
 * que entra en el viewport — usado en todo el storefront para que las secciones no
 * aparezcan "de golpe" al cargar/hacer scroll. `once` evita reanimar si el usuario
 * hace scroll hacia arriba y vuelve a bajar.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fade-in-up' : 'opacity-0'} ${className ?? ''}`}
      style={visible ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
