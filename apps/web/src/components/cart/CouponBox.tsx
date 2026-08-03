'use client';

import type { CartCouponView } from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { useState } from 'react';

export function CouponBox({
  coupon,
  onApply,
  onRemove,
}: {
  coupon: CartCouponView | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApply(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onApply(code);
      setCode('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo aplicar el cupón.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (coupon) {
    return (
      <div className="border-pop-500/30 bg-pop-500/5 flex items-center justify-between rounded-2xl border p-3 text-sm">
        <span>
          Cupón <strong className="text-pop-600">{coupon.code}</strong>
          {!coupon.isValid && <span className="text-danger-600 ml-2">(ya no es válido)</span>}
        </span>
        <button
          type="button"
          className="text-danger-600 hover:underline"
          onClick={() => void onRemove()}
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleApply(event)} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          className="input-arena"
          placeholder="Código de cupón"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button
          type="submit"
          disabled={isSubmitting || !code.trim()}
          className="btn-pop-sm shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aplicar
        </button>
      </div>
      {error && <p className="text-danger-600 text-xs">{error}</p>}
    </form>
  );
}
