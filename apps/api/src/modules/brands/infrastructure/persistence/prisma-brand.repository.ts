import { Injectable } from '@nestjs/common';
import type { Brand as PrismaBrand, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { BrandEntity } from '../../domain/entities/brand.entity';
import type {
  BrandRepositoryPort,
  CreateBrandData,
  ListBrandsParams,
  ListBrandsResult,
  UpdateBrandData,
} from '../../domain/ports/brand.repository.port';
import { BrandStatus } from '../../domain/value-objects/brand-status';

@Injectable()
export class PrismaBrandRepository implements BrandRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BrandEntity | null> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    return brand ? this.toEntity(brand) : null;
  }

  async findBySlug(slug: string): Promise<BrandEntity | null> {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    return brand ? this.toEntity(brand) : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.brand.count({ where: { slug } });
    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.brand.count({ where: { name } });
    return count > 0;
  }

  async findMany(params: ListBrandsParams): Promise<ListBrandsResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.BrandWhereInput = {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { slug: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return { items: items.map((item) => this.toEntity(item)), total };
  }

  async findPublicBySlug(slug: string): Promise<BrandEntity | null> {
    const brand = await this.prisma.brand.findFirst({ where: { slug, status: 'ACTIVE' } });
    return brand ? this.toEntity(brand) : null;
  }

  async findAllActive(): Promise<BrandEntity[]> {
    const brands = await this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
    });
    return brands.map((brand) => this.toEntity(brand));
  }

  async create(data: CreateBrandData): Promise<BrandEntity> {
    const brand = await this.prisma.brand.create({ data });
    return this.toEntity(brand);
  }

  async update(id: string, data: UpdateBrandData): Promise<BrandEntity> {
    const brand = await this.prisma.brand.update({ where: { id }, data });
    return this.toEntity(brand);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.brand.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.brand.delete({ where: { id } });
  }

  private toEntity(brand: PrismaBrand): BrandEntity {
    return new BrandEntity({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      description: brand.description,
      shortDescription: brand.shortDescription,
      logoMediaId: brand.logoMediaId,
      coverMediaId: brand.coverMediaId,
      website: brand.website,
      country: brand.country,
      status: brand.status as BrandStatus,
      sortOrder: brand.sortOrder,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    });
  }
}
