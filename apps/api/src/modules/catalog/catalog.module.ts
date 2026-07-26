import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { ArchiveProductUseCase } from './application/use-cases/archive-product.use-case';
import { BulkDeleteProductsUseCase } from './application/use-cases/bulk-delete-products.use-case';
import { BulkUpdateProductStatusUseCase } from './application/use-cases/bulk-update-product-status.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { DuplicateProductUseCase } from './application/use-cases/duplicate-product.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { GetProductStatsUseCase } from './application/use-cases/get-product-stats.use-case';
import { GetPublicProductUseCase } from './application/use-cases/get-public-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ListPublicProductsUseCase } from './application/use-cases/list-public-products.use-case';
import { PublishProductUseCase } from './application/use-cases/publish-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { PRODUCT_REPOSITORY } from './catalog.constants';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { AdminProductsController } from './presentation/controllers/admin-products.controller';
import { PublicProductsController } from './presentation/controllers/public-products.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminProductsController, PublicProductsController],
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
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
  exports: [GetProductStatsUseCase],
})
export class CatalogModule {}
