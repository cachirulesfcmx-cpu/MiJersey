import type { SeoEntityType } from '../value-objects/seo-enums';

/** Valida que la entidad referenciada por un `SeoMetadata` realmente exista, sin importar Catalog/Taxonomy/Brands. */
export interface EntityLookupPort {
  exists(entityType: SeoEntityType, entityId: string): Promise<boolean>;
}
