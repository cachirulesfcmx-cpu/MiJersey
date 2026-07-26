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
