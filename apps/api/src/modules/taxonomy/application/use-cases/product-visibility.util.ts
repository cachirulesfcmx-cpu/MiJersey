import type { ProductSummary } from '../../domain/ports/product-query.port';

/** Mismo criterio que Catalog usa para su API pública: ACTIVE + PUBLIC. */
export function isPubliclyVisible(product: ProductSummary): boolean {
  return product.status === 'ACTIVE' && product.visibility === 'PUBLIC';
}
