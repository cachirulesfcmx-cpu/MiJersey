import type {
  CollectionRuleField,
  CollectionRuleMatchType,
  CollectionRuleOperator,
} from '../value-objects/taxonomy-enums';

export interface ProductSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  visibility: string;
  /// Imagen de la variante activa más barata, ya resuelta a URL servible (mismo criterio que Home 013 / Attributes 014).
  imageUrl: string | null;
  /// Precio de la variante activa más barata — null si el producto no tiene variantes activas.
  price: number | null;
  /// compareAtPrice de esa misma variante, para poder mostrar el descuento en el storefront.
  compareAtPrice: number | null;
  /// Promedio real de Review.rating (solo APPROVED) — null si el producto no tiene reseñas.
  rating: number | null;
  reviewCount: number;
  /// Id de esa misma variante activa más barata — habilita "agregar al carrito" directo desde el listado.
  defaultVariantId: string | null;
}

export interface SmartRuleInput {
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string;
}

export interface FindMatchingRulesParams {
  rules: SmartRuleInput[];
  matchType: CollectionRuleMatchType;
  page: number;
  pageSize: number;
}

/**
 * Vista de solo lectura de Product para el módulo Taxonomy (mismo patrón CQRS
 * que `AuditLogQueryPort` en Administration): Catalog es dueño de la
 * escritura, Taxonomy solo necesita consultarlo para validar asociaciones y
 * resolver colecciones inteligentes.
 */
export interface ProductQueryPort {
  exists(productId: string): Promise<boolean>;
  findByIds(productIds: string[]): Promise<ProductSummary[]>;
  findMatchingRules(
    params: FindMatchingRulesParams,
  ): Promise<{ items: ProductSummary[]; total: number }>;
}
