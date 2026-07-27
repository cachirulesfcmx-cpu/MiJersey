import { Module } from '@nestjs/common';

import { AttributesModule } from '../attributes/attributes.module';
import { IdentityModule } from '../identity/identity.module';
import { ArchiveProductUseCase } from './application/use-cases/archive-product.use-case';
import { BulkDeleteProductsUseCase } from './application/use-cases/bulk-delete-products.use-case';
import { BulkUpdateProductStatusUseCase } from './application/use-cases/bulk-update-product-status.use-case';
import { BulkUpdateVariantsUseCase } from './application/use-cases/bulk-update-variants.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { CreateProductOptionUseCase } from './application/use-cases/create-product-option.use-case';
import { CreateProductVariantUseCase } from './application/use-cases/create-product-variant.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { DeleteProductOptionUseCase } from './application/use-cases/delete-product-option.use-case';
import { DeleteProductVariantUseCase } from './application/use-cases/delete-product-variant.use-case';
import { DuplicateProductUseCase } from './application/use-cases/duplicate-product.use-case';
import { GenerateVariantsUseCase } from './application/use-cases/generate-variants.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { GetProductOptionsUseCase } from './application/use-cases/get-product-options.use-case';
import { GetProductStatsUseCase } from './application/use-cases/get-product-stats.use-case';
import { GetProductVariantUseCase } from './application/use-cases/get-product-variant.use-case';
import { GetPublicProductUseCase } from './application/use-cases/get-public-product.use-case';
import { GetPublicProductVariantsUseCase } from './application/use-cases/get-public-product-variants.use-case';
import { ListProductVariantsUseCase } from './application/use-cases/list-product-variants.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ListPublicProductsUseCase } from './application/use-cases/list-public-products.use-case';
import { PublishProductUseCase } from './application/use-cases/publish-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { UpdateProductOptionUseCase } from './application/use-cases/update-product-option.use-case';
import { UpdateProductVariantUseCase } from './application/use-cases/update-product-variant.use-case';
import {
  PRODUCT_OPTION_REPOSITORY,
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from './catalog.constants';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { PrismaProductOptionRepository } from './infrastructure/persistence/prisma-product-option.repository';
import { PrismaProductVariantRepository } from './infrastructure/persistence/prisma-product-variant.repository';
import { AdminOptionsController } from './presentation/controllers/admin-options.controller';
import { AdminProductOptionsController } from './presentation/controllers/admin-product-options.controller';
import { AdminProductVariantsController } from './presentation/controllers/admin-product-variants.controller';
import { AdminProductsController } from './presentation/controllers/admin-products.controller';
import { AdminVariantsController } from './presentation/controllers/admin-variants.controller';
import { PublicProductsController } from './presentation/controllers/public-products.controller';

@Module({
  imports: [IdentityModule, AttributesModule],
  controllers: [
    AdminProductsController,
    AdminProductOptionsController,
    AdminOptionsController,
    AdminProductVariantsController,
    AdminVariantsController,
    PublicProductsController,
  ],
  providers: [
    ListProductsUseCase,
    ListPublicProductsUseCase,
    GetProductUseCase,
    GetPublicProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    PublishProductUseCase,
    ArchiveProductUseCase,
    DuplicateProductUseCase,
    DeleteProductUseCase,
    BulkUpdateProductStatusUseCase,
    BulkDeleteProductsUseCase,
    GetProductStatsUseCase,
    GetProductOptionsUseCase,
    CreateProductOptionUseCase,
    UpdateProductOptionUseCase,
    DeleteProductOptionUseCase,
    ListProductVariantsUseCase,
    GetProductVariantUseCase,
    GetPublicProductVariantsUseCase,
    CreateProductVariantUseCase,
    UpdateProductVariantUseCase,
    DeleteProductVariantUseCase,
    GenerateVariantsUseCase,
    BulkUpdateVariantsUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    { provide: PRODUCT_OPTION_REPOSITORY, useClass: PrismaProductOptionRepository },
    { provide: PRODUCT_VARIANT_REPOSITORY, useClass: PrismaProductVariantRepository },
  ],
  exports: [GetProductStatsUseCase],
})
export class CatalogModule {}
