'use client';

import type { BrandProductSummary, Product } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 10;

interface BrandProductsPanelProps {
  brandId: string;
  accessToken: string;
  client: ApiClient;
  canManage: boolean;
}

export function BrandProductsPanel({
  brandId,
  accessToken,
  client,
  canManage,
}: BrandProductsPanelProps) {
  const [items, setItems] = useState<BrandProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const result = await client.listBrandProducts(accessToken, brandId, {
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los productos.',
      );
    }
  }, [client, accessToken, brandId, page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      setIsSearching(true);
      client
        .listProducts(accessToken, { search: searchInput, pageSize: 8 })
        .then((result) => setSearchResults(result.items))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [client, accessToken, searchInput]);

  async function handleAdd(productId: string) {
    try {
      await client.assignProductsToBrand(accessToken, brandId, [productId]);
      setSearchInput('');
      setSearchResults([]);
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo asignar el producto.');
    }
  }

  async function handleRemove(productId: string) {
    try {
      await client.removeProductFromBrand(accessToken, brandId, productId);
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo quitar el producto.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-neutral-900">Productos de la marca</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {canManage && (
        <div className="relative max-w-md">
          <input
            type="search"
            placeholder="Buscar producto por nombre o SKU para asignar"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          {searchInput.trim() && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-sm">
              {isSearching && <p className="p-2 text-xs text-neutral-400">Buscando…</p>}
              {!isSearching && searchResults.length === 0 && (
                <p className="p-2 text-xs text-neutral-400">Sin resultados.</p>
              )}
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => void handleAdd(product.id)}
                >
                  <span>{product.name}</span>
                  <span className="text-xs text-neutral-400">{product.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2">Producto</th>
            <th className="py-2">SKU</th>
            <th className="py-2">Estado</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-neutral-400">
                Sin productos asignados.
              </td>
            </tr>
          )}
          {items.map((product) => (
            <tr key={product.id} className="border-b border-neutral-100">
              <td className="py-2">{product.name}</td>
              <td className="py-2 text-neutral-500">{product.sku}</td>
              <td className="py-2 text-neutral-500">{product.status}</td>
              <td className="py-2 text-right">
                {canManage && (
                  <button
                    type="button"
                    className="text-danger-600 text-xs hover:underline"
                    onClick={() => void handleRemove(product.id)}
                  >
                    Quitar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
