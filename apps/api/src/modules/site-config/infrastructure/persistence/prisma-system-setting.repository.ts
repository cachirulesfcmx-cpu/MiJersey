import { Injectable } from '@nestjs/common';
import type { Prisma, SystemSetting as PrismaSystemSetting } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { SystemSettingEntity } from '../../domain/entities/system-setting.entity';
import type {
  SystemSettingRepositoryPort,
  UpsertSystemSettingData,
} from '../../domain/ports/system-setting.repository.port';

function toEntity(row: PrismaSystemSetting): SystemSettingEntity {
  return new SystemSettingEntity({
    id: row.id,
    key: row.key,
    value: row.value,
    category: row.category,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaSystemSettingRepository implements SystemSettingRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(category?: string): Promise<SystemSettingEntity[]> {
    const rows = await this.prisma.systemSetting.findMany({
      ...(category ? { where: { category } } : {}),
      orderBy: { key: 'asc' },
    });
    return rows.map(toEntity);
  }

  async upsertMany(entries: UpsertSystemSettingData[]): Promise<SystemSettingEntity[]> {
    const rows = await Promise.all(
      entries.map((entry) =>
        this.prisma.systemSetting.upsert({
          where: { key: entry.key },
          create: {
            key: entry.key,
            value: entry.value as Prisma.InputJsonValue,
            category: entry.category,
          },
          update: { value: entry.value as Prisma.InputJsonValue, category: entry.category },
        }),
      ),
    );
    return rows.map(toEntity);
  }
}
