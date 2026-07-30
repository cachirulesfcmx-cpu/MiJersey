'use client';

import type { CustomerOrderDetail } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Breadcrumbs } from '../../../../components/plp/Breadcrumbs';
import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { useCart } from '../../../../providers/cart-provider';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { accessToken } = useAuth();
  const { addItem } = useCart();

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    client
      .getMyOrder(accessToken, params.id)
      .then(setOrder)
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el pedido.');
      });
  }, [client, accessToken, params.id]);

  /** "Volver a comprar" (spec §3) orquestado desde el frontend con la API ya existente de Cart (017) — el endpoint formal `POST /orders/:id/reorder` es de 021-Orders, que todavía no existe. */
  async function handleReorder() {
    if (!order) return;
    setIsReordering(true);
    setReorderMessage(null);

    let succeeded = 0;
    let failed = 0;
    for (const item of order.items) {
      try {
        await addItem({ variantId: item.variantId, quantity: item.quantity });
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }

    setIsReordering(false);
    if (failed === 0) {
      router.push('/cart');
    } else {
      setReorderMessage(
        `Se agregaron ${succeeded} de ${order.items.length} artículos. Algunos ya no están disponibles.`,
      );
    }
  }

  if (error) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10">
        <p className="text-danger-600 text-sm">{error}</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10">
        <p className="text-sm text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Mi cuenta', href: '/account' },
          { label: order.orderNumber },
        ]}
      />
      <h1 className="text-2xl font-semibold text-neutral-900">Pedido {order.orderNumber}</h1>
      <p className="text-sm text-neutral-500">
        {new Date(order.createdAt).toLocaleDateString('es-MX')} · {order.status} · Pago:{' '}
        {order.paymentStatus} · Envío: {order.fulfillmentStatus}
      </p>

      <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-neutral-600">
              {item.sku} × {item.quantity}
            </span>
            <span className="text-neutral-900">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="mt-2 flex flex-col gap-1 border-t border-neutral-200 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Descuento</span>
              <span className="text-danger-600">-{formatPrice(order.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Envío</span>
            <span>{formatPrice(order.shippingTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Impuestos</span>
            <span>{formatPrice(order.taxTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {reorderMessage && <p className="text-sm text-neutral-600">{reorderMessage}</p>}

      <Button onClick={() => void handleReorder()} isLoading={isReordering} className="self-start">
        Comprar de nuevo
      </Button>
    </main>
  );
}
