'use client';

import type { ShippingQuote } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

function formatPrice(amount: number, currency: string): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency });
}

/**
 * Shipping Estimator (spec 023 §6): cotización real por destino y peso del carrito, informativa —
 * la selección real del método de envío sigue siendo la tarifa plana de "Métodos de envío" (018),
 * que no se modificó. Este componente muestra al cliente qué costaría el envío con el motor de
 * zona+peso de 023 antes de continuar, sin bloquear el flujo si todavía no hay tarifas configuradas.
 */
export function ShippingEstimator({
  sessionId,
  accessToken,
  country,
  state,
}: {
  sessionId: string;
  accessToken?: string;
  country: string;
  state?: string;
}) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [quotes, setQuotes] = useState<ShippingQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .calculateShippingRates(sessionId, { country, ...(state ? { state } : {}) }, accessToken)
      .then((result) => {
        if (!cancelled) setQuotes(result.items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'No se pudo estimar el envío.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId, accessToken, country, state]);

  if (error || (quotes && quotes.length === 0)) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4 text-sm">
      <h3 className="font-semibold text-neutral-900">Estimador de envío</h3>
      {!quotes ? (
        <p className="text-neutral-500">Calculando…</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {quotes.map((quote) => (
            <li key={quote.rateId} className="flex justify-between text-neutral-600">
              <span>
                {quote.carrierName} — {quote.name} ({quote.estimatedDaysMin}-
                {quote.estimatedDaysMax} días)
              </span>
              <span className="font-medium text-neutral-900">
                {formatPrice(quote.price, quote.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
