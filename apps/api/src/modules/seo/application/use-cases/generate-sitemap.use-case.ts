import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { SitemapEntry, SitemapSourcePort } from '../../domain/ports/sitemap-source.port';
import { buildEntityPath, SeoEntityType } from '../../domain/value-objects/seo-enums';
import { SITEMAP_SOURCE } from '../../seo.constants';
import { SeoCacheService } from '../services/seo-cache.service';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toUrlEntry(baseUrl: string, path: string, entry: SitemapEntry): string {
  const loc = escapeXml(`${baseUrl}${path}`);
  const lastmod = entry.updatedAt.toISOString();
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}

@Injectable()
export class GenerateSitemapUseCase {
  constructor(
    @Inject(SITEMAP_SOURCE) private readonly source: SitemapSourcePort,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly cache: SeoCacheService,
  ) {}

  async execute(): Promise<string> {
    const cached = await this.cache.getSitemap();
    if (cached) {
      return cached;
    }

    const [products, categories, collections, brands, blogPosts] = await Promise.all([
      this.source.listPublicProducts(),
      this.source.listPublicCategories(),
      this.source.listPublicCollections(),
      this.source.listPublicBrands(),
      this.source.listPublicBlogPosts(),
    ]);

    const baseUrl = this.config.publicWebUrl.replace(/\/$/, '');
    const urls = [
      ...products.map((entry) =>
        toUrlEntry(baseUrl, buildEntityPath(SeoEntityType.PRODUCT, entry.slug), entry),
      ),
      ...categories.map((entry) =>
        toUrlEntry(baseUrl, buildEntityPath(SeoEntityType.CATEGORY, entry.slug), entry),
      ),
      ...collections.map((entry) =>
        toUrlEntry(baseUrl, buildEntityPath(SeoEntityType.COLLECTION, entry.slug), entry),
      ),
      ...brands.map((entry) =>
        toUrlEntry(baseUrl, buildEntityPath(SeoEntityType.BRAND, entry.slug), entry),
      ),
      // 027-Blog: no tiene registro en SeoEntityType (esa tabla es exclusiva de entidades con SeoMetadata polimórfico; Blog usa columnas propias, igual que CMS Pages) — se arma la ruta directamente.
      ...blogPosts.map((entry) => toUrlEntry(baseUrl, `/blog/${entry.slug}`, entry)),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    await this.cache.setSitemap(xml);

    return xml;
  }
}
