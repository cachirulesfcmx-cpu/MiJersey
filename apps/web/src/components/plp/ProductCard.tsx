'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useCart } from '../../providers/cart-provider';
import { StarRating } from '../ui/StarRating';

/** Forma mínima compartida por `ProductSearchSummary` (búsqueda/categoría/marca) y `CollectionProductSummary` (colecciones) — así el mismo componente sirve para ambas fuentes. */
export interface ListableProduct {
  id: string;
  slug: string;
  name: string;
  sku: string;
  imageUrl?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  rating?: number | null;
  reviewCount?: number;
  defaultVariantId?: string | null;
}

/** Misma paleta saturada del home (ver HomeSectionRenderer.PRODUCT_BG) -- degradado diagonal
    detrás de la playera en vez de blanco liso o color plano, como bartjerseys.com. Debe quedar
    idéntica al array del home para que un mismo producto se vea igual en PLP y en el slider. */
const PRODUCT_BG = [
  'linear-gradient(135deg, #7C8DF0 0%, #4C3FC9 100%)',
  'linear-gradient(135deg, #6C5FE0 0%, #3D2FA8 100%)',
  'linear-gradient(135deg, #5C9FF0 0%, #2D5FC0 100%)',
  'linear-gradient(135deg, #8B6FE8 0%, #4A2FC0 100%)',
  'linear-gradient(135deg, #4D8FE8 0%, #2A4FC0 100%)',
  'linear-gradient(135deg, #9B6FE8 0%, #5A2FC0 100%)',
  'linear-gradient(135deg, #6A7FE8 0%, #3A2FB8 100%)',
  'linear-gradient(135deg, #7F6FE0 0%, #402FB0 100%)',
];

function formatPrice(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function DiscountBadge({ price, compareAtPrice }: { price: number; compareAtPrice: number }) {
  const percentOff = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  if (percentOff <= 0) return null;
  return (
    <span
      className="badge-pop absolute left-3 top-3 z-10 animate-pulse"
      style={{ background: 'var(--tf-danger)', color: 'white' }}
    >
      -{percentOff}%
    </span>
  );
}

function PriceRow({
  price,
  compareAtPrice,
}: {
  price?: number | null | undefined;
  compareAtPrice?: number | null | undefined;
}) {
  if (typeof price !== 'number') return null;
  const hasDiscount = typeof compareAtPrice === 'number' && compareAtPrice > price;
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-arena-950 text-base tracking-wide">
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className="text-xs text-neutral-400 line-through">{formatPrice(compareAtPrice)}</span>
      )}
    </div>
  );
}

function RatingRow({
  rating,
  reviewCount,
}: {
  rating?: number | null | undefined;
  reviewCount?: number | undefined;
}) {
  if (typeof rating !== 'number' || !reviewCount) return null;
  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={rating} size={13} />
      <span className="tf-caption text-neutral-400">{reviewCount}</span>
    </div>
  );
}

/** Botón "agregar al carrito" directo desde la tarjeta, sin pasar por el PDP -- solo aparece si el producto tiene una variante activa (`defaultVariantId`, ver Home 013/PLP). */
function QuickAddButton({ variantId }: { variantId: string }) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'idle') return;
    setStatus('adding');
    try {
      await addItem({ variantId, quantity: 1 });
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Agregar al carrito"
      disabled={status !== 'idle'}
      className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition-transform duration-200 hover:scale-110 active:scale-95 disabled:opacity-80"
      style={{ background: 'var(--tf-danger)' }}
    >
      {status === 'added' ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function ProductMedia({
  product,
  className,
  bg,
}: {
  product: ListableProduct;
  className: string;
  bg?: string;
}) {
  const hasDiscount =
    typeof product.price === 'number' &&
    typeof product.compareAtPrice === 'number' &&
    product.compareAtPrice > product.price;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: bg ?? 'var(--tf-neutral-50)' }}
    >
      {hasDiscount && (
        <DiscountBadge
          price={product.price as number}
          compareAtPrice={product.compareAtPrice as number}
        />
      )}
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full" />
      )}
      {product.defaultVariantId && <QuickAddButton variantId={product.defaultVariantId} />}
    </div>
  );
}

/** Tarjeta de producto reutilizada en PLP (búsqueda/categoría/marca), colecciones y "relacionados" — jerarquía visual: fondo de color > imagen > descuento > nombre > estrellas > precio. */
export function ProductCard({
  product,
  view = 'grid',
  index = 0,
}: {
  product: ListableProduct;
  view?: 'grid' | 'list';
  index?: number;
}) {
  const bg = PRODUCT_BG[index % PRODUCT_BG.length] ?? '#6C7FE8';

  if (view === 'list') {
    return (
      <Link href={`/products/${product.slug}`} className="card-arena group flex items-center gap-4">
        <ProductMedia product={product} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-neutral-900">{product.name}</span>
          <span className="text-xs text-neutral-400">{product.sku}</span>
          <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
          <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </Link>
    );
  }

  // Sin envoltura de "tarjeta blanca" (card-arena) -- el fondo de color debe llegar hasta el
  // borde de la imagen, igual que las tarjetas del home (ProductSliderCard) y que bartjerseys.com.
  // Antes esto usaba `card-arena` (fondo blanco + borde + sombra + padding) mientras el home no
  // llevaba nada de eso -- por eso el mismo producto se veía como dos componentes distintos según
  // en qué parte del sitio apareciera.
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2 transition-transform duration-300 hover:-translate-y-1.5"
    >
      <ProductMedia product={product} className="aspect-[4/5] w-full rounded-2xl" bg={bg} />
      <div className="flex flex-col gap-1">
        <span className="truncate text-sm font-medium text-neutral-900">{product.name}</span>
        <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
        <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
    </Link>
  );
}
