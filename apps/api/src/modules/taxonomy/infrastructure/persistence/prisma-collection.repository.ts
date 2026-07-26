import { Injectable } from '@nestjs/common';
import type {
  Collection as PrismaCollection,
  CollectionRule as PrismaCollectionRule,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CollectionEntity } from '../../domain/entities/collection.entity';
import type {
  CollectionRepositoryPort,
  CollectionRuleInput,
  CreateCollectionData,
  ListCollectionsParams,
  ListCollectionsResult,
  UpdateCollectionData,
} from '../../domain/ports/collection.repository.port';
import type {
  CollectionRuleField,
  CollectionRuleMatchType,
  CollectionRuleOperator,
  CollectionStatus,
  CollectionType,
} from '../../domain/value-objects/taxonomy-enums';

type CollectionWithRules = PrismaCollection & { rules: PrismaCollectionRule[] };

const WITH_RULES = { rules: true } as const;

@Injectable()
export class PrismaCollectionRepository implements CollectionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CollectionEntity | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: WITH_RULES,
    });
    return collection ? this.toEntity(collection) : null;
  }

  async findBySlug(slug: string): Promise<CollectionEntity | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      include: WITH_RULES,
    });
    return collection ? this.toEntity(collection) : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.collection.count({ where: { slug } });
    return count > 0;
  }

  async create(data: CreateCollectionData): Promise<CollectionEntity> {
    const collection = await this.prisma.collection.create({ data, include: WITH_RULES });
    return this.toEntity(collection);
  }

  async update(id: string, data: UpdateCollectionData): Promise<CollectionEntity> {
    const collection = await this.prisma.collection.update({
      where: { id },
      data,
      include: WITH_RULES,
    });
    return this.toEntity(collection);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id } });
  }

  async findMany(params: ListCollectionsParams): Promise<ListCollectionsResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.CollectionWhereInput = {
      ...(filter?.status?.length ? { status: { in: filter.status } } : {}),
      ...(filter?.type?.length ? { type: { in: filter.type } } : {}),
      ...(filter?.search ? { name: { contains: filter.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: WITH_RULES,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.collection.count({ where }),
    ]);

    return { items: items.map((collection) => this.toEntity(collection)), total };
  }

  async findManyPublic(params: {
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<ListCollectionsResult> {
    const where: Prisma.CollectionWhereInput = {
      status: 'ACTIVE',
      ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: WITH_RULES,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.collection.count({ where }),
    ]);

    return { items: items.map((collection) => this.toEntity(collection)), total };
  }

  async replaceRules(
    collectionId: string,
    matchType: CollectionRuleMatchType,
    rules: CollectionRuleInput[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.collectionRule.deleteMany({ where: { collectionId } }),
      this.prisma.collection.update({ where: { id: collectionId }, data: { matchType } }),
      this.prisma.collectionRule.createMany({
        data: rules.map((rule) => ({ ...rule, collectionId })),
      }),
    ]);
  }

  async addProducts(collectionId: string, productIds: string[]): Promise<void> {
    const currentMax = await this.prisma.collectionProduct.aggregate({
      where: { collectionId },
      _max: { sortOrder: true },
    });
    const startOrder = (currentMax._max.sortOrder ?? -1) + 1;

    await this.prisma.collectionProduct.createMany({
      data: productIds.map((productId, index) => ({
        collectionId,
        productId,
        sortOrder: startOrder + index,
      })),
      skipDuplicates: true,
    });
  }

  async removeProduct(collectionId: string, productId: string): Promise<void> {
    await this.prisma.collectionProduct.deleteMany({ where: { collectionId, productId } });
  }

  async reorderProducts(collectionId: string, orderedProductIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedProductIds.map((productId, index) =>
        this.prisma.collectionProduct.update({
          where: { collectionId_productId: { collectionId, productId } },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async listManualProductIds(collectionId: string): Promise<string[]> {
    const rows = await this.prisma.collectionProduct.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
      select: { productId: true },
    });
    return rows.map((row) => row.productId);
  }

  private toEntity(collection: CollectionWithRules): CollectionEntity {
    return new CollectionEntity({
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      type: collection.type as CollectionType,
      status: collection.status as CollectionStatus,
      matchType: collection.matchType as CollectionRuleMatchType,
      rules: collection.rules.map((rule) => ({
        id: rule.id,
        field: rule.field as CollectionRuleField,
        operator: rule.operator as CollectionRuleOperator,
        value: rule.value,
      })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    });
  }
}
