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

function formatPrice(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

/** Badge de descuento -- clon 1:1 de bartjerseys.com: fondo rojo sólido (#FF0001, medido por
    computed style real), texto blanco, ESQUINAS RECTAS (su tema no redondea ningún badge de
    tarjeta de producto), sin animación de pulso (no existe en la referencia). */
function DiscountBadge({ price, compareAtPrice }: { price: number; compareAtPrice: number }) {
  const percentOff = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  if (percentOff <= 0) return null;
  return (
    <span
      className="absolute left-0 top-3 z-10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
      style={{ background: 'var(--tf-danger)' }}
    >
      -{percentOff}%
    </span>
  );
}

/** Precio -- mismo orden y tratamiento que bartjerseys.com: precio tachado gris primero, precio
    final en rojo bold después (medido: 12px gris #BFBFBF tachado / 17px bold #FF1F1F). Nunca
    Bebas Neue aquí -- esa fuente es solo para encabezados de sección en la referencia, el precio
    de tarjeta usa la misma Helvetica del resto del texto. */
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
      {hasDiscount && (
        <span className="text-xs text-neutral-400 line-through">{formatPrice(compareAtPrice)}</span>
      )}
      <span className="text-base font-bold tracking-tight" style={{ color: 'var(--tf-danger)' }}>
        {formatPrice(price)}
      </span>
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

/** Botón "agregar al carrito" directo desde la tarjeta -- círculo rojo con ícono de bolsa,
    esquina inferior derecha de la imagen, igual que bartjerseys.com. Es el único elemento
    redondo de la tarjeta (su tema tampoco lo cuadra). */
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
      className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition-transform duration-200 hover:scale-110 active:scale-95 disabled:opacity-80"
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

function ProductMedia({ product, className }: { product: ListableProduct; className: string }) {
  const hasDiscount =
    typeof product.price === 'number' &&
    typeof product.compareAtPrice === 'number' &&
    product.compareAtPrice > product.price;

  return (
    // Sin border-radius ni fondo de color sintético -- bartjerseys.com no aplica ningún CSS
    // background detrás de sus fotos de producto (confirmado inspeccionando el DOM en vivo: el
    // fondo de color que se ve ahí viene HORNEADO en la foto misma, no de CSS). Las fotos de
    // MiJersey ya traen ese mismo tratamiento (tools/restyle-product-images.mjs), así que el
    // fallback aquí solo debe cubrir el caso raro de imagen faltante.
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: 'var(--tf-neutral-100)' }}
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

/** Tarjeta de producto reutilizada en PLP (búsqueda/categoría/marca), colecciones y "relacionados".
    Clonada 1:1 de bartjerseys.com: imagen casi cuadrada (midieron 389x370px reales), esquinas
    rectas, título Helvetica regular (no bold), precio rojo bold. */
export function ProductCard({
  product,
  view = 'grid',
}: {
  product: ListableProduct;
  view?: 'grid' | 'list';
  index?: number;
}) {
  if (view === 'list') {
    return (
      <Link href={`/products/${product.slug}`} className="card-arena group flex items-center gap-4">
        <ProductMedia product={product} className="h-16 w-16 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-neutral-900">{product.name}</span>
          <span className="text-xs text-neutral-400">{product.sku}</span>
          <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
          <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2 transition-transform duration-300 hover:-translate-y-1"
    >
      <ProductMedia product={product} className="aspect-square w-full" />
      <div className="flex flex-col gap-1">
        <span className="truncate text-sm font-normal text-neutral-900">{product.name}</span>
        <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
        <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
    </Link>
  );
}
