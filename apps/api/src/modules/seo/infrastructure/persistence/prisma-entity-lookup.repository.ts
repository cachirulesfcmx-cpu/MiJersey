import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { EntityLookupPort } from '../../domain/ports/entity-lookup.port';
import { SeoEntityType } from '../../domain/value-objects/seo-enums';

@Injectable()
export class PrismaEntityLookupRepository implements EntityLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(entityType: SeoEntityType, entityId: string): Promise<boolean> {
    switch (entityType) {
      case SeoEntityType.PRODUCT:
        return (await this.prisma.product.count({ where: { id: entityId } })) > 0;
      case SeoEntityType.CATEGORY:
        return (await this.prisma.category.count({ where: { id: entityId } })) > 0;
      case SeoEntityType.COLLECTION:
        return (await this.prisma.collection.count({ where: { id: entityId } })) > 0;
      case SeoEntityType.BRAND:
        return (await this.prisma.brand.count({ where: { id: entityId } })) > 0;
      default:
        return false;
    }
  }
}
