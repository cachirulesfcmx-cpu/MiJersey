import { Injectable } from '@nestjs/common';
import type { HomeSection as PrismaHomeSection, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import type {
  CreateHomeSectionData,
  HomeSectionRepositoryPort,
  UpdateHomeSectionData,
} from '../../domain/ports/home-section.repository.port';
import type { HomeSectionConfiguration } from '../../domain/value-objects/home-section-config';
import { HomeSectionStatus, HomeSectionType } from '../../domain/value-objects/home-section-enums';

@Injectable()
export class PrismaHomeSectionRepository implements HomeSectionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<HomeSectionEntity[]> {
    const rows = await this.prisma.homeSection.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map((row) => this.toEntity(row));
  }

  async findPublished(): Promise<HomeSectionEntity[]> {
    const rows = await this.prisma.homeSection.findMany({
      where: { status: HomeSectionStatus.PUBLISHED, isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<HomeSectionEntity | null> {
    const row = await this.prisma.homeSection.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateHomeSectionData): Promise<HomeSectionEntity> {
    const row = await this.prisma.homeSection.create({
      data: {
        type: data.type,
        title: data.title,
        configuration: data.configuration as Prisma.InputJsonValue,
        sortOrder: data.sortOrder,
        status: data.status,
        isVisible: data.isVisible,
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateHomeSectionData): Promise<HomeSectionEntity> {
    const row = await this.prisma.homeSection.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.configuration !== undefined
          ? { configuration: data.configuration as Prisma.InputJsonValue }
          : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.isVisible !== undefined ? { isVisible: data.isVisible } : {}),
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.homeSection.delete({ where: { id } });
  }

  async reorder(order: string[]): Promise<void> {
    await this.prisma.$transaction(
      order.map((id, index) =>
        this.prisma.homeSection.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  async maxSortOrder(): Promise<number> {
    const top = await this.prisma.homeSection.findFirst({ orderBy: { sortOrder: 'desc' } });
    return top?.sortOrder ?? -1;
  }

  private toEntity(row: PrismaHomeSection): HomeSectionEntity {
    return new HomeSectionEntity({
      id: row.id,
      type: row.type as HomeSectionType,
      title: row.title,
      configuration: row.configuration as HomeSectionConfiguration,
      sortOrder: row.sortOrder,
      status: row.status as HomeSectionStatus,
      isVisible: row.isVisible,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
