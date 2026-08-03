import Link from 'next/link';

/** Forma mínima compartida por `ProductSearchSummary` (búsqueda/categoría/marca) y `CollectionProductSummary` (colecciones) — así el mismo componente sirve para ambas fuentes. */
export interface ListableProduct {
  id: string;
  slug: string;
  name: string;
  sku: string;
}

/** Sin imagen/precio: ninguna de las dos fuentes los incluye — llegan con 015-Product-Detail. */
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
        <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-50 transition-transform duration-300 group-hover:scale-105" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-neutral-900">{product.name}</span>
          <span className="text-xs text-neutral-400">{product.sku}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="card-arena group flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-xl bg-neutral-50">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
      </div>
      <span className="truncate text-sm font-medium text-neutral-900">{product.name}</span>
      <span className="text-xs text-neutral-400">{product.sku}</span>
    </Link>
  );
}
