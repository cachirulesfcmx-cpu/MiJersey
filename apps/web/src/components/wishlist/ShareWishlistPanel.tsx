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
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4">
      <span className="text-sm font-medium text-neutral-900">Compartir lista de deseos</span>
      {error && <p className="text-danger-600 text-xs">{error}</p>}

      {shareUrl ? (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600"
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isSharing}
          onClick={() => void handleShare()}
          className="bg-brand-600 hover:bg-brand-700 self-start rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:bg-neutral-300"
        >
          Generar enlace
        </button>
      )}
    </div>
  );
}
