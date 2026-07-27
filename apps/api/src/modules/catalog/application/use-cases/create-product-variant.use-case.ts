import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  PRODUCT_OPTION_REPOSITORY,
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from '../../catalog.constants';
import type { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import {
  DuplicateVariantCombinationError,
  InvalidVariantOptionValuesError,
  ProductNotFoundError,
  VariantSkuAlreadyExistsError,
  VariantSlugAlreadyExistsError,
} from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import { Sku } from '../../domain/value-objects/sku.vo';
import { Slug } from '../../domain/value-objects/slug.vo';
import { validateOptionValueIds } from './validate-option-value-ids.util';
import { computeCombinationKey } from './variant-combination.util';

export interface CreateProductVariantInput {
  productId: string;
  sku: string;
  slug?: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  weight?: number;
  barcode?: string;
  imageId?: string;
  optionValueIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateProductVariantInput): Promise<ProductVariantEntity> {
    if (!(await this.products.findById(input.productId))) {
      throw new ProductNotFoundError();
    }

    const productOptions = await this.options.findByProductId(input.productId);
    if (!validateOptionValueIds(productOptions, input.optionValueIds)) {
      throw new InvalidVariantOptionValuesError();
    }

    const combinationKey = computeCombinationKey(input.optionValueIds);
    const existingKeys = await this.variants.existingCombinationKeys(input.productId);
    if (existingKeys.has(combinationKey)) {
      throw new DuplicateVariantCombinationError();
    }

    const sku = Sku.create(input.sku).toString();
    const slug = Slug.create(input.slug?.trim() ? input.slug : slugify(input.title)).toString();

    if (await this.variants.existsBySku(sku)) {
      throw new VariantSkuAlreadyExistsError();
    }
    if (await this.variants.existsBySlug(slug)) {
      throw new VariantSlugAlreadyExistsError();
    }

    const variant = await this.variants.create({
      productId: input.productId,
      sku,
      slug,
      title: input.title.trim(),
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      weight: input.weight ?? null,
      barcode: input.barcode?.trim() || null,
      imageId: input.imageId?.trim() || null,
      optionValueIds: input.optionValueIds,
      combinationKey,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.variant.created',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, variantId: variant.id },
    });

    return variant;
  }
}
