import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { ReviewProductLookupPort } from '../../domain/ports/review-product-lookup.port';

@Injectable()
export class PrismaReviewProductLookupRepository implements ReviewProductLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicProductBySlug(
    slug: string,
  ): Promise<{ id: string; slug: string; name: string } | null> {
    const row = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
      select: { id: true, slug: true, name: true },
    });
    return row;
  }

  async hasVerifiedPurchase(customerId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: { productId, order: { customerId, paymentStatus: 'PAID' } },
    });
    return count > 0;
  }

  async findProductsByIds(
    ids: string[],
  ): Promise<{ id: string; slug: string; name: string; imageMediaId: string | null }[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
      select: {
        id: true,
        slug: true,
        name: true,
        variants: {
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
          take: 1,
          select: { imageId: true },
        },
        // Fallback a la galería del producto (ProductMedia, 015) -- `variant.imageId` es un
        // override opcional (007) que el catálogo legacy importado nunca pobló.
        media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      imageMediaId: row.variants[0]?.imageId ?? row.media[0]?.mediaId ?? null,
    }));
  }
}
