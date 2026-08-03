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
}
