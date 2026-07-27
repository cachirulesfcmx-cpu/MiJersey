import { Injectable } from '@nestjs/common';
import type {
  Attribute as PrismaAttribute,
  AttributeValue as PrismaAttributeValue,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AttributeEntity } from '../../domain/entities/attribute.entity';
import { AttributeValueEntity } from '../../domain/entities/attribute-value.entity';
import type {
  AttributeRepositoryPort,
  AttributeValueInput,
  CreateAttributeData,
  ListAttributesParams,
  ListAttributesResult,
  UpdateAttributeData,
} from '../../domain/ports/attribute.repository.port';
import type { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';

type AttributeWithValues = PrismaAttribute & { values: PrismaAttributeValue[] };

const WITH_ORDERED_VALUES = { values: { orderBy: { sortOrder: 'asc' as const } } };
const NOT_DELETED: Prisma.AttributeWhereInput = { deletedAt: null };

@Injectable()
export class PrismaAttributeRepository implements AttributeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AttributeEntity | null> {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id, ...NOT_DELETED },
      include: WITH_ORDERED_VALUES,
    });
    return attribute ? this.toEntity(attribute) : null;
  }

  async findByCode(code: string): Promise<AttributeEntity | null> {
    const attribute = await this.prisma.attribute.findFirst({
      where: { code, ...NOT_DELETED },
      include: WITH_ORDERED_VALUES,
    });
    return attribute ? this.toEntity(attribute) : null;
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.attribute.count({ where: { code, ...NOT_DELETED } });
    return count > 0;
  }

  async findByIds(ids: string[]): Promise<AttributeEntity[]> {
    if (ids.length === 0) return [];
    const attributes = await this.prisma.attribute.findMany({
      where: { id: { in: ids }, ...NOT_DELETED },
      include: WITH_ORDERED_VALUES,
    });
    return attributes.map((attribute) => this.toEntity(attribute));
  }

  async findAllFilterable(): Promise<AttributeEntity[]> {
    const attributes = await this.prisma.attribute.findMany({
      where: { ...NOT_DELETED, status: 'ACTIVE', isFilterable: true },
      include: WITH_ORDERED_VALUES,
      orderBy: { sortOrder: 'asc' },
    });
    return attributes.map((attribute) => this.toEntity(attribute));
  }

  async findMany(params: ListAttributesParams): Promise<ListAttributesResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.AttributeWhereInput = {
      ...NOT_DELETED,
      ...(filter?.status?.length ? { status: { in: filter.status } } : {}),
      ...(filter?.type?.length ? { type: { in: filter.type } } : {}),
      ...(filter?.isFilterable !== undefined ? { isFilterable: filter.isFilterable } : {}),
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { code: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.attribute.findMany({
        where,
        include: WITH_ORDERED_VALUES,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.attribute.count({ where }),
    ]);

    return { items: items.map((attribute) => this.toEntity(attribute)), total };
  }

  async create(data: CreateAttributeData): Promise<AttributeEntity> {
    const attribute = await this.prisma.attribute.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        isFilterable: data.isFilterable,
        isComparable: data.isComparable,
        isRequired: data.isRequired,
        values: {
          create: data.values.map((value, index) => ({
            value: value.value,
            label: value.label,
            sortOrder: index,
          })),
        },
      },
      include: WITH_ORDERED_VALUES,
    });
    return this.toEntity(attribute);
  }

  async update(id: string, data: UpdateAttributeData): Promise<AttributeEntity> {
    const attribute = await this.prisma.attribute.update({
      where: { id },
      data,
      include: WITH_ORDERED_VALUES,
    });
    return this.toEntity(attribute);
  }

  async replaceValues(attributeId: string, values: AttributeValueInput[]): Promise<void> {
    const current = await this.prisma.attributeValue.findMany({ where: { attributeId } });
    const currentByValue = new Map(current.map((value) => [value.value, value]));
    const desiredValues = new Set(values.map((value) => value.value));
    const toDelete = current.filter((value) => !desiredValues.has(value.value));

    await this.prisma.$transaction([
      ...(toDelete.length > 0
        ? [
            this.prisma.attributeValue.deleteMany({
              where: { id: { in: toDelete.map((v) => v.id) } },
            }),
          ]
        : []),
      ...values.map((value, index) => {
        const existing = currentByValue.get(value.value);
        return existing
          ? this.prisma.attributeValue.update({
              where: { id: existing.id },
              data: { label: value.label, sortOrder: index },
            })
          : this.prisma.attributeValue.create({
              data: { attributeId, value: value.value, label: value.label, sortOrder: index },
            });
      }),
    ]);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.attribute.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async countAssignments(attributeId: string): Promise<number> {
    return this.prisma.productAttribute.count({ where: { attributeId } });
  }

  async countValueAssignments(valueId: string): Promise<number> {
    return this.prisma.productAttribute.count({ where: { valueId } });
  }

  private toEntity(attribute: AttributeWithValues): AttributeEntity {
    return new AttributeEntity({
      id: attribute.id,
      code: attribute.code,
      name: attribute.name,
      type: attribute.type as AttributeType,
      isFilterable: attribute.isFilterable,
      isComparable: attribute.isComparable,
      isRequired: attribute.isRequired,
      sortOrder: attribute.sortOrder,
      status: attribute.status as AttributeStatus,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
      values: attribute.values.map(
        (value) =>
          new AttributeValueEntity({
            id: value.id,
            attributeId: value.attributeId,
            value: value.value,
            label: value.label,
            sortOrder: value.sortOrder,
          }),
      ),
    });
  }
}
