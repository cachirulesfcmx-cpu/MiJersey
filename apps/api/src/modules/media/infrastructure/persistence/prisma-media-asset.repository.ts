import { Injectable } from '@nestjs/common';
import type {
  AssetTag as PrismaAssetTag,
  MediaAsset as PrismaMediaAsset,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AssetTagEntity } from '../../domain/entities/asset-tag.entity';
import { MediaAssetEntity } from '../../domain/entities/media-asset.entity';
import type {
  CreateMediaAssetData,
  ListMediaAssetsParams,
  ListMediaAssetsResult,
  MediaAssetRepositoryPort,
  UpdateMediaAssetData,
} from '../../domain/ports/media-asset.repository.port';
import type { MediaAssetStatus, MediaType } from '../../domain/value-objects/media-enums';

type MediaAssetWithTags = PrismaMediaAsset & { tags: { assetTag: PrismaAssetTag }[] };

const WITH_TAGS = { tags: { include: { assetTag: true } } } satisfies Prisma.MediaAssetInclude;

@Injectable()
export class PrismaMediaAssetRepository implements MediaAssetRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MediaAssetEntity | null> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id }, include: WITH_TAGS });
    return asset ? this.toEntity(asset) : null;
  }

  async findByContentHash(contentHash: string): Promise<MediaAssetEntity | null> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { contentHash },
      include: WITH_TAGS,
    });
    return asset ? this.toEntity(asset) : null;
  }

  async findMany(params: ListMediaAssetsParams): Promise<ListMediaAssetsResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.MediaAssetWhereInput = {
      ...(filter?.folderId ? { folderId: filter.folderId } : {}),
      ...(filter?.type ? { type: filter.type } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.tagId ? { tags: { some: { assetTagId: filter.tagId } } } : {}),
      ...(filter?.search
        ? {
            OR: [
              { originalName: { contains: filter.search, mode: 'insensitive' } },
              { title: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        include: WITH_TAGS,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return { items: items.map((item) => this.toEntity(item)), total };
  }

  async create(data: CreateMediaAssetData): Promise<MediaAssetEntity> {
    const asset = await this.prisma.mediaAsset.create({ data, include: WITH_TAGS });
    return this.toEntity(asset);
  }

  async update(id: string, data: UpdateMediaAssetData): Promise<MediaAssetEntity> {
    const asset = await this.prisma.mediaAsset.update({ where: { id }, data, include: WITH_TAGS });
    return this.toEntity(asset);
  }

  async replaceTags(id: string, tagIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mediaAssetTag.deleteMany({ where: { mediaAssetId: id } }),
      this.prisma.mediaAssetTag.createMany({
        data: tagIds.map((assetTagId) => ({ mediaAssetId: id, assetTagId })),
        skipDuplicates: true,
      }),
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mediaAsset.delete({ where: { id } });
  }

  private toEntity(asset: MediaAssetWithTags): MediaAssetEntity {
    return new MediaAssetEntity({
      id: asset.id,
      filename: asset.filename,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      type: asset.type as MediaType,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      altText: asset.altText,
      title: asset.title,
      status: asset.status as MediaAssetStatus,
      contentHash: asset.contentHash,
      storageKey: asset.storageKey,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      folderId: asset.folderId,
      tags: asset.tags.map(
        (tag) =>
          new AssetTagEntity({
            id: tag.assetTag.id,
            name: tag.assetTag.name,
            slug: tag.assetTag.slug,
          }),
      ),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });
  }
}
