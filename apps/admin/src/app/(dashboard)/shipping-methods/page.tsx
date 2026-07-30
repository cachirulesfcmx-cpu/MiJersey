'use client';

import type { ShippingMethod } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

export default function ShippingMethodsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [methods, setMethods] = useState<ShippingMethod[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [estimatedDaysMin, setEstimatedDaysMin] = useState('');
  const [estimatedDaysMax, setEstimatedDaysMax] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ShippingMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMethods = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listShippingMethods(accessToken);
      setMethods(result.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los métodos de envío.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsCreating(true);
    setError(null);

    try {
      await client.createShippingMethod(accessToken, {
        name,
        basePrice: Number(basePrice),
        estimatedDaysMin: Number(estimatedDaysMin),
        estimatedDaysMax: Number(estimatedDaysMax),
      });
      setName('');
      setBasePrice('');
      setEstimatedDaysMin('');
      setEstimatedDaysMax('');
      await loadMethods();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo crear el método de envío.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(method: ShippingMethod) {
    if (!accessToken) return;
    try {
      await client.updateShippingMethod(accessToken, method.id, { isActive: !method.isActive });
      await loadMethods();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el método.');
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);

    try {
      await client.deleteShippingMethod(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadMethods();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el método.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Métodos de envío</h1>
      <p className="max-w-2xl text-sm text-neutral-500">
        Tarifas planas mínimas para el checkout (018). Sin transportistas, zonas de cobertura ni
        cálculo por peso/dimensiones — eso llega con 023-Shipping.
      </p>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {canManage && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
          onSubmit={(event) => void handleCreate(event)}
        >
          <FormField label="Nombre" htmlFor="name">
            <Input
              id="name"
              placeholder="Envío estándar"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Precio" htmlFor="basePrice">
            <Input
              id="basePrice"
              type="number"
              min={0}
              step="0.01"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Días mín." htmlFor="estimatedDaysMin">
            <Input
              id="estimatedDaysMin"
              type="number"
              min={0}
              value={estimatedDaysMin}
              onChange={(event) => setEstimatedDaysMin(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Días máx." htmlFor="estimatedDaysMax">
            <Input
              id="estimatedDaysMax"
              type="number"
              min={0}
              value={estimatedDaysMax}
              onChange={(event) => setEstimatedDaysMax(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit" isLoading={isCreating}>
            Crear método
          </Button>
        </form>
      )}

      <DataTable<ShippingMethod>
        isLoading={!methods}
        rows={methods ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin métodos de envío todavía"
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          {
            key: 'basePrice',
            header: 'Precio',
            render: (row) =>
              row.basePrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
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
                    onClick={() => void handleToggleActive(row)}
                  >
                    {row.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    className="text-danger-600 text-sm hover:underline"
                    onClick={() => setPendingDelete(row)}
                  >
                    Eliminar
                  </button>
                </div>
              ) : null,
          },
        ]}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar método de envío"
        description={`"${pendingDelete?.name ?? ''}" dejará de estar disponible en el checkout.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
