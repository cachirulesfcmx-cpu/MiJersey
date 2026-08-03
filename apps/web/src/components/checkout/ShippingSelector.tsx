'use client';

import type { ShippingMethod } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';
import { useState } from 'react';

import { PRIMARY_BUTTON_OVERRIDE_CLASS } from '../ui/form-styles';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function ShippingSelector({
  methods,
  initialSelectedId,
  isSubmitting,
  onSubmit,
}: {
  methods: ShippingMethod[];
  initialSelectedId?: string | null | undefined;
  isSubmitting: boolean;
  onSubmit: (shippingMethodId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? methods[0]?.id ?? '');

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (selectedId) onSubmit(selectedId);
      }}
    >
      <div className="flex flex-col gap-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 text-sm transition-colors ${
              selectedId === method.id
                ? 'border-pop-500 bg-pop-500/5'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shippingMethod"
                value={method.id}
                checked={selectedId === method.id}
                onChange={() => setSelectedId(method.id)}
                className="accent-pop-500"
              />
              <span className="flex flex-col">
                <span className="font-medium text-neutral-900">{method.name}</span>
                <span className="text-neutral-500">
                  {method.estimatedDaysMin}-{method.estimatedDaysMax} días hábiles
                </span>
              </span>
            </span>
            <span className="font-display text-arena-950 tracking-wide">
              {formatPrice(method.basePrice)}
            </span>
          </label>
        ))}
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!selectedId}
        className={`!self-start ${PRIMARY_BUTTON_OVERRIDE_CLASS}`}
      >
        Continuar a revisión
      </Button>
    </form>
  );
}
