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

  // Dos columnas -- texto/oferta a la izquierda, track de pasos a la derecha -- en vez del
  // bloque apilado de antes, para acercarse al patrón "mientras más agregas, más ahorras" de
  // referencia (badge rojo + track de iconos por unidad, terminando en un ícono de regalo en
  // el tier más alto). Todo el contenido sigue viniendo de las Promotion reales.
  const card = (
    <div className="card-arena flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <span
          className="w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
          style={{ background: 'var(--tf-danger)' }}
        >
          Oferta especial
        </span>
        <h3 className="font-display text-arena-950 text-2xl uppercase leading-tight tracking-wide sm:text-3xl">
          Mientras más agregas, más ahorras
        </h3>
        <p className="text-sm text-neutral-500">
          {tiers
            .map((tier) => `${tier.threshold} jerseys = ${discountLabel(tier.promotion)}`)
            .join(' · ')}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: maxThreshold }).map((_, i) => {
            const unit = i + 1;
            const filled = unit <= itemCount;
            const tierHere = tiers.find((tier) => tier.threshold === unit);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-colors duration-300 ${
                    filled ? 'border-transparent text-white' : 'border-neutral-200 text-neutral-300'
                  }`}
                  style={filled ? { background: 'var(--tf-accent)' } : undefined}
                >
                  {tierHere ? (
                    // Ícono de regalo -- marca el tier que desbloquea el jersey/descuento gratis.
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M20 12v9H4v-9M2 7h20v5H2V7zM12 22V7M12 7c-1.5 0-3-1-3-3s1.5-3 3 0c0-3 1.5-3 3-3s3 1 3 3-1.5 3-3 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    // Ícono simple de jersey -- unidades intermedias del track.
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M8 4L4 7v4h3v9h10v-9h3V7l-4-3-3 2h-2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={`tf-caption ${filled ? 'text-arena-900' : 'text-neutral-400'}`}>
                  {tierHere ? discountLabel(tierHere.promotion).split(' ')[0] : unit}
                </span>
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
                  Agrega {nextTier.threshold - itemCount} más para{' '}
                  {discountLabel(nextTier.promotion)}.
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
    </div>
  );

  if (variant === 'inline') return card;

  return (
    <section className="tf-section py-6 sm:py-8">
      <div className="tf-container">{card}</div>
    </section>
  );
}
