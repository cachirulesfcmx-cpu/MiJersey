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

function toUrlEntry(baseUrl: string, entityType: SeoEntityType, entry: SitemapEntry): string {
  const loc = escapeXml(`${baseUrl}${buildEntityPath(entityType, entry.slug)}`);
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

    const [products, categories, collections, brands] = await Promise.all([
      this.source.listPublicProducts(),
      this.source.listPublicCategories(),
      this.source.listPublicCollections(),
      this.source.listPublicBrands(),
    ]);

    const baseUrl = this.config.publicWebUrl.replace(/\/$/, '');
    const urls = [
      ...products.map((entry) => toUrlEntry(baseUrl, SeoEntityType.PRODUCT, entry)),
      ...categories.map((entry) => toUrlEntry(baseUrl, SeoEntityType.CATEGORY, entry)),
      ...collections.map((entry) => toUrlEntry(baseUrl, SeoEntityType.COLLECTION, entry)),
      ...brands.map((entry) => toUrlEntry(baseUrl, SeoEntityType.BRAND, entry)),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    await this.cache.setSitemap(xml);

    return xml;
  }
}
