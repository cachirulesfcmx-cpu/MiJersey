'use client';

import type { Coupon, CouponType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

export default function CouponsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCoupons = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listCoupons(accessToken);
      setCoupons(result.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los cupones.');
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsCreating(true);
    setError(null);

    try {
      await client.createCoupon(accessToken, {
        code,
        type,
        value: Number(value),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      setCode('');
      setValue('');
      setExpiresAt('');
      await loadCoupons();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el cupón.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    if (!accessToken) return;
    try {
      await client.updateCoupon(accessToken, coupon.id, { isActive: !coupon.isActive });
      await loadCoupons();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el cupón.');
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);

    try {
      await client.deleteCoupon(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el cupón.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Cupones</h1>
      <p className="max-w-2xl text-sm text-neutral-500">
        Cupones mínimos para el carrito (017). Un motor de promociones completo (reglas,
        apilamiento, límites de uso) llega con 024-Coupons-Promotions.
      </p>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {canManage && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
          onSubmit={(event) => void handleCreate(event)}
        >
          <FormField label="Código" htmlFor="code">
            <Input
              id="code"
              placeholder="PROMO10"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Tipo" htmlFor="type">
            <select
              id="type"
              className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as CouponType)}
            >
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED">Monto fijo</option>
            </select>
          </FormField>
          <FormField label={type === 'PERCENTAGE' ? 'Valor (%)' : 'Valor'} htmlFor="value">
            <Input
              id="value"
              type="number"
              min={0}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Expira (opcional)" htmlFor="expiresAt">
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </FormField>
          <Button type="submit" isLoading={isCreating}>
            Crear cupón
          </Button>
        </form>
      )}

      <DataTable<Coupon>
        isLoading={!coupons}
        rows={coupons ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin cupones todavía"
        columns={[
          { key: 'code', header: 'Código', render: (row) => row.code },
          {
            key: 'type',
            header: 'Tipo',
            render: (row) => (row.type === 'PERCENTAGE' ? `${row.value}%` : row.value),
          },
          {
            key: 'isActive',
            header: 'Estado',
            render: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
          },
          {
            key: 'expiresAt',
            header: 'Expira',
            render: (row) => (row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '—'),
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
        title="Eliminar cupón"
        description={`"${pendingDelete?.code ?? ''}" dejará de poder aplicarse.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
