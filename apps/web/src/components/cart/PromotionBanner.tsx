'use client';

import type { Promotion } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

function describePromotion(promotion: Promotion): string {
  const discount =
    promotion.discountType === 'PERCENTAGE'
      ? `${promotion.discountValue}% de descuento`
      : `${promotion.discountValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} de descuento`;
  const minAmountRule = promotion.rules.find((rule) => rule.ruleType === 'MIN_CART_AMOUNT');
  if (minAmountRule) {
    const amount = Number(minAmountRule.value).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
    return `${discount} en compras desde ${amount}`;
  }
  return discount;
}

/** Promotion Banner (spec 024 §6) — anuncio general de promociones automáticas vigentes, sin evaluar el carrito actual (ver `ListActivePromotionsUseCase`). */
export function PromotionBanner() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    let cancelled = false;
    client
      .listActivePromotions()
      .then((result) => {
        if (!cancelled) setPromotions(result.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [client]);

  if (promotions.length === 0) return null;

  return (
    <div className="bg-brand-50 border-brand-100 flex flex-col gap-1 rounded-md border p-4 text-sm">
      {promotions.map((promotion) => (
        <p key={promotion.id} className="text-brand-700">
          🎉 {promotion.name}: {describePromotion(promotion)}
        </p>
      ))}
    </div>
  );
}
