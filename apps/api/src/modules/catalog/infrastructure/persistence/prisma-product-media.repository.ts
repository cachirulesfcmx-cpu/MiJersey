import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  ProductMediaItem,
  ProductMediaRepositoryPort,
} from '../../domain/ports/product-media.repository.port';

@Injectable()
export class PrismaProductMediaRepository implements ProductMediaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(productId: string): Promise<ProductMediaItem[]> {
    const rows = await this.prisma.productMedia.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => ({ mediaId: row.mediaId, sortOrder: row.sortOrder }));
  }

  async replaceAll(productId: string, mediaIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productMedia.deleteMany({ where: { productId } }),
      ...mediaIds.map((mediaId, index) =>
        this.prisma.productMedia.create({ data: { productId, mediaId, sortOrder: index } }),
      ),
    ]);
  }
}
