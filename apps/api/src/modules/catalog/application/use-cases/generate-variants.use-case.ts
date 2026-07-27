import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  PRODUCT_OPTION_REPOSITORY,
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from '../../catalog.constants';
import type { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type {
  CreateVariantData,
  ProductVariantRepositoryPort,
} from '../../domain/ports/product-variant.repository.port';
import { cartesianProduct, computeCombinationKey } from './variant-combination.util';

export interface GenerateVariantsInput {
  productId: string;
  basePrice?: number;
  actorUserId: string;
  ipAddress: string | null;
}

export interface GenerateVariantsResult {
  created: number;
  skippedExisting: number;
}

/** Convierte un valor de opción en un token seguro para SKU (mayúsculas/números) o slug. */
function toSkuToken(value: string, fallback: string): string {
  const token = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();
  return token || fallback;
}

@Injectable()
export class GenerateVariantsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: GenerateVariantsInput): Promise<GenerateVariantsResult> {
    const product = await this.products.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const productOptions = await this.options.findByProductId(input.productId);
    const valueGroups: ProductOptionValueEntity[][] = productOptions.map((option) => option.values);
    const combinations = productOptions.length === 0 ? [[]] : cartesianProduct(valueGroups);

    const existingKeys = await this.variants.existingCombinationKeys(input.productId);
    const basePrice = input.basePrice ?? 0;

    const toCreate: CreateVariantData[] = [];
    let skippedExisting = 0;

    for (const [index, combo] of combinations.entries()) {
      const optionValueIds = combo.map((value) => value.id);
      const combinationKey = computeCombinationKey(optionValueIds);

      if (existingKeys.has(combinationKey)) {
        skippedExisting += 1;
        continue;
      }

      const skuSuffix = combo.length
        ? combo.map((value) => toSkuToken(value.value, `V${index}`)).join('-')
        : 'DEFAULT';
      const slugSuffix = combo.length
        ? combo.map((value) => slugify(value.value) || `v${index}`).join('-')
        : 'default';

      toCreate.push({
        productId: input.productId,
        sku: await this.findAvailableSku(`${product.sku}-${skuSuffix}`),
        slug: await this.findAvailableSlug(`${product.slug}-${slugSuffix}`),
        title: combo.length ? combo.map((value) => value.value).join(' / ') : product.name,
        price: basePrice,
        compareAtPrice: null,
        weight: null,
        barcode: null,
        imageId: null,
        optionValueIds,
        combinationKey,
      });
      // Reserva el combinationKey dentro de este lote para no generar duplicados entre sí.
      existingKeys.add(combinationKey);
    }

    const created = toCreate.length > 0 ? await this.variants.createMany(toCreate) : 0;

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.variant.generated',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, created, skippedExisting },
    });

    return { created, skippedExisting };
  }

  private async findAvailableSku(base: string): Promise<string> {
    let candidate = base.toUpperCase();
    let attempt = 2;
    while (await this.variants.existsBySku(candidate)) {
      candidate = `${base.toUpperCase()}-${attempt}`;
      attempt += 1;
    }
    return candidate;
  }

  private async findAvailableSlug(base: string): Promise<string> {
    let candidate = base;
    let attempt = 2;
    while (await this.variants.existsBySlug(candidate)) {
      candidate = `${base}-${attempt}`;
      attempt += 1;
    }
    return candidate;
  }
}
