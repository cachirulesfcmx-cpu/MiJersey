'use client';

import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      <div className="tf-overlay" data-open={open} onClick={onClose} aria-hidden="true" />
      <div className="tf-modal" data-open={open} role="dialog" aria-modal="true" aria-label={title}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--tf-space-4)',
          }}
        >
          <h3 className="tf-h3">{title}</h3>
          <button
            type="button"
            className="tf-btn tf-btn-icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
