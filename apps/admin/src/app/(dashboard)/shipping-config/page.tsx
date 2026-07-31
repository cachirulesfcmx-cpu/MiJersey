'use client';

import type { Carrier, ShippingRate, ShippingZone } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/**
 * Shipping Configuration (spec 023 §6): transportistas, zonas de cobertura y tarifas — los tres
 * niveles que alimenta el motor de cálculo de `POST /shipping/rates`. No sustituye "Métodos de
 * envío" (018): esa pantalla sigue gestionando la tarifa plana mínima de Checkout; esta gestiona
 * el motor real por zona + peso de 023.
 */
export default function ShippingConfigurationPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('admin:access');

  const [carriers, setCarriers] = useState<Carrier[] | null>(null);
  const [zones, setZones] = useState<ShippingZone[] | null>(null);
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [carrierResult, zoneResult, rateResult] = await Promise.all([
        client.listCarriers(accessToken),
        client.listShippingZones(accessToken),
        client.listShippingRates(accessToken),
      ]);
      setCarriers(carrierResult.items);
      setZones(zoneResult.items);
      setRates(rateResult.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la configuración.');
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const carrierById = useMemo(() => new Map((carriers ?? []).map((c) => [c.id, c])), [carriers]);
  const zoneById = useMemo(() => new Map((zones ?? []).map((z) => [z.id, z])), [zones]);

  // --- Carriers ---
  const [carrierName, setCarrierName] = useState('');
  const [carrierCode, setCarrierCode] = useState('');
  const [isCreatingCarrier, setIsCreatingCarrier] = useState(false);
  const [pendingDeleteCarrier, setPendingDeleteCarrier] = useState<Carrier | null>(null);

  async function handleCreateCarrier(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsCreatingCarrier(true);
    setError(null);
    try {
      await client.createCarrier(accessToken, { name: carrierName, code: carrierCode });
      setCarrierName('');
      setCarrierCode('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el transportista.');
    } finally {
      setIsCreatingCarrier(false);
    }
  }

  async function handleToggleCarrier(carrier: Carrier) {
    if (!accessToken) return;
    try {
      await client.updateCarrier(accessToken, carrier.id, { isActive: !carrier.isActive });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo actualizar el transportista.',
      );
    }
  }

  async function handleDeleteCarrier() {
    if (!accessToken || !pendingDeleteCarrier) return;
    try {
      await client.deleteCarrier(accessToken, pendingDeleteCarrier.id);
      setPendingDeleteCarrier(null);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo eliminar el transportista.',
      );
    }
  }

  // --- Zones ---
  const [zoneName, setZoneName] = useState('');
  const [zoneCountries, setZoneCountries] = useState('MX');
  const [zoneStates, setZoneStates] = useState('');
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [pendingDeleteZone, setPendingDeleteZone] = useState<ShippingZone | null>(null);

  async function handleCreateZone(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsCreatingZone(true);
    setError(null);
    try {
      await client.createShippingZone(accessToken, {
        name: zoneName,
        countries: zoneCountries
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean),
        states: zoneStates
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setZoneName('');
      setZoneCountries('MX');
      setZoneStates('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la zona.');
    } finally {
      setIsCreatingZone(false);
    }
  }

  async function handleDeleteZone() {
    if (!accessToken || !pendingDeleteZone) return;
    try {
      await client.deleteShippingZone(accessToken, pendingDeleteZone.id);
      setPendingDeleteZone(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la zona.');
    }
  }

  // --- Rates ---
  const [rateCarrierId, setRateCarrierId] = useState('');
  const [rateZoneId, setRateZoneId] = useState('');
  const [rateName, setRateName] = useState('');
  const [rateBasePrice, setRateBasePrice] = useState('');
  const [ratePricePerKg, setRatePricePerKg] = useState('0');
  const [rateEstimatedDaysMin, setRateEstimatedDaysMin] = useState('');
  const [rateEstimatedDaysMax, setRateEstimatedDaysMax] = useState('');
  const [isCreatingRate, setIsCreatingRate] = useState(false);
  const [pendingDeleteRate, setPendingDeleteRate] = useState<ShippingRate | null>(null);

  async function handleCreateRate(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken || !rateCarrierId || !rateZoneId) return;
    setIsCreatingRate(true);
    setError(null);
    try {
      await client.createShippingRate(accessToken, {
        carrierId: rateCarrierId,
        zoneId: rateZoneId,
        name: rateName,
        basePrice: Number(rateBasePrice),
        pricePerKg: Number(ratePricePerKg),
        estimatedDaysMin: Number(rateEstimatedDaysMin),
        estimatedDaysMax: Number(rateEstimatedDaysMax),
      });
      setRateName('');
      setRateBasePrice('');
      setRatePricePerKg('0');
      setRateEstimatedDaysMin('');
      setRateEstimatedDaysMax('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la tarifa.');
    } finally {
      setIsCreatingRate(false);
    }
  }

  async function handleToggleRate(rate: ShippingRate) {
    if (!accessToken) return;
    try {
      await client.updateShippingRate(accessToken, rate.id, { isActive: !rate.isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar la tarifa.');
    }
  }

  async function handleDeleteRate() {
    if (!accessToken || !pendingDeleteRate) return;
    try {
      await client.deleteShippingRate(accessToken, pendingDeleteRate.id);
      setPendingDeleteRate(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la tarifa.');
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Configuración de envíos</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Transportistas, zonas de cobertura y tarifas — el motor de cálculo real por destino y peso
          (023). No sustituye la tarifa plana mínima de &ldquo;Métodos de envío&rdquo; (018).
        </p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Transportistas</h2>
        {canManage && (
          <form
            className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
            onSubmit={(event) => void handleCreateCarrier(event)}
          >
            <FormField label="Nombre" htmlFor="carrier-name">
              <Input
                id="carrier-name"
                placeholder="Reparto propio"
                value={carrierName}
                onChange={(event) => setCarrierName(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Código" htmlFor="carrier-code">
              <Input
                id="carrier-code"
                placeholder="MANUAL"
                value={carrierCode}
                onChange={(event) => setCarrierCode(event.target.value)}
                required
              />
            </FormField>
            <Button type="submit" isLoading={isCreatingCarrier}>
              Crear transportista
            </Button>
          </form>
        )}
        <DataTable<Carrier>
          isLoading={!carriers}
          rows={carriers ?? []}
          getRowKey={(row) => row.id}
          emptyTitle="Sin transportistas todavía"
          columns={[
            { key: 'name', header: 'Nombre', render: (row) => row.name },
            { key: 'code', header: 'Código', render: (row) => row.code },
            {
              key: 'isActive',
              header: 'Estado',
              render: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                canManage ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-sm text-neutral-600 hover:underline"
                      onClick={() => void handleToggleCarrier(row)}
                    >
                      {row.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="text-danger-600 text-sm hover:underline"
                      onClick={() => setPendingDeleteCarrier(row)}
                    >
                      Eliminar
                    </button>
                  </div>
                ) : null,
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Zonas de cobertura</h2>
        {canManage && (
          <form
            className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
            onSubmit={(event) => void handleCreateZone(event)}
          >
            <FormField label="Nombre" htmlFor="zone-name">
              <Input
                id="zone-name"
                placeholder="México"
                value={zoneName}
                onChange={(event) => setZoneName(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Países (código ISO, separados por coma)" htmlFor="zone-countries">
              <Input
                id="zone-countries"
                placeholder="MX"
                value={zoneCountries}
                onChange={(event) => setZoneCountries(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Estados (opcional, vacío = todo el país)" htmlFor="zone-states">
              <Input
                id="zone-states"
                placeholder="CDMX, JAL"
                value={zoneStates}
                onChange={(event) => setZoneStates(event.target.value)}
              />
            </FormField>
            <Button type="submit" isLoading={isCreatingZone}>
              Crear zona
            </Button>
          </form>
        )}
        <DataTable<ShippingZone>
          isLoading={!zones}
          rows={zones ?? []}
          getRowKey={(row) => row.id}
          emptyTitle="Sin zonas todavía"
          columns={[
            { key: 'name', header: 'Nombre', render: (row) => row.name },
            { key: 'countries', header: 'Países', render: (row) => row.countries.join(', ') },
            {
              key: 'states',
              header: 'Estados',
              render: (row) => (row.states.length > 0 ? row.states.join(', ') : 'Todo el país'),
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                canManage ? (
                  <button
                    type="button"
                    className="text-danger-600 text-sm hover:underline"
                    onClick={() => setPendingDeleteZone(row)}
                  >
                    Eliminar
                  </button>
                ) : null,
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Tarifas</h2>
        {canManage && (
          <form
            className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
            onSubmit={(event) => void handleCreateRate(event)}
          >
            <FormField label="Transportista" htmlFor="rate-carrier">
              <select
                id="rate-carrier"
                value={rateCarrierId}
                onChange={(event) => setRateCarrierId(event.target.value)}
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
            <FormField label="Zona" htmlFor="rate-zone">
              <select
                id="rate-zone"
                value={rateZoneId}
                onChange={(event) => setRateZoneId(event.target.value)}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona</option>
                {(zones ?? []).map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Nombre" htmlFor="rate-name">
              <Input
                id="rate-name"
                placeholder="Estándar"
                value={rateName}
                onChange={(event) => setRateName(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Precio base" htmlFor="rate-base-price">
              <Input
                id="rate-base-price"
                type="number"
                min={0}
                step="0.01"
                value={rateBasePrice}
                onChange={(event) => setRateBasePrice(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Precio por kg" htmlFor="rate-price-per-kg">
              <Input
                id="rate-price-per-kg"
                type="number"
                min={0}
                step="0.01"
                value={ratePricePerKg}
                onChange={(event) => setRatePricePerKg(event.target.value)}
              />
            </FormField>
            <FormField label="Días mín." htmlFor="rate-days-min">
              <Input
                id="rate-days-min"
                type="number"
                min={0}
                value={rateEstimatedDaysMin}
                onChange={(event) => setRateEstimatedDaysMin(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Días máx." htmlFor="rate-days-max">
              <Input
                id="rate-days-max"
                type="number"
                min={0}
                value={rateEstimatedDaysMax}
                onChange={(event) => setRateEstimatedDaysMax(event.target.value)}
                required
              />
            </FormField>
            <Button type="submit" isLoading={isCreatingRate}>
              Crear tarifa
            </Button>
          </form>
        )}
        <DataTable<ShippingRate>
          isLoading={!rates}
          rows={rates ?? []}
          getRowKey={(row) => row.id}
          emptyTitle="Sin tarifas todavía"
          columns={[
            { key: 'name', header: 'Nombre', render: (row) => row.name },
            {
              key: 'carrier',
              header: 'Transportista',
              render: (row) => carrierById.get(row.carrierId)?.name ?? '—',
            },
            { key: 'zone', header: 'Zona', render: (row) => zoneById.get(row.zoneId)?.name ?? '—' },
            {
              key: 'price',
              header: 'Precio',
              render: (row) => `${formatPrice(row.basePrice)} + ${formatPrice(row.pricePerKg)}/kg`,
            },
            {
              key: 'estimatedDays',
              header: 'Entrega estimada',
              render: (row) => `${row.estimatedDaysMin}-${row.estimatedDaysMax} días`,
            },
            {
              key: 'isActive',
              header: 'Estado',
              render: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                canManage ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-sm text-neutral-600 hover:underline"
                      onClick={() => void handleToggleRate(row)}
                    >
                      {row.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="text-danger-600 text-sm hover:underline"
                      onClick={() => setPendingDeleteRate(row)}
                    >
                      Eliminar
                    </button>
                  </div>
                ) : null,
            },
          ]}
        />
      </section>

      <ConfirmDialog
        isOpen={pendingDeleteCarrier !== null}
        title="Eliminar transportista"
        description={`"${pendingDeleteCarrier?.name ?? ''}" dejará de estar disponible para nuevas tarifas.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={false}
        onConfirm={() => void handleDeleteCarrier()}
        onCancel={() => setPendingDeleteCarrier(null)}
      />
      <ConfirmDialog
        isOpen={pendingDeleteZone !== null}
        title="Eliminar zona"
        description={`"${pendingDeleteZone?.name ?? ''}" dejará de coincidir con destinos.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={false}
        onConfirm={() => void handleDeleteZone()}
        onCancel={() => setPendingDeleteZone(null)}
      />
      <ConfirmDialog
        isOpen={pendingDeleteRate !== null}
        title="Eliminar tarifa"
        description={`"${pendingDeleteRate?.name ?? ''}" dejará de aparecer en las cotizaciones.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={false}
        onConfirm={() => void handleDeleteRate()}
        onCancel={() => setPendingDeleteRate(null)}
      />
    </div>
  );
}
