'use client';

import type { ApiClient, ProductOption, ProductVariant, ProductVariantStatus } from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, Input, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface VariantsManagerProps {
  productId: string;
  accessToken: string;
  client: ApiClient;
  canManage: boolean;
  optionsVersion: number;
}

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<ProductVariantStatus, string> = {
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

function combinationLabel(variant: ProductVariant, options: ProductOption[]): string {
  const labels = options
    .map((option) => {
      const value = option.values.find((candidate) =>
        variant.optionValueIds.includes(candidate.id),
      );
      return value ? `${option.name}: ${value.value}` : null;
    })
    .filter((label): label is string => label !== null);

  return labels.length > 0 ? labels.join(', ') : 'Por defecto';
}

export function VariantsManager({
  productId,
  accessToken,
  client,
  canManage,
  optionsVersion,
}: VariantsManagerProps) {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProductVariantStatus | ''>('');
  const [error, setError] = useState<string | null>(null);

  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<ProductVariant | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [basePrice, setBasePrice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);

  const loadVariants = useCallback(async () => {
    try {
      const result = await client.listProductVariants(accessToken, productId, {
        page,
        pageSize: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setVariants(result.items);
      setTotal(result.total);
      setPriceDrafts(Object.fromEntries(result.items.map((item) => [item.id, String(item.price)])));
      setSelectedIds(new Set());
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las variantes.',
      );
    }
  }, [client, accessToken, productId, page, statusFilter]);

  useEffect(() => {
    client
      .getProductOptions(accessToken, productId)
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [client, accessToken, productId, optionsVersion]);

  useEffect(() => {
    void loadVariants();
  }, [loadVariants]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function handleGenerate() {
    setError(null);
    setGenerateResult(null);
    setIsGenerating(true);

    try {
      const result = await client.generateVariants(accessToken, productId, {
        ...(basePrice.trim() ? { basePrice: Number(basePrice) } : {}),
      });
      setGenerateResult(`Creadas: ${result.created}. Ya existían: ${result.skippedExisting}.`);
      await loadVariants();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron generar las variantes.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSavePrice(variant: ProductVariant) {
    const draft = priceDrafts[variant.id];
    const nextPrice = Number(draft);

    if (!draft || Number.isNaN(nextPrice) || nextPrice === variant.price) return;

    setSavingId(variant.id);

    try {
      await client.updateProductVariant(accessToken, variant.id, { price: nextPrice });
      await loadVariants();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el precio.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleStatus(variant: ProductVariant) {
    setSavingId(variant.id);

    try {
      await client.updateProductVariant(accessToken, variant.id, {
        status: variant.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE',
      });
      await loadVariants();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleBulkStatus(status: ProductVariantStatus) {
    if (selectedIds.size === 0) return;

    try {
      await client.bulkUpdateVariants(accessToken, { ids: [...selectedIds], status });
      await loadVariants();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar en lote.');
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsConfirming(true);

    try {
      await client.deleteProductVariant(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadVariants();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la variante.');
    } finally {
      setIsConfirming(false);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === (variants?.length ?? 0) ? new Set() : new Set(variants?.map((v) => v.id)),
    );
  }

  const columns = useMemo(
    () => [
      ...(canManage
        ? [
            {
              key: 'select',
              header: (
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas"
                  checked={selectedIds.size > 0 && selectedIds.size === (variants?.length ?? 0)}
                  onChange={toggleSelectAll}
                />
              ),
              render: (row: ProductVariant) => (
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${row.title}`}
                  checked={selectedIds.has(row.id)}
                  onChange={() => toggleSelected(row.id)}
                />
              ),
            },
          ]
        : []),
      { key: 'sku', header: 'SKU', render: (row: ProductVariant) => row.sku },
      {
        key: 'combination',
        header: 'Combinación',
        render: (row: ProductVariant) => combinationLabel(row, options),
      },
      {
        key: 'price',
        header: 'Precio',
        render: (row: ProductVariant) =>
          canManage ? (
            <Input
              type="number"
              step="0.01"
              className="w-24"
              value={priceDrafts[row.id] ?? ''}
              onChange={(event) =>
                setPriceDrafts((prev) => ({ ...prev, [row.id]: event.target.value }))
              }
              onBlur={() => void handleSavePrice(row)}
              disabled={savingId === row.id}
            />
          ) : (
            row.price.toFixed(2)
          ),
      },
      {
        key: 'status',
        header: 'Estado',
        render: (row: ProductVariant) =>
          canManage ? (
            <button
              type="button"
              className="text-brand-600 text-sm hover:underline"
              disabled={savingId === row.id}
              onClick={() => void handleToggleStatus(row)}
            >
              {STATUS_LABELS[row.status]}
            </button>
          ) : (
            STATUS_LABELS[row.status]
          ),
      },
      {
        key: 'actions',
        header: '',
        render: (row: ProductVariant) =>
          canManage ? (
            <button
              type="button"
              className="text-danger-600 text-sm hover:underline"
              onClick={() => setPendingDelete(row)}
            >
              Eliminar
            </button>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, selectedIds, variants, options, priceDrafts, savingId],
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-neutral-900">Variantes</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {canManage && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder="Precio base (opcional)"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            className="w-48"
          />
          <Button isLoading={isGenerating} onClick={() => void handleGenerate()}>
            Generar variantes
          </Button>
          {generateResult && <span className="text-sm text-neutral-500">{generateResult}</span>}
        </div>
      )}

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as ProductVariantStatus | '')}
        className="w-48 rounded-md border border-neutral-200 px-3 py-2 text-sm"
      >
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {canManage && selectedIds.size > 0 && (
        <div className="bg-brand-50 flex items-center gap-3 rounded-md px-4 py-2 text-sm">
          <span>{selectedIds.size} seleccionadas</span>
          <Button variant="secondary" onClick={() => void handleBulkStatus('ACTIVE')}>
            Publicar
          </Button>
          <Button variant="secondary" onClick={() => void handleBulkStatus('ARCHIVED')}>
            Archivar
          </Button>
        </div>
      )}

      <DataTable<ProductVariant>
        isLoading={!variants}
        rows={variants ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin variantes todavía"
        emptyDescription="Define opciones y genera variantes, o crea una manualmente."
        columns={columns}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar variante"
        description={`"${pendingDelete?.title ?? ''}" se eliminará del catálogo.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
