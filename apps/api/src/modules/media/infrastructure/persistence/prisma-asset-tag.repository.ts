import { slugify } from '@mijersey/shared-utils';
import { Injectable } from '@nestjs/common';
import type { AssetTag as PrismaAssetTag } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AssetTagEntity } from '../../domain/entities/asset-tag.entity';
import type { AssetTagRepositoryPort } from '../../domain/ports/asset-tag.repository.port';

@Injectable()
export class PrismaAssetTagRepository implements AssetTagRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AssetTagEntity | null> {
    const tag = await this.prisma.assetTag.findUnique({ where: { id } });
    return tag ? this.toEntity(tag) : null;
  }

  async findByIds(ids: string[]): Promise<AssetTagEntity[]> {
    const tags = await this.prisma.assetTag.findMany({ where: { id: { in: ids } } });
    return tags.map((tag) => this.toEntity(tag));
  }

  async findAll(): Promise<AssetTagEntity[]> {
    const tags = await this.prisma.assetTag.findMany({ orderBy: { name: 'asc' } });
    return tags.map((tag) => this.toEntity(tag));
  }

  async findOrCreateByNames(names: string[]): Promise<AssetTagEntity[]> {
    const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];

    const tags: AssetTagEntity[] = [];
    for (const name of uniqueNames) {
      const tag = await this.prisma.assetTag.upsert({
        where: { name },
        create: { name, slug: slugify(name) },
        update: {},
      });
      tags.push(this.toEntity(tag));
    }

    return tags;
  }

  private toEntity(tag: PrismaAssetTag): AssetTagEntity {
    return new AssetTagEntity({ id: tag.id, name: tag.name, slug: tag.slug });
  }
}
