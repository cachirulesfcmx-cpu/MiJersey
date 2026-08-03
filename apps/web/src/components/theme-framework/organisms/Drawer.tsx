'use client';

export function Drawer({
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
  return (
    <>
      <div className="tf-overlay" data-open={open} onClick={onClose} aria-hidden="true" />
      <div
        className="tf-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
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
