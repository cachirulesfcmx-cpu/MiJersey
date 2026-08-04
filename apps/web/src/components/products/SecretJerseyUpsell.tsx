'use client';

import type { PublicProduct } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { useCart } from '../../providers/cart-provider';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function extractProductSlug(ctaUrl: unknown): string | null {
  if (typeof ctaUrl !== 'string') return null;
  const match = /^\/products\/([^/?#]+)/.exec(ctaUrl);
  return match?.[1] ?? null;
}

/**
 * Upsell real del "jersey sorpresa": localiza la sección IMAGE_TEXT que
 * tools/enable-secret-jersey.mjs crea en el home real ("Jersey sorpresa") y carga ese producto
 * real (mismo mecanismo que bartjerseys.com muestra en su PDP: "Añade un jersey sorpresa con
 * X% OFF"), en vez de inventar un producto o precio. Si esa sección no existe todavía, o el
 * producto en pantalla ES el jersey sorpresa, no se muestra nada.
 */
export function SecretJerseyUpsell({ currentProductSlug }: { currentProductSlug: string }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { addItem } = useCart();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const [included, setIncluded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    client
      .getPublicHome()
      .then(async ({ sections }) => {
        const section = sections.find(
          (s) => s.type === 'IMAGE_TEXT' && s.title === 'Jersey sorpresa',
        );
        const slug = extractProductSlug(section?.configuration.ctaUrl);
        if (!slug || slug === currentProductSlug) return;
        const detail = await client.getPublicProduct(slug);
        if (cancelled) return;
        setProduct(detail);
        const seedVariant = detail.variants[0];
        if (seedVariant) {
          const seed: Record<string, string> = {};
          for (const option of detail.options) {
            const value = option.values.find((v) => seedVariant.optionValueIds.includes(v.id));
            if (value) seed[option.id] = value.id;
          }
          setSelection(seed);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [client, currentProductSlug]);

  if (!product) return null;

  const variant =
    product.variants.find((v) => {
      const selectedIds = Object.values(selection);
      return (
        selectedIds.length === product.options.length &&
        selectedIds.every((id) => v.optionValueIds.includes(id))
      );
    }) ?? product.variants[0];

  const percentOff =
    variant?.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100)
      : null;

  async function handleAdd() {
    if (!variant || status !== 'idle') return;
    setStatus('adding');
    try {
      await addItem({ variantId: variant.id, quantity: 1 });
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('idle');
    }
  }

  return (
    <div
      className="card-arena flex flex-col gap-3 border-2"
      style={{ borderColor: 'var(--tf-accent)' }}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden>⚡</span>
        <span className="text-sm font-semibold text-neutral-900">
          Añade un jersey sorpresa{percentOff ? ` con ${percentOff}% OFF` : ''}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <label className="flex items-center pt-2">
          <input
            type="checkbox"
            checked={included}
            onChange={(e) => setIncluded(e.target.checked)}
            className="h-4 w-4 accent-[var(--tf-accent)]"
          />
        </label>

        {product.galleryUrls[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.galleryUrls[0]}
            alt={product.name}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        )}

        <div className="flex flex-1 flex-col gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            {product.name}
          </Link>
          {variant && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-neutral-900">
                {formatPrice(variant.price)}
              </span>
              {variant.compareAtPrice && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(variant.compareAtPrice)}
                </span>
              )}
            </div>
          )}

          {product.options.map((option) => (
            <div key={option.id} className="flex flex-wrap items-center gap-1.5">
              <span className="tf-caption text-neutral-400">{option.name}:</span>
              {option.values.map((value) => (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => setSelection((prev) => ({ ...prev, [option.id]: value.id }))}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    selection[option.id] === value.id
                      ? 'border-pop-500 bg-pop-500/10 text-pop-600'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {value.value}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleAdd()}
        disabled={!included || !variant?.inStock || status !== 'idle'}
        className="btn-pop-outline disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === 'added'
          ? '¡Agregado!'
          : status === 'adding'
            ? 'Agregando…'
            : 'Agregar al carrito'}
      </button>
    </div>
  );
}
