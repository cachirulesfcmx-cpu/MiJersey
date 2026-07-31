'use client';

import type { Order, OrderTimelineEvent } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { OrderTimeline } from '../../../../components/account/OrderTimeline';
import { ShipmentStatus } from '../../../../components/account/ShipmentStatus';
import { Breadcrumbs } from '../../../../components/plp/Breadcrumbs';
import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { useCart } from '../../../../providers/cart-provider';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function canCancel(order: Order): boolean {
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return false;
  return order.fulfillmentStatus !== 'SHIPPED' && order.fulfillmentStatus !== 'DELIVERED';
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { accessToken } = useAuth();
  const { sessionId, refresh: refreshCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [orderResult, timelineResult] = await Promise.all([
        client.getOrder(accessToken, params.id),
        client.getOrderTimeline(accessToken, params.id),
      ]);
      setOrder(orderResult);
      setTimeline(timelineResult.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el pedido.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Cancelación real (spec 021 §2) — antes no existía, el pedido solo se podía consultar (019). */
  async function handleCancel() {
    if (!accessToken) return;
    setIsCancelling(true);
    setError(null);
    try {
      await client.cancelOrder(accessToken, params.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cancelar el pedido.');
    } finally {
      setIsCancelling(false);
    }
  }

  /** "Volver a comprar" ahora usa el endpoint formal de 021 en vez de la orquestación manual de 019 (un `addItem` por línea desde el navegador). */
  async function handleReorder() {
    if (!accessToken || !sessionId) return;
    setIsReordering(true);
    setReorderMessage(null);

    try {
      const result = await client.reorder(accessToken, params.id, sessionId);
      await refreshCart();
      if (result.failedCount === 0) {
        router.push('/cart');
      } else {
        setReorderMessage(
          `Se agregaron ${result.succeededCount} de ${result.succeededCount + result.failedCount} artículos. Algunos ya no están disponibles.`,
        );
      }
    } catch (err) {
      setReorderMessage(
        err instanceof ApiClientError ? err.message : 'No se pudo volver a comprar este pedido.',
      );
    } finally {
      setIsReordering(false);
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
      {order.cancelReason && (
        <p className="text-danger-600 text-sm">Motivo de cancelación: {order.cancelReason}</p>
      )}

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

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-neutral-900">Seguimiento</h2>
        <OrderTimeline events={timeline} />
      </section>

      {accessToken && <ShipmentStatus orderId={order.id} accessToken={accessToken} />}

      <Link
        href={`/account/support/new?orderId=${order.id}`}
        className="text-brand-600 text-sm hover:underline"
      >
        ¿Necesitas ayuda con este pedido?
      </Link>

      {reorderMessage && <p className="text-sm text-neutral-600">{reorderMessage}</p>}

      <div className="flex gap-3">
        <Button onClick={() => void handleReorder()} isLoading={isReordering} className="flex-1">
          Comprar de nuevo
        </Button>
        {canCancel(order) && (
          <Button
            variant="secondary"
            onClick={() => void handleCancel()}
            isLoading={isCancelling}
            className="flex-1"
          >
            Cancelar pedido
          </Button>
        )}
      </div>
    </main>
  );
}
