'use client';

import { useState } from 'react';

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        className="tf-tooltip"
        data-open={open}
        role="tooltip"
        style={{
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: `translateX(-50%) translateY(${open ? 0 : 4}px)`,
        }}
      >
        {label}
      </span>
    </span>
  );
}
