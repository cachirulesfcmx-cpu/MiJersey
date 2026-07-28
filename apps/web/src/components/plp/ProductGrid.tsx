import type { ListableProduct } from './ProductCard';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  view,
}: {
  products: ListableProduct[];
  view: 'grid' | 'list';
}) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} view="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} view="grid" />
      ))}
    </div>
  );
}
