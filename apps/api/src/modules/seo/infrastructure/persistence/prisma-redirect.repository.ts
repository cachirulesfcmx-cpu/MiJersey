import { Injectable } from '@nestjs/common';
import type { Redirect as PrismaRedirect } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { RedirectEntity } from '../../domain/entities/redirect.entity';
import type {
  CreateRedirectData,
  ListRedirectsParams,
  ListRedirectsResult,
  RedirectRepositoryPort,
} from '../../domain/ports/redirect.repository.port';

@Injectable()
export class PrismaRedirectRepository implements RedirectRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RedirectEntity | null> {
    const record = await this.prisma.redirect.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findByFromPath(fromPath: string): Promise<RedirectEntity | null> {
    const record = await this.prisma.redirect.findUnique({ where: { fromPath } });
    return record ? this.toEntity(record) : null;
  }

  async findMany(params: ListRedirectsParams): Promise<ListRedirectsResult> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.redirect.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.redirect.count(),
    ]);

    return { items: items.map((item) => this.toEntity(item)), total };
  }

  async create(data: CreateRedirectData): Promise<RedirectEntity> {
    const record = await this.prisma.redirect.create({ data });
    return this.toEntity(record);
  }

  async upsertByFromPath(data: CreateRedirectData): Promise<RedirectEntity> {
    const record = await this.prisma.redirect.upsert({
      where: { fromPath: data.fromPath },
      create: data,
      update: { toPath: data.toPath, statusCode: data.statusCode },
    });
    return this.toEntity(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.redirect.delete({ where: { id } });
  }

  private toEntity(record: PrismaRedirect): RedirectEntity {
    return new RedirectEntity({
      id: record.id,
      fromPath: record.fromPath,
      toPath: record.toPath,
      statusCode: record.statusCode,
      createdAt: record.createdAt,
    });
  }
}
