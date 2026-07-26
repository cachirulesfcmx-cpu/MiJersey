import { Injectable } from '@nestjs/common';
import type { Category as PrismaCategory } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CategoryEntity } from '../../domain/entities/category.entity';
import type {
  CategoryRepositoryPort,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/ports/category.repository.port';
import type { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CategoryEntity | null> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    return category ? this.toEntity(category) : null;
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    return category ? this.toEntity(category) : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { slug } });
    return count > 0;
  }

  async findAll(): Promise<CategoryEntity[]> {
    const categories = await this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    return categories.map((category) => this.toEntity(category));
  }

  async findPublicAll(): Promise<CategoryEntity[]> {
    const categories = await this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map((category) => this.toEntity(category));
  }

  async create(data: CreateCategoryData): Promise<CategoryEntity> {
    const category = await this.prisma.category.create({ data });
    return this.toEntity(category);
  }

  async update(id: string, data: UpdateCategoryData): Promise<CategoryEntity> {
    const category = await this.prisma.category.update({ where: { id }, data });
    return this.toEntity(category);
  }

  async move(id: string, parentId: string | null): Promise<CategoryEntity> {
    const category = await this.prisma.category.update({ where: { id }, data: { parentId } });
    return this.toEntity(category);
  }

  async reorder(_parentId: string | null, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.category.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { parentId: id } });
    return count > 0;
  }

  async assignProducts(categoryId: string, productIds: string[]): Promise<void> {
    await this.prisma.productCategory.createMany({
      data: productIds.map((productId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });
  }

  async removeProduct(categoryId: string, productId: string): Promise<void> {
    await this.prisma.productCategory.deleteMany({ where: { categoryId, productId } });
  }

  async listProductIds(categoryId: string): Promise<string[]> {
    const rows = await this.prisma.productCategory.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
      select: { productId: true },
    });
    return rows.map((row) => row.productId);
  }

  private toEntity(category: PrismaCategory): CategoryEntity {
    return new CategoryEntity({
      id: category.id,
      parentId: category.parentId,
      slug: category.slug,
      name: category.name,
      description: category.description,
      image: category.image,
      sortOrder: category.sortOrder,
      status: category.status as CategoryStatus,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  }
}
