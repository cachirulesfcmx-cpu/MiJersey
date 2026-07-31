'use client';

import type {
  CreatePromotionRuleInput,
  Promotion,
  PromotionDiscountType,
  PromotionRuleOperator,
  PromotionRuleType,
  PromotionType,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

const RULE_TYPE_OPTIONS: PromotionRuleType[] = [
  'MIN_CART_AMOUNT',
  'PRODUCT',
  'CATEGORY',
  'BRAND',
  'CUSTOMER',
];

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function emptyRule(): CreatePromotionRuleInput {
  return { ruleType: 'MIN_CART_AMOUNT', operator: 'GTE', value: '' };
}

/**
 * Promotion Manager (spec 024 §6): cupones manuales y descuentos automáticos, con reglas de
 * elegibilidad (mínimo de compra, producto, categoría, marca, cliente), prioridad y
 * compatibilidad. Un `MANUAL_COUPON` sin reglas se replica automáticamente en el `Coupon` mínimo
 * de Cart (017) — ver `docs/coupons-promotions.md`; con reglas, queda solo en este motor.
 */
export default function PromotionsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('admin:access');

  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Promotion | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<PromotionType>('MANUAL_COUPON');
  const [discountType, setDiscountType] = useState<PromotionDiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [priority, setPriority] = useState('0');
  const [stackable, setStackable] = useState(false);
  const [usageLimit, setUsageLimit] = useState('');
  const [rules, setRules] = useState<CreatePromotionRuleInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listPromotions(accessToken, { page, pageSize: PAGE_SIZE });
      setPromotions(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las promociones.',
      );
    }
  }, [client, accessToken, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setCode('');
    setType('MANUAL_COUPON');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setPriority('0');
    setStackable(false);
    setUsageLimit('');
    setRules([]);
  }

  function startEdit(promotion: Promotion) {
    setEditingId(promotion.id);
    setName(promotion.name);
    setCode(promotion.code ?? '');
    setType(promotion.type);
    setDiscountType(promotion.discountType);
    setDiscountValue(String(promotion.discountValue));
    setPriority(String(promotion.priority));
    setStackable(promotion.stackable);
    setUsageLimit(promotion.usageLimit !== null ? String(promotion.usageLimit) : '');
    setRules(
      promotion.rules.map((rule) => ({
        ruleType: rule.ruleType,
        operator: rule.operator,
        value: rule.value,
      })),
    );
  }

  function updateRule(index: number, patch: Partial<CreatePromotionRuleInput>) {
    setRules((current) => current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);

    const payload = {
      name,
      discountType,
      discountValue: Number(discountValue),
      priority: Number(priority),
      stackable,
      rules: rules.filter((rule) => rule.value.trim() !== ''),
      ...(code ? { code } : {}),
      ...(usageLimit ? { usageLimit: Number(usageLimit) } : {}),
    };

    try {
      if (editingId) {
        await client.updatePromotion(accessToken, editingId, payload);
      } else {
        await client.createPromotion(accessToken, { ...payload, type });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar la promoción.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(promotion: Promotion) {
    if (!accessToken) return;
    try {
      await client.updatePromotion(accessToken, promotion.id, {
        status: promotion.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar la promoción.');
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    try {
      await client.deletePromotion(accessToken, pendingDelete.id);
      setPendingDelete(null);
      if (editingId === pendingDelete.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la promoción.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Promociones</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {canManage && (
        <form
          className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <h2 className="text-sm font-semibold text-neutral-900">
            {editingId ? 'Editar promoción' : 'Crear promoción'}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField label="Nombre" htmlFor="promo-name">
              <Input
                id="promo-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Tipo" htmlFor="promo-type">
              <select
                id="promo-type"
                value={type}
                onChange={(event) => setType(event.target.value as PromotionType)}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                disabled={editingId !== null}
              >
                <option value="MANUAL_COUPON">Cupón manual (con código)</option>
                <option value="AUTOMATIC">Descuento automático</option>
              </select>
            </FormField>
            {type === 'MANUAL_COUPON' && (
              <FormField label="Código" htmlFor="promo-code">
                <Input
                  id="promo-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="VERANO10"
                />
              </FormField>
            )}
            <FormField label="Tipo de descuento" htmlFor="promo-discount-type">
              <select
                id="promo-discount-type"
                value={discountType}
                onChange={(event) => setDiscountType(event.target.value as PromotionDiscountType)}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
              </select>
            </FormField>
            <FormField label="Valor del descuento" htmlFor="promo-discount-value">
              <Input
                id="promo-discount-value"
                type="number"
                min={0}
                step="0.01"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Prioridad (menor = primero)" htmlFor="promo-priority">
              <Input
                id="promo-priority"
                type="number"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              />
            </FormField>
            <FormField label="Límite de usos (opcional)" htmlFor="promo-usage-limit">
              <Input
                id="promo-usage-limit"
                type="number"
                min={1}
                value={usageLimit}
                onChange={(event) => setUsageLimit(event.target.value)}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={stackable}
              onChange={(event) => setStackable(event.target.checked)}
            />
            Acumulable con otras promociones
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">
                Reglas de elegibilidad (opcional)
              </span>
              <button
                type="button"
                className="text-brand-600 text-xs hover:underline"
                onClick={() => setRules((current) => [...current, emptyRule()])}
              >
                + Agregar regla
              </button>
            </div>
            {rules.map((rule, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  value={rule.ruleType}
                  onChange={(event) =>
                    updateRule(index, { ruleType: event.target.value as PromotionRuleType })
                  }
                  className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
                >
                  {RULE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={rule.operator}
                  onChange={(event) =>
                    updateRule(index, { operator: event.target.value as PromotionRuleOperator })
                  }
                  className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
                >
                  <option value="GTE">≥</option>
                  <option value="IN">está en</option>
                </select>
                <Input
                  value={rule.value}
                  onChange={(event) => updateRule(index, { value: event.target.value })}
                  placeholder={rule.ruleType === 'MIN_CART_AMOUNT' ? '500' : 'id1, id2'}
                  className="flex-1"
                />
                <button
                  type="button"
                  className="text-danger-600 text-xs hover:underline"
                  onClick={() => setRules((current) => current.filter((_, i) => i !== index))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button type="submit" isLoading={isSaving} className="self-start">
              {editingId ? 'Guardar cambios' : 'Crear promoción'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="self-start">
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      <DataTable<Promotion>
        isLoading={!promotions}
        rows={promotions ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin promociones todavía"
        columns={[
          {
            key: 'name',
            header: 'Nombre',
            render: (row) => (
              <span>
                {row.name}
                {row.code && <span className="ml-2 text-xs text-neutral-400">({row.code})</span>}
              </span>
            ),
          },
          {
            key: 'type',
            header: 'Tipo',
            render: (row) => (row.type === 'MANUAL_COUPON' ? 'Cupón' : 'Automática'),
          },
          {
            key: 'discount',
            header: 'Descuento',
            render: (row) =>
              row.discountType === 'PERCENTAGE'
                ? `${row.discountValue}%`
                : formatPrice(row.discountValue),
          },
          { key: 'priority', header: 'Prioridad', render: (row) => row.priority },
          {
            key: 'stackable',
            header: 'Acumulable',
            render: (row) => (row.stackable ? 'Sí' : 'No'),
          },
          {
            key: 'usage',
            header: 'Usos',
            render: (row) =>
              `${row.usageCount}${row.usageLimit !== null ? ` / ${row.usageLimit}` : ''}`,
          },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => (row.status === 'ACTIVE' ? 'Activa' : 'Inactiva'),
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
                    onClick={() => startEdit(row)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-sm text-neutral-600 hover:underline"
                    onClick={() => void handleToggleStatus(row)}
                  >
                    {row.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
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

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar promoción"
        description={`"${pendingDelete?.name ?? ''}" dejará de estar disponible.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={false}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
