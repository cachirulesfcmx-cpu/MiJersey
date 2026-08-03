'use client';

import { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  id: string;
  label: string;
}

export function Dropdown({ label, options }: { label: string; options: DropdownOption[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((option) => option.id === selected)?.label ?? label;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="tf-btn tf-btn-outline"
        onClick={() => setOpen((value) => !value)}
      >
        {selectedLabel}
      </button>
      <div
        className="tf-dropdown"
        data-open={open}
        style={{ top: 'calc(100% + 8px)', left: 0 }}
        role="menu"
      >
        {options.map((option) => (
          <div
            key={option.id}
            className="tf-dropdown-item"
            role="menuitem"
            onClick={() => {
              setSelected(option.id);
              setOpen(false);
            }}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
