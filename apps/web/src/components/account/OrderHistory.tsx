'use client';

import type { CustomerOrderSummary } from '@mijersey/sdk';
import Link from 'next/link';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function OrderHistory({ orders }: { orders: CustomerOrderSummary[] | null }) {
  if (!orders) return <p className="text-sm text-neutral-500">Cargando…</p>;

  if (orders.length === 0) {
    return <p className="text-sm text-neutral-500">Todavía no tienes pedidos.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="card-arena flex items-center justify-between text-sm"
          >
            <div>
              <p className="font-medium text-neutral-900">{order.orderNumber}</p>
              <p className="text-xs text-neutral-500">
                {new Date(order.createdAt).toLocaleDateString('es-MX')} · {order.itemCount} artículo
                {order.itemCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-arena-950 tracking-wide">
                {formatPrice(order.grandTotal)}
              </p>
              <p className="badge-pop mt-1">{order.status}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
