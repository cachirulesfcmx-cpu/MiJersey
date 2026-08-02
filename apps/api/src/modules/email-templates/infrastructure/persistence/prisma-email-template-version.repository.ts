import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { EmailTemplateVersion as PrismaEmailTemplateVersion } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { EmailTemplateSnapshot } from '../../domain/entities/email-template-version.entity';
import { EmailTemplateVersionEntity } from '../../domain/entities/email-template-version.entity';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';

function toEntity(row: PrismaEmailTemplateVersion): EmailTemplateVersionEntity {
  return new EmailTemplateVersionEntity({
    id: row.id,
    templateId: row.templateId,
    versionNumber: row.versionNumber,
    snapshot: row.snapshot as unknown as EmailTemplateSnapshot,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaEmailTemplateVersionRepository implements EmailTemplateVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByTemplateAndNumber(
    templateId: string,
    versionNumber: number,
  ): Promise<EmailTemplateVersionEntity | null> {
    const row = await this.prisma.emailTemplateVersion.findUnique({
      where: { templateId_versionNumber: { templateId, versionNumber } },
    });
    return row ? toEntity(row) : null;
  }

  async findMany(
    templateId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<EmailTemplateVersionEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = { templateId };

    const [rows, total] = await Promise.all([
      this.prisma.emailTemplateVersion.findMany({
        where,
        orderBy: { versionNumber: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.emailTemplateVersion.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async getNextVersionNumber(templateId: string): Promise<number> {
    const last = await this.prisma.emailTemplateVersion.findFirst({
      where: { templateId },
      orderBy: { versionNumber: 'desc' },
    });
    return (last?.versionNumber ?? 0) + 1;
  }

  async create(
    templateId: string,
    snapshot: EmailTemplateSnapshot,
  ): Promise<EmailTemplateVersionEntity> {
    const versionNumber = await this.getNextVersionNumber(templateId);
    const row = await this.prisma.emailTemplateVersion.create({
      data: { templateId, versionNumber, snapshot: snapshot as object },
    });
    return toEntity(row);
  }
}
