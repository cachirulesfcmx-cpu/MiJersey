'use client';

import type {
  CollectionRuleMatchType,
  CollectionRuleValue,
  CollectionStatus,
  CollectionWithProducts,
  Product,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { RuleBuilder } from '../RuleBuilder';

const PRODUCTS_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export default function EditCollectionPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [collection, setCollection] = useState<CollectionWithProducts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CollectionStatus>('ACTIVE');
  const [isSavingBasics, setIsSavingBasics] = useState(false);

  const [matchType, setMatchType] = useState<CollectionRuleMatchType>('ALL');
  const [rules, setRules] = useState<CollectionRuleValue[]>([]);
  const [isSavingRules, setIsSavingRules] = useState(false);

  const [productSearchInput, setProductSearchInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;

    try {
      const loaded = await client.getCollection(accessToken, params.id, {
        pageSize: PRODUCTS_PAGE_SIZE,
      });
      setCollection(loaded);
      setName(loaded.name);
      setSlug(loaded.slug);
      setDescription(loaded.description ?? '');
      setStatus(loaded.status);
      setMatchType(loaded.matchType);
      setRules(loaded.rules.map(({ field, operator, value }) => ({ field, operator, value })));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la colección.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timeout = setTimeout(() => setProductSearch(productSearchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [productSearchInput]);

  useEffect(() => {
    if (!accessToken || !productSearch) {
      setSearchResults([]);
      return;
    }
    client
      .listProducts(accessToken, { search: productSearch, pageSize: 5 })
      .then((result) => setSearchResults(result.items))
      .catch(() => setSearchResults([]));
  }, [client, accessToken, productSearch]);

  async function handleSaveBasics() {
    if (!accessToken) return;
    setIsSavingBasics(true);
    setError(null);

    try {
      await client.updateCollection(accessToken, params.id, { name, slug, description, status });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar la colección.');
    } finally {
      setIsSavingBasics(false);
    }
  }

  async function handleSaveRules() {
    if (!accessToken) return;
    setIsSavingRules(true);
    setError(null);

    try {
      await client.updateCollectionRules(accessToken, params.id, matchType, rules);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron guardar las reglas.');
    } finally {
      setIsSavingRules(false);
    }
  }

  async function handleAddProduct(productId: string) {
    if (!accessToken) return;
    await client.addProductsToCollection(accessToken, params.id, [productId]);
    setProductSearchInput('');
    await load();
  }

  async function handleRemoveProduct(productId: string) {
    if (!accessToken) return;
    await client.removeProductFromCollection(accessToken, params.id, productId);
    await load();
  }

  async function handleReorderProduct(index: number, direction: -1 | 1) {
    if (!accessToken || !collection) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= collection.products.length) return;

    const orderedIds = collection.products.map((product) => product.id);
    const swap = orderedIds[index]!;
    orderedIds[index] = orderedIds[newIndex]!;
    orderedIds[newIndex] = swap;

    await client.reorderCollectionProducts(accessToken, params.id, orderedIds);
    await load();
  }

  if (!collection) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Editar colección</h1>
        {error && <p className="text-danger-600 text-sm">{error}</p>}
        {!error && <p className="text-sm text-neutral-500">Cargando…</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Editar colección · {collection.type === 'MANUAL' ? 'Manual' : 'Inteligente'}
      </h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="flex max-w-xl flex-col gap-4">
        <FormField label="Nombre" htmlFor="name">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="Slug" htmlFor="slug">
          <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
        </FormField>
        <FormField label="Descripción" htmlFor="description">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        <FormField label="Estado" htmlFor="status">
          <select
            id="status"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as CollectionStatus)}
          >
            <option value="ACTIVE">Activa</option>
            <option value="HIDDEN">Oculta</option>
          </select>
        </FormField>
        <div className="flex justify-end">
          <Button onClick={() => void handleSaveBasics()} isLoading={isSavingBasics}>
            Guardar datos básicos
          </Button>
        </div>
      </div>

      {collection.type === 'SMART' ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">Reglas</h2>
          <RuleBuilder
            matchType={matchType}
            rules={rules}
            onChange={(nextMatchType, nextRules) => {
              setMatchType(nextMatchType);
              setRules(nextRules);
            }}
          />
          <div className="flex justify-end">
            <Button onClick={() => void handleSaveRules()} isLoading={isSavingRules}>
              Guardar reglas
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-neutral-900">
            Productos que cumplen las reglas ({collection.total})
          </h2>
          <ul className="divide-y divide-neutral-100 rounded-md border border-neutral-200">
            {collection.products.map((product) => (
              <li key={product.id} className="px-4 py-2 text-sm">
                {product.name} · {product.sku}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">Productos ({collection.total})</h2>

          <div className="relative max-w-md">
            <input
              type="search"
              placeholder="Buscar producto por nombre, SKU o slug"
              value={productSearchInput}
              onChange={(event) => setProductSearchInput(event.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-sm">
                {searchResults.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
                      onClick={() => void handleAddProduct(product.id)}
                    >
                      <span>
                        {product.name} · {product.sku}
                      </span>
                      <span className="text-brand-600">Agregar</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ul className="divide-y divide-neutral-100 rounded-md border border-neutral-200">
            {collection.products.map((product, index) => (
              <li key={product.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>
                  {product.name} · {product.sku}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={index === 0}
                    className="disabled:opacity-30"
                    onClick={() => void handleReorderProduct(index, -1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === collection.products.length - 1}
                    className="disabled:opacity-30"
                    onClick={() => void handleReorderProduct(index, 1)}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="text-danger-600 hover:underline"
                    onClick={() => void handleRemoveProduct(product.id)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
