import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  MediaAssetUsageRecord,
  MediaAssetUsageRepositoryPort,
} from '../../domain/ports/media-usage.repository.port';

@Injectable()
export class PrismaMediaAssetUsageRepository implements MediaAssetUsageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(mediaAssetId: string, referenceType: string, referenceId: string): Promise<void> {
    await this.prisma.mediaAssetUsage.upsert({
      where: {
        mediaAssetId_referenceType_referenceId: { mediaAssetId, referenceType, referenceId },
      },
      create: { mediaAssetId, referenceType, referenceId },
      update: {},
    });
  }

  async remove(mediaAssetId: string, referenceType: string, referenceId: string): Promise<void> {
    await this.prisma.mediaAssetUsage.deleteMany({
      where: { mediaAssetId, referenceType, referenceId },
    });
  }

  async countByAsset(mediaAssetId: string): Promise<number> {
    return this.prisma.mediaAssetUsage.count({ where: { mediaAssetId } });
  }

  async findByAsset(mediaAssetId: string): Promise<MediaAssetUsageRecord[]> {
    const rows = await this.prisma.mediaAssetUsage.findMany({
      where: { mediaAssetId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      mediaAssetId: row.mediaAssetId,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      createdAt: row.createdAt,
    }));
  }
}
