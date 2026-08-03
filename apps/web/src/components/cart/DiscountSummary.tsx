'use client';

import type { ValidatePromotionResult } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { useAuth } from '../../providers/auth-provider';

function formatPrice(amount: number, currency: string): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency });
}

/**
 * Discount Summary (spec 024 §6): promociones `AUTOMATIC` que ya aplican al carrito actual,
 * calculadas con el motor completo de reglas (`POST /promotions/validate`, sin código). Es
 * informativo — el total real del carrito sigue siendo el de Cart (017); ver `docs/coupons-promotions.md`.
 */
export function DiscountSummary({ sessionId }: { sessionId: string }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [result, setResult] = useState<ValidatePromotionResult | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    client
      .validatePromotion(sessionId, {}, accessToken ?? undefined)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId, accessToken]);

  if (!result || result.applicable.length === 0) return null;

  return (
    <div className="border-success-200 bg-success-50 animate-fade-in-up flex flex-col gap-1 rounded-2xl border p-3 text-sm">
      <p className="text-success-700 font-medium">Promociones aplicables a tu carrito</p>
      {result.applicable.map((promotion) => (
        <p key={promotion.id} className="text-success-600">
          {promotion.name}
        </p>
      ))}
      <p className="text-success-700 text-xs">
        Ahorro estimado: {formatPrice(result.discountTotal, result.currency)}
      </p>
    </div>
  );
}
