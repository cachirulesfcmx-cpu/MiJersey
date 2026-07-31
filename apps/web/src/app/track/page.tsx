'use client';

import type { Shipment, ShipmentEvent, ShipmentStatus as ShipmentStatusValue } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useMemo, useState } from 'react';

import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { env } from '../../config/env';

const STATUS_LABELS: Record<ShipmentStatusValue, string> = {
  LABEL_CREATED: 'Guía generada',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  FAILED: 'Envío fallido',
  RETURNED: 'Devuelto',
};

/** Shipment Tracking (spec 023 §6), independiente de sesión — cualquiera con el número de guía puede consultarlo (`GET /shipping/track/:trackingNumber`, público). */
export default function TrackShipmentPage() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setShipment(null);
    try {
      const result = await client.trackShipment(trackingNumber.trim());
      setShipment(result.shipment);
      setEvents(result.events);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se encontró ese número de guía.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Rastrear envío' }]} />
      <h1 className="text-2xl font-semibold text-neutral-900">Rastrear envío</h1>

      <form className="flex gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <input
          type="text"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="Número de guía (ej. MJ-ABC12345)"
          required
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-300"
        >
          {isLoading ? 'Buscando…' : 'Rastrear'}
        </button>
      </form>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {shipment && (
        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                shipment.status === 'DELIVERED' ? 'bg-success-600' : 'bg-brand-500'
              }`}
            />
            <span className="font-medium text-neutral-900">{STATUS_LABELS[shipment.status]}</span>
          </div>
          {events.length > 0 && (
            <ol className="flex flex-col gap-1 border-t border-neutral-200 pt-2 text-sm text-neutral-600">
              {events.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.eventType}</span>
                  <span>{new Date(item.createdAt).toLocaleString('es-MX')}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </main>
  );
}
