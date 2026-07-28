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
      <Link
        href={`/products/${product.slug}`}
        className="hover:border-brand-300 flex items-center gap-4 rounded-lg border border-neutral-200 p-3 hover:shadow-sm"
      >
        <div className="h-16 w-16 shrink-0 rounded-md bg-neutral-50" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-neutral-900">{product.name}</span>
          <span className="text-xs text-neutral-400">{product.sku}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="hover:border-brand-300 flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 hover:shadow-sm"
    >
      <div className="aspect-square rounded-md bg-neutral-50" />
      <span className="text-sm font-medium text-neutral-900">{product.name}</span>
      <span className="text-xs text-neutral-400">{product.sku}</span>
    </Link>
  );
}
