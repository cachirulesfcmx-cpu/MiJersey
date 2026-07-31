'use client';

import type { ProductSearchSummary, PublicProduct } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { BreadcrumbItem } from '../../../components/plp/Breadcrumbs';
import { Breadcrumbs } from '../../../components/plp/Breadcrumbs';
import { ProductGrid } from '../../../components/plp/ProductGrid';
import { WishlistButton } from '../../../components/wishlist/WishlistButton';
import { env } from '../../../config/env';
import { useCart } from '../../../providers/cart-provider';

function initialSelection(product: PublicProduct): Record<string, string> {
  const seedVariant = product.variants[0];
  if (!seedVariant) return {};

  const selection: Record<string, string> = {};
  for (const option of product.options) {
    const value = option.values.find((candidate) =>
      seedVariant.optionValueIds.includes(candidate.id),
    );
    if (value) selection[option.id] = value.id;
  }
  return selection;
}

function findMatchingVariant(product: PublicProduct, selection: Record<string, string>) {
  const selectedValueIds = Object.values(selection);
  if (selectedValueIds.length !== product.options.length) return undefined;

  return product.variants.find((variant) =>
    selectedValueIds.every((valueId) => variant.optionValueIds.includes(valueId)),
  );
}

function formatPrice(amount: number): string {
  // `price` es Decimal(10,2) en la base de datos: ya es un monto completo (pesos.centavos), no centavos enteros.
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function ProductDetailClient({
  product,
  breadcrumbItems,
}: {
  product: PublicProduct;
  breadcrumbItems: BreadcrumbItem[];
}) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();
  const { addItem } = useCart();
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    initialSelection(product),
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [related, setRelated] = useState<ProductSearchSummary[]>([]);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const activeVariant = useMemo(
    () => findMatchingVariant(product, selection),
    [product, selection],
  );

  useEffect(() => {
    setQuantity(1);
  }, [activeVariant?.id]);

  useEffect(() => {
    client
      .getRelatedProducts(product.slug)
      .then((result) => setRelated(result.items))
      .catch(() => setRelated([]));
  }, [client, product.slug]);

  const images =
    product.galleryUrls.length > 0
      ? product.galleryUrls
      : [activeVariant?.imageUrl].filter((url): url is string => !!url);
  const mainImage = activeVariant?.imageUrl ?? images[activeImage] ?? images[0] ?? null;

  const maxQuantity = activeVariant?.availableQuantity ?? 0;

  async function handleAddToCart(goToCart: boolean) {
    if (!activeVariant) return;
    setCartError(null);
    setIsAddingToCart(true);
    try {
      await addItem({ variantId: activeVariant.id, quantity });
      if (goToCart) router.push('/cart');
    } catch (err) {
      setCartError(
        err instanceof ApiClientError ? err.message : 'No se pudo agregar el producto al carrito.',
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-lg bg-neutral-50">
            {mainImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    index === activeImage ? 'border-brand-500' : 'border-neutral-200'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {product.brand && <span className="text-sm text-neutral-500">{product.brand.name}</span>}
          <h1 className="text-3xl font-semibold text-neutral-900">{product.name}</h1>
          {product.shortDescription && (
            <p className="text-neutral-600">{product.shortDescription}</p>
          )}

          <div className="flex items-baseline gap-3">
            {activeVariant ? (
              <>
                <span className="text-2xl font-semibold text-neutral-900">
                  {formatPrice(activeVariant.price)}
                </span>
                {activeVariant.compareAtPrice && (
                  <span className="text-neutral-400 line-through">
                    {formatPrice(activeVariant.compareAtPrice)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-neutral-500">Combinación no disponible</span>
            )}
          </div>

          {product.options.map((option) => (
            <div key={option.id} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-neutral-900">{option.name}</span>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => setSelection((prev) => ({ ...prev, [option.id]: value.id }))}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      selection[option.id] === value.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {value.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-900">Cantidad</span>
            <input
              type="number"
              min={1}
              max={Math.max(maxQuantity, 1)}
              value={quantity}
              disabled={!activeVariant?.inStock}
              onChange={(event) =>
                setQuantity(
                  Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(maxQuantity, 1)),
                )
              }
              className="w-20 rounded-md border border-neutral-200 px-2 py-1 text-sm"
            />
            {activeVariant && !activeVariant.inStock && (
              <span className="text-danger-600 text-xs">Agotado</span>
            )}
          </div>

          {cartError && <p className="text-danger-600 text-sm">{cartError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={!activeVariant?.inStock || isAddingToCart}
              onClick={() => void handleAddToCart(false)}
              className="bg-brand-600 hover:bg-brand-700 flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-300 disabled:text-neutral-600"
            >
              Agregar al carrito
            </button>
            <button
              type="button"
              disabled={!activeVariant?.inStock || isAddingToCart}
              onClick={() => void handleAddToCart(true)}
              className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:text-neutral-400"
            >
              Comprar ahora
            </button>
            {activeVariant && (
              <WishlistButton productId={product.id} variantId={activeVariant.id} />
            )}
          </div>

          {product.specifications.length > 0 && (
            <div className="border-t border-neutral-200 pt-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">Especificaciones</h2>
              <dl className="flex flex-col gap-1">
                {product.specifications.map((spec) => (
                  <div key={spec.attributeId} className="flex justify-between text-sm">
                    <dt className="text-neutral-500">{spec.name}</dt>
                    <dd className="text-neutral-900">{spec.valueLabel ?? spec.customValue}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.description && (
            <div className="border-t border-neutral-200 pt-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">Descripción</h2>
              <p className="whitespace-pre-line text-neutral-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="border-t border-neutral-200 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Productos relacionados</h2>
          <ProductGrid products={related} view="grid" />
        </div>
      )}
    </main>
  );
}
