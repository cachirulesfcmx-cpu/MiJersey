import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  CheckoutProductLookupPort,
  CheckoutVariantInfo,
} from '../../domain/ports/checkout-product-lookup.port';

@Injectable()
export class PrismaCheckoutProductLookupRepository implements CheckoutProductLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantInfoMany(variantIds: string[]): Promise<Map<string, CheckoutVariantInfo>> {
    if (variantIds.length === 0) return new Map();

    const rows = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { status: true, visibility: true } } },
    });

    return new Map(
      rows.map((row) => [
        row.id,
        {
          price: row.price.toNumber(),
          isAvailableForSale:
            row.status === 'ACTIVE' &&
            row.product.status === 'ACTIVE' &&
            row.product.visibility === 'PUBLIC',
        },
      ]),
    );
  }
}
