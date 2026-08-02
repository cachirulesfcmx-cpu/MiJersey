import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { EmailTemplate as PrismaEmailTemplate } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import type {
  CreateEmailTemplateData,
  EmailTemplateRepositoryPort,
  ListEmailTemplatesParams,
  UpdateEmailTemplateData,
} from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateStatus } from '../../domain/value-objects/email-template-enums';

function toEntity(row: PrismaEmailTemplate): EmailTemplateEntity {
  return new EmailTemplateEntity({
    id: row.id,
    name: row.name,
    key: row.key,
    language: row.language,
    subject: row.subject,
    html: row.html,
    text: row.text,
    status: row.status as unknown as EmailTemplateStatus,
    version: row.version,
    layoutId: row.layoutId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaEmailTemplateRepository implements EmailTemplateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<EmailTemplateEntity | null> {
    const row = await this.prisma.emailTemplate.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByKeyAndLanguage(key: string, language: string): Promise<EmailTemplateEntity | null> {
    const row = await this.prisma.emailTemplate.findUnique({
      where: { key_language: { key, language } },
    });
    return row ? toEntity(row) : null;
  }

  async findMany(params: ListEmailTemplatesParams): Promise<PaginatedResult<EmailTemplateEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = {
      ...(params.key ? { key: params.key } : {}),
      ...(params.language ? { language: params.language } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        orderBy: [{ key: 'asc' }, { language: 'asc' }],
        skip,
        take: params.pageSize,
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async create(data: CreateEmailTemplateData): Promise<EmailTemplateEntity> {
    const row = await this.prisma.emailTemplate.create({
      data: {
        name: data.name,
        key: data.key,
        language: data.language,
        subject: data.subject,
        html: data.html,
        text: data.text,
        ...(data.layoutId !== undefined ? { layoutId: data.layoutId } : {}),
      },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplateEntity> {
    const row = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.subject !== undefined ? { subject: data.subject } : {}),
        ...(data.html !== undefined ? { html: data.html } : {}),
        ...(data.text !== undefined ? { text: data.text } : {}),
        ...(data.layoutId !== undefined ? { layoutId: data.layoutId } : {}),
        version: { increment: 1 },
      },
    });
    return toEntity(row);
  }

  async updateStatus(id: string, status: EmailTemplateStatus): Promise<EmailTemplateEntity> {
    const row = await this.prisma.emailTemplate.update({
      where: { id },
      data: { status },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailTemplate.delete({ where: { id } });
  }
}
