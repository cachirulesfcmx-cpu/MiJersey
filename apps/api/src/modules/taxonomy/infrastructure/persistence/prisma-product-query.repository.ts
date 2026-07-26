import { Injectable } from '@nestjs/common';
import type { Prisma, Product as PrismaProduct, ProductStatus, ProductType } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  FindMatchingRulesParams,
  ProductQueryPort,
  ProductSummary,
  SmartRuleInput,
} from '../../domain/ports/product-query.port';

const VALID_PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL'];
const VALID_PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
/** Condición que nunca puede cumplirse; se usa cuando una regla trae un valor fuera de rango. */
const NEVER_MATCHES: Prisma.ProductWhereInput = { id: '' };

function buildCondition(rule: SmartRuleInput): Prisma.ProductWhereInput {
  switch (rule.field) {
    case 'NAME':
      return rule.operator === 'CONTAINS'
        ? { name: { contains: rule.value, mode: 'insensitive' } }
        : { name: { equals: rule.value, mode: 'insensitive' } };
    case 'SKU':
      return rule.operator === 'CONTAINS'
        ? { sku: { contains: rule.value, mode: 'insensitive' } }
        : { sku: { equals: rule.value.toUpperCase() } };
    case 'TYPE':
      return VALID_PRODUCT_TYPES.includes(rule.value)
        ? { type: rule.value as ProductType }
        : NEVER_MATCHES;
    case 'STATUS':
      return VALID_PRODUCT_STATUSES.includes(rule.value)
        ? { status: rule.value as ProductStatus }
        : NEVER_MATCHES;
    default:
      return NEVER_MATCHES;
  }
}

function buildRulesWhere(
  rules: SmartRuleInput[],
  matchType: 'ALL' | 'ANY',
): Prisma.ProductWhereInput {
  if (rules.length === 0) return {};
  const conditions = rules.map(buildCondition);
  return matchType === 'ALL' ? { AND: conditions } : { OR: conditions };
}

@Injectable()
export class PrismaProductQueryRepository implements ProductQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(productId: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { id: productId, deletedAt: null } });
    return count > 0;
  }

  async findByIds(productIds: string[]): Promise<ProductSummary[]> {
    if (productIds.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
    });
    return products.map((product) => this.toSummary(product));
  }

  async findMatchingRules(
    params: FindMatchingRulesParams,
  ): Promise<{ items: ProductSummary[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...buildRulesWhere(params.rules, params.matchType),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map((product) => this.toSummary(product)), total };
  }

  private toSummary(product: PrismaProduct): ProductSummary {
    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      type: product.type,
      status: product.status,
      visibility: product.visibility,
    };
  }
}
