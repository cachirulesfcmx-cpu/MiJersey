'use client';

import type {
  ApiClient,
  InventoryMovementType,
  Product,
  ProductVariant,
  Warehouse,
} from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { Button, Input } from '@mijersey/ui';
import { useState } from 'react';

interface AdjustInventoryFormProps {
  accessToken: string;
  client: ApiClient;
  warehouses: Warehouse[];
  onAdjusted: () => void;
}

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  INBOUND: 'Entrada',
  OUTBOUND: 'Salida',
  RESERVATION: 'Reserva',
  RELEASE: 'Liberación',
  ADJUSTMENT_POSITIVE: 'Ajuste positivo',
  ADJUSTMENT_NEGATIVE: 'Ajuste negativo',
  RETURN: 'Devolución',
};

const MANUAL_TYPES: InventoryMovementType[] = [
  'INBOUND',
  'OUTBOUND',
  'ADJUSTMENT_POSITIVE',
  'ADJUSTMENT_NEGATIVE',
  'RETURN',
];

export function AdjustInventoryForm({
  accessToken,
  client,
  warehouses,
  onAdjusted,
}: AdjustInventoryFormProps) {
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantId, setVariantId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState<InventoryMovementType>('INBOUND');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [allowNegative, setAllowNegative] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearchProducts() {
    if (!productQuery.trim()) return;
    setIsSearching(true);
    setError(null);

    try {
      const result = await client.listProducts(accessToken, { search: productQuery, pageSize: 10 });
      setProductResults(result.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron buscar productos.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setProductResults([]);
    setVariantId('');

    try {
      const result = await client.listProductVariants(accessToken, product.id, { pageSize: 100 });
      setVariants(result.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las variantes.',
      );
    }
  }

  async function handleSubmit() {
    if (!variantId || !warehouseId || !quantity) return;
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await client.adjustInventory(accessToken, {
        variantId,
        warehouseId,
        type,
        quantity: Number(quantity),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        allowNegative,
      });
      setMessage('Ajuste aplicado.');
      setQuantity('');
      setReason('');
      onAdjusted();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo aplicar el ajuste.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
      <h2 className="text-lg font-semibold text-neutral-900">Ajustar inventario</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {message && <p className="text-sm text-neutral-500">{message}</p>}

      <div className="flex items-center gap-2">
        <Input
          value={productQuery}
          placeholder="Buscar producto por nombre o SKU"
          onChange={(event) => setProductQuery(event.target.value)}
          className="flex-1"
        />
        <Button
          variant="secondary"
          isLoading={isSearching}
          onClick={() => void handleSearchProducts()}
        >
          Buscar
        </Button>
      </div>

      {productResults.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md border border-neutral-200 p-2">
          {productResults.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="text-brand-600 text-sm hover:underline"
                onClick={() => void handleSelectProduct(product)}
              >
                {product.sku} — {product.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedProduct && (
        <p className="text-sm text-neutral-500">
          Producto: <span className="text-neutral-900">{selectedProduct.name}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          disabled={variants.length === 0}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
        >
          <option value="">Selecciona una variante…</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.sku} — {variant.title}
            </option>
          ))}
        </select>

        <select
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un almacén…</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(event) => setType(event.target.value as InventoryMovementType)}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          {MANUAL_TYPES.map((value) => (
            <option key={value} value={value}>
              {TYPE_LABELS[value]}
            </option>
          ))}
        </select>

        <Input
          type="number"
          min={1}
          placeholder="Cantidad"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="w-28"
        />

        <Input
          placeholder="Motivo (opcional)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="w-48"
        />

        <label className="flex items-center gap-1 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={allowNegative}
            onChange={(event) => setAllowNegative(event.target.checked)}
          />
          Permitir negativo
        </label>

        <Button
          isLoading={isSubmitting}
          disabled={!variantId || !warehouseId || !quantity}
          onClick={() => void handleSubmit()}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
