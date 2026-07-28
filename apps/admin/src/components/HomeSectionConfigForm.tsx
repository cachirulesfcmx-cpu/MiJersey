'use client';

import type { ApiClient, CategoryTreeNode, HomeSectionType } from '@mijersey/sdk';
import { useCallback } from 'react';

import { EntityMultiPicker } from './EntityMultiPicker';
import { MediaPicker } from './MediaPicker';

interface HomeSectionConfigFormProps {
  type: HomeSectionType;
  configuration: Record<string, unknown>;
  onChange: (configuration: Record<string, unknown>) => void;
  accessToken: string;
  client: ApiClient;
}

function flattenCategories(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children)]);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

const textInputClass = 'w-full rounded-md border border-neutral-200 px-3 py-2 text-sm';

export function HomeSectionConfigForm({
  type,
  configuration,
  onChange,
  accessToken,
  client,
}: HomeSectionConfigFormProps) {
  const set = useCallback(
    (patch: Record<string, unknown>) => onChange({ ...configuration, ...patch }),
    [configuration, onChange],
  );

  const searchProducts = useCallback(
    async (query: string) => {
      const result = await client.listProducts(accessToken, { search: query, pageSize: 10 });
      return result.items.map((product) => ({
        id: product.id,
        label: `${product.name} (${product.sku})`,
      }));
    },
    [client, accessToken],
  );

  const searchCollections = useCallback(
    async (query: string) => {
      const result = await client.listCollections(accessToken, { search: query, pageSize: 10 });
      return result.items.map((collection) => ({ id: collection.id, label: collection.name }));
    },
    [client, accessToken],
  );

  const searchBrands = useCallback(
    async (query: string) => {
      const result = await client.listBrands(accessToken, { search: query, pageSize: 10 });
      return result.items.map((brand) => ({ id: brand.id, label: brand.name }));
    },
    [client, accessToken],
  );

  const searchCategories = useCallback(
    async (query: string) => {
      const tree = await client.getCategoryTree(accessToken);
      const flat = flattenCategories(tree);
      const lower = query.trim().toLowerCase();
      const matches = lower ? flat.filter((c) => c.name.toLowerCase().includes(lower)) : flat;
      return matches.slice(0, 20).map((c) => ({ id: c.id, label: c.name }));
    },
    [client, accessToken],
  );

  switch (type) {
    case 'HERO_BANNER':
      return (
        <div className="flex flex-col gap-3">
          <MediaPicker
            label="Imagen (desktop)"
            accessToken={accessToken}
            client={client}
            value={strOrNull(configuration.imageMediaId)}
            onChange={(id) => set({ imageMediaId: id })}
          />
          <MediaPicker
            label="Imagen (móvil, opcional)"
            accessToken={accessToken}
            client={client}
            value={strOrNull(configuration.mobileImageMediaId)}
            onChange={(id) => set({ mobileImageMediaId: id })}
          />
          <input
            className={textInputClass}
            placeholder="Titular"
            value={str(configuration.headline)}
            onChange={(e) => set({ headline: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="Subtítulo (opcional)"
            value={str(configuration.subheadline)}
            onChange={(e) => set({ subheadline: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="Texto del botón (opcional)"
            value={str(configuration.ctaLabel)}
            onChange={(e) => set({ ctaLabel: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="URL del botón (opcional)"
            value={str(configuration.ctaUrl)}
            onChange={(e) => set({ ctaUrl: e.target.value })}
          />
        </div>
      );

    case 'BANNER_GRID': {
      const banners = Array.isArray(configuration.banners)
        ? (configuration.banners as Array<Record<string, unknown>>)
        : [];
      return (
        <div className="flex flex-col gap-4">
          {banners.map((banner, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3"
            >
              <MediaPicker
                label={`Banner ${index + 1} — imagen`}
                accessToken={accessToken}
                client={client}
                value={strOrNull(banner.imageMediaId)}
                onChange={(id) => {
                  const next = [...banners];
                  next[index] = { ...banner, imageMediaId: id };
                  set({ banners: next });
                }}
              />
              <input
                className={textInputClass}
                placeholder="Título (opcional)"
                value={str(banner.title)}
                onChange={(e) => {
                  const next = [...banners];
                  next[index] = { ...banner, title: e.target.value };
                  set({ banners: next });
                }}
              />
              <input
                className={textInputClass}
                placeholder="URL de destino (opcional)"
                value={str(banner.linkUrl)}
                onChange={(e) => {
                  const next = [...banners];
                  next[index] = { ...banner, linkUrl: e.target.value };
                  set({ banners: next });
                }}
              />
              <button
                type="button"
                className="self-start text-xs text-red-600 hover:underline"
                onClick={() => set({ banners: banners.filter((_, i) => i !== index) })}
              >
                Quitar banner
              </button>
            </div>
          ))}
          <button
            type="button"
            className="self-start rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
            onClick={() => set({ banners: [...banners, { imageMediaId: null }] })}
          >
            + Agregar banner
          </button>
        </div>
      );
    }

    case 'FEATURED_PRODUCTS':
      return (
        <div className="flex flex-col gap-3">
          <input
            className={textInputClass}
            placeholder="Encabezado (opcional)"
            value={str(configuration.heading)}
            onChange={(e) => set({ heading: e.target.value })}
          />
          <EntityMultiPicker
            label="Productos"
            selectedIds={strArray(configuration.productIds)}
            onChange={(ids) => set({ productIds: ids })}
            searchOptions={searchProducts}
          />
        </div>
      );

    case 'FEATURED_CATEGORIES':
      return (
        <div className="flex flex-col gap-3">
          <input
            className={textInputClass}
            placeholder="Encabezado (opcional)"
            value={str(configuration.heading)}
            onChange={(e) => set({ heading: e.target.value })}
          />
          <EntityMultiPicker
            label="Categorías"
            selectedIds={strArray(configuration.categoryIds)}
            onChange={(ids) => set({ categoryIds: ids })}
            searchOptions={searchCategories}
          />
        </div>
      );

    case 'FEATURED_COLLECTIONS':
      return (
        <div className="flex flex-col gap-3">
          <input
            className={textInputClass}
            placeholder="Encabezado (opcional)"
            value={str(configuration.heading)}
            onChange={(e) => set({ heading: e.target.value })}
          />
          <EntityMultiPicker
            label="Colecciones"
            selectedIds={strArray(configuration.collectionIds)}
            onChange={(ids) => set({ collectionIds: ids })}
            searchOptions={searchCollections}
          />
        </div>
      );

    case 'FEATURED_BRANDS':
      return (
        <div className="flex flex-col gap-3">
          <input
            className={textInputClass}
            placeholder="Encabezado (opcional)"
            value={str(configuration.heading)}
            onChange={(e) => set({ heading: e.target.value })}
          />
          <EntityMultiPicker
            label="Marcas"
            selectedIds={strArray(configuration.brandIds)}
            onChange={(ids) => set({ brandIds: ids })}
            searchOptions={searchBrands}
          />
        </div>
      );

    case 'PROMOTION_BANNER':
      return (
        <div className="flex flex-col gap-3">
          <MediaPicker
            label="Imagen"
            accessToken={accessToken}
            client={client}
            value={strOrNull(configuration.imageMediaId)}
            onChange={(id) => set({ imageMediaId: id })}
          />
          <input
            className={textInputClass}
            placeholder="Titular (opcional)"
            value={str(configuration.headline)}
            onChange={(e) => set({ headline: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="Texto del botón (opcional)"
            value={str(configuration.ctaLabel)}
            onChange={(e) => set({ ctaLabel: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="URL del botón (opcional)"
            value={str(configuration.ctaUrl)}
            onChange={(e) => set({ ctaUrl: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="Color de fondo (opcional, ej. #f5f5f5)"
            value={str(configuration.backgroundColor)}
            onChange={(e) => set({ backgroundColor: e.target.value })}
          />
        </div>
      );

    case 'RICH_TEXT':
      return (
        <textarea
          className={`${textInputClass} min-h-[160px] font-mono`}
          placeholder="<p>HTML libre…</p>"
          value={str(configuration.html)}
          onChange={(e) => set({ html: e.target.value })}
        />
      );

    case 'IMAGE_TEXT':
      return (
        <div className="flex flex-col gap-3">
          <MediaPicker
            label="Imagen"
            accessToken={accessToken}
            client={client}
            value={strOrNull(configuration.imageMediaId)}
            onChange={(id) => set({ imageMediaId: id })}
          />
          <input
            className={textInputClass}
            placeholder="Título (opcional)"
            value={str(configuration.title)}
            onChange={(e) => set({ title: e.target.value })}
          />
          <textarea
            className={`${textInputClass} min-h-[100px]`}
            placeholder="Texto (opcional)"
            value={str(configuration.body)}
            onChange={(e) => set({ body: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="Texto del botón (opcional)"
            value={str(configuration.ctaLabel)}
            onChange={(e) => set({ ctaLabel: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="URL del botón (opcional)"
            value={str(configuration.ctaUrl)}
            onChange={(e) => set({ ctaUrl: e.target.value })}
          />
          <select
            className={textInputClass}
            value={str(configuration.imagePosition) || 'left'}
            onChange={(e) => set({ imagePosition: e.target.value })}
          >
            <option value="left">Imagen a la izquierda</option>
            <option value="right">Imagen a la derecha</option>
          </select>
        </div>
      );

    case 'VIDEO_BANNER':
      return (
        <div className="flex flex-col gap-3">
          <input
            className={textInputClass}
            placeholder="URL del video"
            value={str(configuration.videoUrl)}
            onChange={(e) => set({ videoUrl: e.target.value })}
          />
          <MediaPicker
            label="Imagen de portada (opcional)"
            accessToken={accessToken}
            client={client}
            value={strOrNull(configuration.posterImageMediaId)}
            onChange={(id) => set({ posterImageMediaId: id })}
          />
          <input
            className={textInputClass}
            placeholder="Titular (opcional)"
            value={str(configuration.headline)}
            onChange={(e) => set({ headline: e.target.value })}
          />
        </div>
      );

    case 'NEWSLETTER':
      return (
        <div className="flex flex-col gap-3">
          <input
            className={textInputClass}
            placeholder="Titular (opcional)"
            value={str(configuration.headline)}
            onChange={(e) => set({ headline: e.target.value })}
          />
          <input
            className={textInputClass}
            placeholder="Subtítulo (opcional)"
            value={str(configuration.subheadline)}
            onChange={(e) => set({ subheadline: e.target.value })}
          />
        </div>
      );

    default:
      return null;
  }
}
