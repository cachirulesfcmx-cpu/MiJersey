'use client';

import type { Promotion } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function promotionLabel(promotion: Promotion): string {
  const amount =
    promotion.discountType === 'PERCENTAGE'
      ? `${promotion.discountValue}% de descuento`
      : `$${promotion.discountValue} de descuento`;
  return promotion.name || amount;
}

/**
 * Barra de urgencia real — solo se muestra si hay una `Promotion` AUTOMATIC vigente
 * (status ACTIVE, dentro de startsAt/endsAt, con cupo) y con `endsAt` definido. No inventa
 * ninguna fecha límite: usa el motor de promociones existente (024) tal cual, mismo criterio
 * "solo datos reales" que el resto del rediseño de fase 2.
 */
export function PromotionCountdownBar() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    client
      .listActivePromotions()
      .then(({ items }) => {
        const withDeadline = items
          .filter((item): item is Promotion & { endsAt: string } => Boolean(item.endsAt))
          .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
        setPromotion(withDeadline[0] ?? null);
      })
      .catch(() => setPromotion(null));
  }, [client]);

  useEffect(() => {
    if (!promotion) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [promotion]);

  if (!promotion || !promotion.endsAt || dismissed || now === null) return null;

  const remaining = new Date(promotion.endsAt).getTime() - now;
  if (remaining <= 0) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-center text-sm text-white"
      style={{ background: 'var(--tf-neutral-950)' }}
    >
      <span className="font-medium">{promotionLabel(promotion)}</span>
      <span className="tf-caption text-white/70">Termina en</span>
      <span className="font-display tracking-wide">{formatRemaining(remaining)}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar"
        className="ml-2 text-white/50 transition-colors hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
