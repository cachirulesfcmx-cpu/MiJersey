import type { NavigationItemType } from '../value-objects/navigation-enums';

/** Resuelve/valida referencias a recursos internos (spec §4 "validar referencias a recursos internos") consultando las tablas de Catalog/Taxonomy/Brands/CMS directamente vía Prisma, sin importar esos módulos — mismo patrón que `SitemapSourcePort` (012) y `EntityLookupPort` (012). */
export interface NavigationLookupPort {
  exists(type: NavigationItemType, targetId: string): Promise<boolean>;
  /** Ruta pública del recurso para el storefront, o `null` si ya no existe (spec §4 "mantener consistencia al eliminar recursos enlazados": el ítem se omite al renderizar en vez de romper el árbol). */
  resolvePath(type: NavigationItemType, targetId: string): Promise<string | null>;
}
