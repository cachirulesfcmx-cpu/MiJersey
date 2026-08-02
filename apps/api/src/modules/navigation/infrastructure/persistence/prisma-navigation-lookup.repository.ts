import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import { NavigationItemType } from '../../domain/value-objects/navigation-enums';

/** Consulta Catalog/Taxonomy/Brands/CMS directamente vía Prisma para validar y resolver enlaces dinámicos — mismo criterio "público" que usa el sitemap de SEO (012): solo entidades visibles al storefront cuentan como existentes. */
@Injectable()
export class PrismaNavigationLookupRepository implements NavigationLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(type: NavigationItemType, targetId: string): Promise<boolean> {
    return (await this.resolvePath(type, targetId)) !== null;
  }

  async resolvePath(type: NavigationItemType, targetId: string): Promise<string | null> {
    switch (type) {
      case NavigationItemType.CATEGORY: {
        const row = await this.prisma.category.findFirst({
          where: { id: targetId, status: 'ACTIVE' },
          select: { slug: true },
        });
        return row ? `/categories/${row.slug}` : null;
      }
      case NavigationItemType.COLLECTION: {
        const row = await this.prisma.collection.findFirst({
          where: { id: targetId, status: 'ACTIVE' },
          select: { slug: true },
        });
        return row ? `/collections/${row.slug}` : null;
      }
      case NavigationItemType.BRAND: {
        const row = await this.prisma.brand.findFirst({
          where: { id: targetId, status: 'ACTIVE' },
          select: { slug: true },
        });
        return row ? `/brands/${row.slug}` : null;
      }
      case NavigationItemType.PRODUCT: {
        const row = await this.prisma.product.findFirst({
          where: { id: targetId, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
          select: { slug: true },
        });
        return row ? `/products/${row.slug}` : null;
      }
      case NavigationItemType.PAGE: {
        const row = await this.prisma.page.findFirst({
          where: { id: targetId, status: 'PUBLISHED' },
          select: { slug: true },
        });
        return row ? `/pages/${row.slug}` : null;
      }
      case NavigationItemType.LINK:
        return null;
      default:
        return null;
    }
  }
}
