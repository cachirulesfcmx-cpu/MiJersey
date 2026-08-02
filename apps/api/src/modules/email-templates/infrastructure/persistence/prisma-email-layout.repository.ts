import { Injectable } from '@nestjs/common';
import type { EmailLayout as PrismaEmailLayout } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { EmailLayoutEntity } from '../../domain/entities/email-layout.entity';
import type {
  EmailLayoutRepositoryPort,
  UpsertEmailLayoutData,
} from '../../domain/ports/email-layout.repository.port';

function toEntity(row: PrismaEmailLayout): EmailLayoutEntity {
  return new EmailLayoutEntity({
    id: row.id,
    name: row.name,
    html: row.html,
    css: row.css,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaEmailLayoutRepository implements EmailLayoutRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<EmailLayoutEntity | null> {
    const row = await this.prisma.emailLayout.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findMany(): Promise<EmailLayoutEntity[]> {
    const rows = await this.prisma.emailLayout.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toEntity);
  }

  async create(data: UpsertEmailLayoutData): Promise<EmailLayoutEntity> {
    const row = await this.prisma.emailLayout.create({
      data: { name: data.name, html: data.html, css: data.css ?? null },
    });
    return toEntity(row);
  }

  async update(id: string, data: Partial<UpsertEmailLayoutData>): Promise<EmailLayoutEntity> {
    const row = await this.prisma.emailLayout.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.html !== undefined ? { html: data.html } : {}),
        ...(data.css !== undefined ? { css: data.css } : {}),
      },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailLayout.delete({ where: { id } });
  }
}
