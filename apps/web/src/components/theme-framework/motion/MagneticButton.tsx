'use client';

import { useRef } from 'react';

const PULL_STRENGTH = 0.35;

export function MagneticButton({
  children,
  className = '',
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    node.style.transform = `translate(${x * PULL_STRENGTH}px, ${y * PULL_STRENGTH}px)`;
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)';
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const node = ref.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'tf-ripple';
      ripple.style.left = `${event.clientX - rect.left - 8}px`;
      ripple.style.top = `${event.clientY - rect.top - 8}px`;
      ripple.style.width = ripple.style.height = '16px';
      node.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }
    onClick?.();
  }

  return (
    <button
      ref={ref}
      type={type}
      className={`tf-btn tf-btn-primary tf-btn-magnetic ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
