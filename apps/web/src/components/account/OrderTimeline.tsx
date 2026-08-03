import type { OrderTimelineEvent } from '@mijersey/sdk';

const LABELS: Record<string, string> = {
  status_CONFIRMED: 'Pedido confirmado',
  status_CANCELLED: 'Pedido cancelado',
  paymentStatus_PAID: 'Pago recibido',
  paymentStatus_FAILED: 'Pago fallido',
  fulfillmentStatus_PROCESSING: 'En preparación',
  fulfillmentStatus_SHIPPED: 'Enviado',
  fulfillmentStatus_DELIVERED: 'Entregado',
};

function labelFor(event: OrderTimelineEvent): string {
  return LABELS[`${event.field}_${event.value}`] ?? `${event.field}: ${event.value}`;
}

/** Order Timeline (spec 021 §6) — el primer evento ("Pedido confirmado") lo sintetiza el backend a partir de `createdAt`; los siguientes vienen de `OrderStatusHistory` (cancelación, y en el futuro pago/envío). */
export function OrderTimeline({ events }: { events: OrderTimelineEvent[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {events.map((event, index) => (
        <li key={`${event.field}-${event.occurredAt}-${index}`} className="flex gap-3 text-sm">
          <span className="bg-pop-500 mt-1.5 h-2 w-2 shrink-0 rounded-full" />
          <div>
            <p className="font-medium text-neutral-900">{labelFor(event)}</p>
            <p className="text-xs text-neutral-500">
              {new Date(event.occurredAt).toLocaleString('es-MX')}
            </p>
            {event.note && <p className="text-xs text-neutral-500">{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
