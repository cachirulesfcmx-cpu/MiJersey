import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  CartProductLookupPort,
  CartVariantInfo,
} from '../../domain/ports/cart-product-lookup.port';

const VARIANT_INCLUDE = {
  product: {
    select: {
      name: true,
      slug: true,
      status: true,
      visibility: true,
      // Fallback a la galería del producto (ProductMedia, 015) -- `variant.imageId` es un
      // override opcional (007) que el catálogo legacy importado nunca pobló.
      media: { orderBy: { sortOrder: 'asc' as const }, take: 1, select: { mediaId: true } },
    },
  },
} as const;

type VariantRow = {
  id: string;
  productId: string;
  sku: string;
  title: string;
  price: { toNumber(): number };
  imageId: string | null;
  status: string;
  product: {
    name: string;
    slug: string;
    status: string;
    visibility: string;
    media: { mediaId: string }[];
  };
};

function toInfo(row: VariantRow): CartVariantInfo {
  return {
    productId: row.productId,
    productName: row.product.name,
    productSlug: row.product.slug,
    variantId: row.id,
    variantTitle: row.title,
    sku: row.sku,
    price: row.price.toNumber(),
    imageId: row.imageId ?? row.product.media[0]?.mediaId ?? null,
    isAvailableForSale:
      row.status === 'ACTIVE' &&
      row.product.status === 'ACTIVE' &&
      row.product.visibility === 'PUBLIC',
  };
}

@Injectable()
export class PrismaCartProductLookupRepository implements CartProductLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantInfo(variantId: string): Promise<CartVariantInfo | null> {
    const row = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: VARIANT_INCLUDE,
    });
    return row ? toInfo(row) : null;
  }

  async findVariantInfoMany(variantIds: string[]): Promise<Map<string, CartVariantInfo>> {
    if (variantIds.length === 0) return new Map();

    const rows = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: VARIANT_INCLUDE,
    });
    return new Map(rows.map((row) => [row.id, toInfo(row)]));
  }
}
