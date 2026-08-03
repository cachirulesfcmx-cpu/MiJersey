'use client';

import { useEffect, useRef } from 'react';

/** Punto de cursor original que crece sobre elementos `data-cursor="link"`. Se desactiva en touch. */
export function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    function handleMove(event: MouseEvent) {
      const node = dotRef.current;
      if (!node) return;
      node.style.left = `${event.clientX}px`;
      node.style.top = `${event.clientY}px`;
      const target = (event.target as HTMLElement)?.closest('[data-cursor="link"]');
      node.dataset.variant = target ? 'link' : 'default';
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return <div ref={dotRef} className="tf-cursor-dot" data-variant="default" aria-hidden="true" />;
}
