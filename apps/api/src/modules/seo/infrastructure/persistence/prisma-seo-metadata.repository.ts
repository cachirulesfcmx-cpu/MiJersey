import { Injectable } from '@nestjs/common';
import type { SeoMetadata as PrismaSeoMetadata } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { SeoMetadataEntity } from '../../domain/entities/seo-metadata.entity';
import type {
  SeoMetadataRepositoryPort,
  UpsertSeoMetadataData,
} from '../../domain/ports/seo-metadata.repository.port';
import {
  SeoEntityType,
  SeoRobotsDirective,
  SeoTwitterCardType,
} from '../../domain/value-objects/seo-enums';

@Injectable()
export class PrismaSeoMetadataRepository implements SeoMetadataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntity(
    entityType: SeoEntityType,
    entityId: string,
  ): Promise<SeoMetadataEntity | null> {
    const record = await this.prisma.seoMetadata.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });
    return record ? this.toEntity(record) : null;
  }

  async upsert(
    entityType: SeoEntityType,
    entityId: string,
    data: UpsertSeoMetadataData,
  ): Promise<SeoMetadataEntity> {
    const shared = {
      ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
      ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
      ...(data.metaKeywords !== undefined ? { metaKeywords: data.metaKeywords } : {}),
      ...(data.canonicalUrl !== undefined ? { canonicalUrl: data.canonicalUrl } : {}),
      ...(data.robots !== undefined ? { robots: data.robots } : {}),
      ...(data.ogTitle !== undefined ? { ogTitle: data.ogTitle } : {}),
      ...(data.ogDescription !== undefined ? { ogDescription: data.ogDescription } : {}),
      ...(data.ogImageMediaId !== undefined ? { ogImageMediaId: data.ogImageMediaId } : {}),
      ...(data.twitterCard !== undefined ? { twitterCard: data.twitterCard } : {}),
      ...(data.structuredData !== undefined
        ? { structuredData: (data.structuredData ?? Prisma.JsonNull) as Prisma.InputJsonValue }
        : {}),
    };

    const record = await this.prisma.seoMetadata.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: { entityType, entityId, ...shared },
      update: shared,
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaSeoMetadata): SeoMetadataEntity {
    return new SeoMetadataEntity({
      id: record.id,
      entityType: record.entityType as SeoEntityType,
      entityId: record.entityId,
      metaTitle: record.metaTitle,
      metaDescription: record.metaDescription,
      metaKeywords: record.metaKeywords,
      canonicalUrl: record.canonicalUrl,
      robots: record.robots as SeoRobotsDirective,
      ogTitle: record.ogTitle,
      ogDescription: record.ogDescription,
      ogImageMediaId: record.ogImageMediaId,
      twitterCard: record.twitterCard as SeoTwitterCardType,
      structuredData: record.structuredData as Record<string, unknown> | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
