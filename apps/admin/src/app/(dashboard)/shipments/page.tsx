'use client';

import type { Carrier, Shipment, ShipmentStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const STATUS_OPTIONS: ShipmentStatus[] = ['IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'];

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: 'Guía generada',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
  RETURNED: 'Devuelto',
};

/**
 * Generación y seguimiento de envíos (spec 023 §7 "POST /shipping/shipments"). Igual que el
 * formulario de reembolsos de 022-Payments, pide el id del pedido directamente: todavía no hay
 * un buscador de pedidos "listos para enviar" en el Orders Dashboard — limitación conocida.
 */
export default function ShipmentsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [carriers, setCarriers] = useState<Carrier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastShipment, setLastShipment] = useState<Shipment | null>(null);

  const loadCarriers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listCarriers(accessToken);
      setCarriers(result.items.filter((carrier) => carrier.isActive));
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los transportistas.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadCarriers();
  }, [loadCarriers]);

  const [orderId, setOrderId] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [service, setService] = useState('Estándar');
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateShipment(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken || !carrierId) return;
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const shipment = await client.createShipment(accessToken, { orderId, carrierId, service });
      setLastShipment(shipment);
      setSuccessMessage(`Envío generado. Número de guía: ${shipment.trackingNumber}`);
      setOrderId('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo generar el envío.');
    } finally {
      setIsCreating(false);
    }
  }

  const [statusShipmentId, setStatusShipmentId] = useState('');
  const [status, setStatus] = useState<ShipmentStatus>('IN_TRANSIT');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleUpdateStatus(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await client.updateShipmentStatus(accessToken, statusShipmentId, {
        status,
        ...(note ? { note } : {}),
      });
      setLastShipment(updated);
      setSuccessMessage(`Envío actualizado a "${STATUS_LABELS[updated.status]}".`);
      setStatusShipmentId('');
      setNote('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el envío.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Envíos</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <form
        className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
        onSubmit={(event) => void handleCreateShipment(event)}
      >
        <h2 className="text-sm font-semibold text-neutral-900">Generar envío</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField label="Id del pedido" htmlFor="order-id">
            <Input
              id="order-id"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Transportista" htmlFor="shipment-carrier">
            <select
              id="shipment-carrier"
              value={carrierId}
              onChange={(event) => setCarrierId(event.target.value)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona</option>
              {(carriers ?? []).map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Servicio" htmlFor="service">
            <Input
              id="service"
              value={service}
              onChange={(event) => setService(event.target.value)}
              required
            />
          </FormField>
        </div>
        <Button type="submit" isLoading={isCreating} className="self-start">
          Generar envío
        </Button>
      </form>

      <form
        className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
        onSubmit={(event) => void handleUpdateStatus(event)}
      >
        <h2 className="text-sm font-semibold text-neutral-900">Actualizar estado de un envío</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField label="Id del envío" htmlFor="shipment-id">
            <Input
              id="shipment-id"
              value={statusShipmentId}
              onChange={(event) => setStatusShipmentId(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Nuevo estado" htmlFor="shipment-status">
            <select
              id="shipment-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ShipmentStatus)}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Nota (opcional)" htmlFor="shipment-note">
            <Input
              id="shipment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </FormField>
        </div>
        <Button type="submit" isLoading={isUpdating} className="self-start">
          Actualizar estado
        </Button>
      </form>

      {lastShipment && (
        <div className="rounded-md border border-neutral-200 p-4 text-sm">
          <h2 className="mb-2 font-semibold text-neutral-900">Último envío</h2>
          <dl className="grid grid-cols-2 gap-2 text-neutral-600">
            <dt>Id</dt>
            <dd>{lastShipment.id}</dd>
            <dt>Pedido</dt>
            <dd>{lastShipment.orderId}</dd>
            <dt>Guía</dt>
            <dd>{lastShipment.trackingNumber}</dd>
            <dt>Estado</dt>
            <dd>{STATUS_LABELS[lastShipment.status]}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
