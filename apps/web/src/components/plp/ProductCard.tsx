import Link from 'next/link';

/** Forma mínima compartida por `ProductSearchSummary` (búsqueda/categoría/marca) y `CollectionProductSummary` (colecciones) — así el mismo componente sirve para ambas fuentes. `imageUrl`/`price`/`compareAtPrice` son opcionales porque `CollectionProductSummary` todavía no los expone (015). */
export interface ListableProduct {
  id: string;
  slug: string;
  name: string;
  sku: string;
  imageUrl?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
}

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
      className="badge-pop absolute left-3 top-3 z-10"
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

function ProductMedia({ product, className }: { product: ListableProduct; className: string }) {
  const hasDiscount =
    typeof product.price === 'number' &&
    typeof product.compareAtPrice === 'number' &&
    product.compareAtPrice > product.price;

  return (
    <div className={`relative overflow-hidden bg-neutral-50 ${className}`}>
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
    </div>
  );
}

/** Tarjeta de producto reutilizada en PLP (búsqueda/categoría/marca), colecciones y "relacionados" (015) — jerarquía visual: imagen > descuento > nombre > precio (con tachado si aplica). */
export function ProductCard({
  product,
  view = 'grid',
}: {
  product: ListableProduct;
  view?: 'grid' | 'list';
}) {
  if (view === 'list') {
    return (
      <Link href={`/products/${product.slug}`} className="card-arena group flex items-center gap-4">
        <ProductMedia product={product} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-neutral-900">{product.name}</span>
          <span className="text-xs text-neutral-400">{product.sku}</span>
          <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="card-arena group flex flex-col gap-3">
      <ProductMedia product={product} className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-1">
        <span className="truncate text-sm font-medium text-neutral-900">{product.name}</span>
        <span className="truncate text-xs text-neutral-400">{product.sku}</span>
        <PriceRow price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
    </Link>
  );
}
