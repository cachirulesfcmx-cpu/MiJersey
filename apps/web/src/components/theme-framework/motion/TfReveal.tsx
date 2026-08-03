'use client';

import { useEffect, useRef, useState } from 'react';

type TfRevealVariant = 'up' | 'scale' | 'blur' | 'left';

const VARIANT_CLASS: Record<TfRevealVariant, string> = {
  up: 'tf-reveal',
  scale: 'tf-reveal-scale',
  blur: 'tf-reveal-blur',
  left: 'tf-reveal-slide-left',
};

export function TfReveal({
  children,
  variant = 'up',
  delayMs = 0,
  className = '',
  style,
}: {
  children: React.ReactNode;
  variant?: TfRevealVariant;
  delayMs?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-inview={inView}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      style={{ ...style, transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

export function TfStagger({
  children,
  className = '',
  variant = 'up',
}: {
  children: React.ReactNode[];
  className?: string;
  variant?: TfRevealVariant;
}) {
  return (
    <div className={`tf-stagger ${className}`}>
      {children.map((child, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <TfReveal key={index} variant={variant} delayMs={index * 70}>
          {child}
        </TfReveal>
      ))}
    </div>
  );
}
