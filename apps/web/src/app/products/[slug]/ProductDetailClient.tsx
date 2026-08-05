'use client';

import type { ProductSearchSummary, PublicProduct, ReviewSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { VolumeDiscountProgress } from '../../../components/home/VolumeDiscountProgress';
import type { BreadcrumbItem } from '../../../components/plp/Breadcrumbs';
import { Breadcrumbs } from '../../../components/plp/Breadcrumbs';
import { ProductGrid } from '../../../components/plp/ProductGrid';
import { FitGuideSlider } from '../../../components/products/FitGuideSlider';
import { ProductReviews } from '../../../components/products/ProductReviews';
import { SecretJerseyUpsell } from '../../../components/products/SecretJerseyUpsell';
import { ViewersBadge } from '../../../components/promotions/SocialProofBar';
import { Reveal } from '../../../components/ui/Reveal';
import { StarRating } from '../../../components/ui/StarRating';
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
  const [justAdded, setJustAdded] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);

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

  useEffect(() => {
    client
      .listProductReviews(product.slug)
      .then((result) => setReviewSummary(result.summary))
      .catch(() => setReviewSummary(null));
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
      if (goToCart) {
        router.push('/cart');
      } else {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } catch (err) {
      setCartError(
        err instanceof ApiClientError ? err.message : 'No se pudo agregar el producto al carrito.',
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <Reveal className="flex flex-col gap-3">
          {/* Sin fondo CSS sintético ni esquinas redondeadas -- bartjerseys.com no aplica ninguno
              de los dos en su galería de producto (el fondo de color que se ve ahí viene
              horneado en la foto misma, confirmado inspeccionando su DOM en vivo). */}
          <div
            className="aspect-square overflow-hidden"
            style={{ background: 'var(--tf-neutral-100)' }}
          >
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
                  className={`h-16 w-16 overflow-hidden border-2 transition-colors ${
                    index === activeImage
                      ? 'border-pop-500'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delayMs={100} className="flex flex-col gap-5">
          {product.brand && <span className="label-arena">{product.brand.name}</span>}
          <div className="flex flex-wrap items-center gap-3">
            {reviewSummary && reviewSummary.count > 0 && (
              <a href="#reseñas" className="flex items-center gap-2">
                <StarRating value={reviewSummary.average} size={16} />
                <span className="text-sm text-neutral-500">
                  {reviewSummary.average.toFixed(1)} · {reviewSummary.count}{' '}
                  {reviewSummary.count === 1 ? 'reseña' : 'reseñas'}
                </span>
              </a>
            )}
            <ViewersBadge />
          </div>
          <h1 className="section-heading">{product.name}</h1>
          {product.shortDescription && (
            <p className="text-neutral-600">{product.shortDescription}</p>
          )}

          <div className="flex items-baseline gap-3">
            {activeVariant ? (
              <>
                {activeVariant.compareAtPrice &&
                  activeVariant.compareAtPrice > activeVariant.price && (
                    <span className="text-neutral-400 line-through">
                      {formatPrice(activeVariant.compareAtPrice)}
                    </span>
                  )}
                {/* Precio final: rojo bold, Helvetica -- clon 1:1 de bartjerseys.com (medido
                    vía computed style real: 28px, font-weight 900, color rgb(255,0,1)). Antes
                    usaba Bebas Neue + azul, una combinación que no existe en la referencia (ahí
                    Bebas Neue es solo para encabezados de sección, nunca para precios). */}
                <span
                  className="text-3xl font-black tracking-tight"
                  style={{ color: 'var(--tf-danger)' }}
                >
                  {formatPrice(activeVariant.price)}
                </span>
                {activeVariant.compareAtPrice &&
                  activeVariant.compareAtPrice > activeVariant.price && (
                    <span
                      className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-white"
                      style={{ background: 'var(--tf-success)' }}
                    >
                      Ahorras {formatPrice(activeVariant.compareAtPrice - activeVariant.price)}
                    </span>
                  )}
              </>
            ) : (
              <span className="text-sm text-neutral-500">Combinación no disponible</span>
            )}
          </div>

          {product.options.map((option) => (
            <div key={option.id} className="flex flex-col gap-2">
              <span className="label-arena">{option.name}</span>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => setSelection((prev) => ({ ...prev, [option.id]: value.id }))}
                    // Selector negro-sólido-cuando-activo -- clon 1:1 del selector de talla/versión
                    // de bartjerseys.com (fondo negro + texto blanco en la opción elegida, borde
                    // gris simple en el resto), en vez de píldoras redondeadas de color.
                    className={`border-2 px-4 py-1.5 text-sm font-medium transition-all ${
                      selection[option.id] === value.id
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {value.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <FitGuideSlider />

          <div className="flex items-center gap-3">
            <span className="label-arena">Cantidad</span>
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
              className="input-arena w-20 py-1.5 text-center"
            />
            {activeVariant && !activeVariant.inStock && (
              <span className="badge-pop bg-danger-600">Agotado</span>
            )}
            {activeVariant &&
              activeVariant.inStock &&
              activeVariant.availableQuantity > 0 &&
              activeVariant.availableQuantity <= 5 && (
                <span
                  className="badge-pop animate-pulse"
                  style={{ background: 'var(--tf-danger)', color: 'white' }}
                >
                  ⚡ Quedan {activeVariant.availableQuantity}{' '}
                  {activeVariant.availableQuantity === 1 ? 'pieza' : 'piezas'}
                </span>
              )}
          </div>

          {cartError && <p className="text-danger-600 text-sm">{cartError}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!activeVariant?.inStock || isAddingToCart}
              onClick={() => void handleAddToCart(false)}
              className="btn-pop flex-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {justAdded ? '¡Agregado!' : 'Agregar al carrito'}
            </button>
            <button
              type="button"
              disabled={!activeVariant?.inStock || isAddingToCart}
              onClick={() => void handleAddToCart(true)}
              className="btn-pop-outline flex-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comprar ahora
            </button>
            {activeVariant && (
              <WishlistButton productId={product.id} variantId={activeVariant.id} />
            )}
          </div>

          <VolumeDiscountProgress variant="inline" />

          <SecretJerseyUpsell currentProductSlug={product.slug} />

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
        </Reveal>
      </div>

      {related.length > 0 && (
        <Reveal className="border-t border-neutral-200 pt-8">
          <h2 className="section-heading mb-4 text-xl sm:text-2xl">Productos relacionados</h2>
          <ProductGrid products={related} view="grid" />
        </Reveal>
      )}

      <ProductReviews slug={product.slug} />
    </main>
  );
}
