'use client';

import { useState } from 'react';

/** Solo UI (spec §6 "Shipping Estimator") — no hay un motor de tarifas real todavía (023-Shipping no existe en este código base), así que no se inventa un cálculo. El costo real se resuelve en 018-Checkout. */
export function ShippingEstimator() {
  const [postalCode, setPostalCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
      <span className="text-sm font-medium text-neutral-900">Estimar envío</span>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
        className="flex gap-2"
      >
        <input
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          placeholder="Código postal"
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          maxLength={10}
        />
        <button
          type="submit"
          disabled={!postalCode.trim()}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          Calcular
        </button>
      </form>
      {submitted && (
        <p className="text-xs text-neutral-500">
          El costo de envío para {postalCode} se calculará en el checkout.
        </p>
      )}
    </div>
  );
}
