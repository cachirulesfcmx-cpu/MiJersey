'use client';

import type { Shipment, ShipmentEvent, ShipmentStatus as ShipmentStatusValue } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

const STATUS_LABELS: Record<ShipmentStatusValue, string> = {
  LABEL_CREATED: 'Guía generada',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  FAILED: 'Envío fallido',
  RETURNED: 'Devuelto',
};

/**
 * Shipping Status + Shipment Tracking (spec 023 §6) para el detalle de pedido del cliente. Reutiliza
 * `GET /shipping/orders/:orderId` (propiedad verificada vía `GetOrderUseCase`, 021) para resolver el
 * envío del pedido y luego `GET /shipping/track/:trackingNumber` (público) para su línea de tiempo.
 * No se muestra nada si el pedido todavía no tiene un envío generado (pago pendiente o sin procesar).
 */
export function ShipmentStatus({ orderId, accessToken }: { orderId: string; accessToken: string }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [shipment, setShipment] = useState<Shipment | null | undefined>(undefined);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .getShipmentForOrder(accessToken, orderId)
      .then(async (result) => {
        if (cancelled) return;
        setShipment(result.shipment);
        if (result.shipment?.trackingNumber) {
          const tracking = await client.trackShipment(result.shipment.trackingNumber);
          if (!cancelled) setEvents(tracking.events);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el envío.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, accessToken, orderId]);

  if (error || shipment === undefined || shipment === null) return null;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
      <h2 className="text-lg font-medium text-neutral-900">Envío</h2>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            shipment.status === 'DELIVERED' ? 'bg-success-600' : 'bg-brand-500'
          }`}
        />
        <span className="text-neutral-700">{STATUS_LABELS[shipment.status]}</span>
      </div>
      {shipment.trackingNumber && (
        <p className="text-sm text-neutral-500">
          Número de guía:{' '}
          <span className="font-medium text-neutral-900">{shipment.trackingNumber}</span>
        </p>
      )}
      {events.length > 0 && (
        <ol className="flex flex-col gap-1 border-t border-neutral-200 pt-2 text-sm text-neutral-600">
          {events.map((event) => (
            <li key={event.id} className="flex justify-between">
              <span>{event.eventType}</span>
              <span>{new Date(event.createdAt).toLocaleString('es-MX')}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
