export interface SitemapEntry {
  slug: string;
  updatedAt: Date;
}

/**
 * Vista de solo lectura de Catalog/Taxonomy/Brands para generar el sitemap
 * (mismo patrón CQRS que el resto de módulos): SEO no importa esos módulos,
 * solo consulta sus tablas públicas directamente vía Prisma.
 */
export interface SitemapSourcePort {
  listPublicProducts(): Promise<SitemapEntry[]>;
  listPublicCategories(): Promise<SitemapEntry[]>;
  listPublicCollections(): Promise<SitemapEntry[]>;
  listPublicBrands(): Promise<SitemapEntry[]>;
  /** 027-Blog: artículos publicados, mismo patrón "SEO consulta la tabla ajena directamente vía Prisma" que el resto de fuentes — sin importar el módulo Blog. */
  listPublicBlogPosts(): Promise<SitemapEntry[]>;
}
