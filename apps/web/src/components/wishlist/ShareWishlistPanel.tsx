'use client';

import { useState } from 'react';

/** Spec §6 "Share Wishlist" — genera (o reutiliza) el enlace público y permite copiarlo. La URL apunta a `/wishlist/shared/[token]`, la vista de solo lectura pública. */
export function ShareWishlistPanel({
  shareToken,
  onShare,
}: {
  shareToken: string | null;
  onShare: () => Promise<string>;
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl =
    shareToken && typeof window !== 'undefined'
      ? `${window.location.origin}/wishlist/shared/${shareToken}`
      : null;

  async function handleShare() {
    setIsSharing(true);
    setError(null);
    try {
      await onShare();
    } catch {
      setError('No se pudo generar el enlace para compartir.');
    } finally {
      setIsSharing(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-arena flex flex-col gap-2">
      <span className="label-arena">Compartir lista de deseos</span>
      {error && <p className="text-danger-600 text-xs">{error}</p>}

      {shareUrl ? (
        <div className="flex items-center gap-2">
          <input readOnly value={shareUrl} className="input-arena flex-1 py-2 text-xs" />
          <button type="button" onClick={() => void handleCopy()} className="btn-pop-sm shrink-0">
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isSharing}
          onClick={() => void handleShare()}
          className="btn-pop-sm self-start disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generar enlace
        </button>
      )}
    </div>
  );
}
