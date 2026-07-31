import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  WishlistProductLookupPort,
  WishlistVariantInfo,
} from '../../domain/ports/wishlist-product-lookup.port';

const VARIANT_INCLUDE = {
  product: { select: { name: true, slug: true, status: true, visibility: true } },
} as const;

type VariantRow = {
  sku: string;
  title: string;
  price: { toNumber(): number };
  imageId: string | null;
  status: string;
  product: { name: string; slug: string; status: string; visibility: string };
};

function toInfo(row: VariantRow): WishlistVariantInfo {
  return {
    productName: row.product.name,
    productSlug: row.product.slug,
    variantTitle: row.title,
    sku: row.sku,
    price: row.price.toNumber(),
    imageId: row.imageId,
    isAvailableForSale:
      row.status === 'ACTIVE' &&
      row.product.status === 'ACTIVE' &&
      row.product.visibility === 'PUBLIC',
  };
}

@Injectable()
export class PrismaWishlistProductLookupRepository implements WishlistProductLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantInfo(variantId: string): Promise<WishlistVariantInfo | null> {
    const row = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: VARIANT_INCLUDE,
    });
    return row ? toInfo(row) : null;
  }

  async findVariantInfoMany(variantIds: string[]): Promise<Map<string, WishlistVariantInfo>> {
    if (variantIds.length === 0) return new Map();

    const rows = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: VARIANT_INCLUDE,
    });
    return new Map(rows.map((row) => [row.id, toInfo(row)]));
  }
}
