'use client';

import { useState } from 'react';

import { CursorDot } from './motion/CursorDot';
import { ScrollProgress } from './motion/ScrollProgress';

export function ThemeFrameworkShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className="tf-root" data-theme={theme}>
      <ScrollProgress />
      <CursorDot />
      <button
        type="button"
        className="tf-btn tf-btn-icon"
        style={{
          position: 'fixed',
          top: 'var(--tf-space-4)',
          right: 'var(--tf-space-4)',
          zIndex: 90,
        }}
        onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        aria-label="Cambiar modo claro/oscuro"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      {children}
    </div>
  );
}
