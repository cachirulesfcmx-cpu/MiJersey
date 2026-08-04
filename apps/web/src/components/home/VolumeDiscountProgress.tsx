'use client';

import type { Promotion } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { useCart } from '../../providers/cart-provider';

function discountLabel(promotion: Promotion): string {
  return promotion.discountType === 'PERCENTAGE'
    ? `${promotion.discountValue}% de descuento`
    : `${promotion.discountValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} de descuento`;
}

interface Tier {
  promotion: Promotion;
  threshold: number;
}

/**
 * "Mientras más agregas, más ahorras" — real, no decorativo: lee las `Promotion` AUTOMATIC
 * vigentes con una regla `MIN_CART_QUANTITY` (motor de promociones 024 + descuento por volumen
 * de fase 2) y compara el umbral contra `itemCount` real del carrito (`useCart`). Sin carrito
 * o sin promociones de este tipo activas, no se muestra nada — mismo criterio "solo datos
 * reales" del resto del rediseño.
 */
export function VolumeDiscountProgress({
  variant = 'section',
}: {
  /** 'section' (default): full-bleed con su propio tf-section/tf-container, para el home. 'inline': solo la tarjeta, para insertarse dentro de un container que ya existe (PLP). */
  variant?: 'section' | 'inline';
}) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { itemCount } = useCart();
  const [tiers, setTiers] = useState<Tier[] | null>(null);

  useEffect(() => {
    client
      .listActivePromotions()
      .then(({ items }) => {
        const withQuantityRule = items
          .map((promotion) => {
            const rule = promotion.rules.find((r) => r.ruleType === 'MIN_CART_QUANTITY');
            return rule ? { promotion, threshold: Number(rule.value) } : null;
          })
          .filter((tier): tier is Tier => tier !== null)
          .sort((a, b) => a.threshold - b.threshold);
        setTiers(withQuantityRule);
      })
      .catch(() => setTiers([]));
  }, [client]);

  if (!tiers || tiers.length === 0) return null;

  const maxThreshold = tiers[tiers.length - 1]?.threshold ?? 0;
  if (maxThreshold === 0) return null;
  const nextTier = tiers.find((tier) => itemCount < tier.threshold);
  const currentTier = [...tiers].reverse().find((tier) => itemCount >= tier.threshold);

  const card = (
    <div className="card-arena flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="tf-caption text-arena-700">Oferta por volumen</span>
        <h3 className="font-display text-arena-950 text-lg uppercase tracking-wide sm:text-xl">
          Mientras más agregas, más ahorras
        </h3>
        <p className="text-sm text-neutral-500">
          {tiers
            .map((tier) => `${tier.threshold}+ jerseys = ${discountLabel(tier.promotion)}`)
            .join(' · ')}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {Array.from({ length: maxThreshold }).map((_, i) => {
          const filled = i < itemCount;
          const tierHere = tiers.find((tier) => tier.threshold === i + 1);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full transition-all duration-500 ${
                  filled ? 'bg-arena-900' : 'bg-neutral-200'
                }`}
              />
              {tierHere && (
                <span
                  className={`tf-caption ${filled || itemCount >= tierHere.threshold ? 'text-arena-900' : 'text-neutral-400'}`}
                >
                  {tierHere.threshold}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-neutral-600">
        {currentTier ? (
          <>
            <span className="font-semibold text-emerald-700">
              ¡Ya tienes {discountLabel(currentTier.promotion)} desbloqueado!
            </span>
            {nextTier && (
              <>
                {' '}
                Agrega {nextTier.threshold - itemCount} más para {discountLabel(nextTier.promotion)}
                .
              </>
            )}
          </>
        ) : nextTier ? (
          <>
            Agrega{' '}
            <span className="font-semibold text-neutral-900">
              {nextTier.threshold - itemCount} jersey
              {nextTier.threshold - itemCount === 1 ? '' : 's'}
            </span>{' '}
            más y desbloquea {discountLabel(nextTier.promotion)}.
          </>
        ) : (
          'Agrega jerseys a tu carrito para desbloquear descuentos por volumen.'
        )}
      </p>
    </div>
  );

  if (variant === 'inline') return card;

  return (
    <section className="tf-section py-6 sm:py-8">
      <div className="tf-container">{card}</div>
    </section>
  );
}
