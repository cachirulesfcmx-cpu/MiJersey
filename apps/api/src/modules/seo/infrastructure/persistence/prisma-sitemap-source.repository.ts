import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { SitemapEntry, SitemapSourcePort } from '../../domain/ports/sitemap-source.port';

@Injectable()
export class PrismaSitemapSourceRepository implements SitemapSourcePort {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicProducts(): Promise<SitemapEntry[]> {
    const rows = await this.prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
      select: { slug: true, updatedAt: true },
    });
    return rows;
  }

  async listPublicCategories(): Promise<SitemapEntry[]> {
    const rows = await this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });
    return rows;
  }

  async listPublicCollections(): Promise<SitemapEntry[]> {
    const rows = await this.prisma.collection.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });
    return rows;
  }

  async listPublicBrands(): Promise<SitemapEntry[]> {
    const rows = await this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });
    return rows;
  }
}
