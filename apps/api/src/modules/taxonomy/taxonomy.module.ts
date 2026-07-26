import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { TaxonomyCacheService } from './application/services/taxonomy-cache.service';
import { AddProductsToCollectionUseCase } from './application/use-cases/add-products-to-collection.use-case';
import { AssignProductsToCategoryUseCase } from './application/use-cases/assign-products-to-category.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { CreateCollectionUseCase } from './application/use-cases/create-collection.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { DeleteCollectionUseCase } from './application/use-cases/delete-collection.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { GetCategoryPathUseCase } from './application/use-cases/get-category-path.use-case';
import { GetCategoryTreeUseCase } from './application/use-cases/get-category-tree.use-case';
import { GetCollectionUseCase } from './application/use-cases/get-collection.use-case';
import { GetPublicCategoryTreeUseCase } from './application/use-cases/get-public-category-tree.use-case';
import { GetPublicCollectionUseCase } from './application/use-cases/get-public-collection.use-case';
import { ListCollectionsUseCase } from './application/use-cases/list-collections.use-case';
import { ListPublicCollectionsUseCase } from './application/use-cases/list-public-collections.use-case';
import { MoveCategoryUseCase } from './application/use-cases/move-category.use-case';
import { RemoveProductFromCategoryUseCase } from './application/use-cases/remove-product-from-category.use-case';
import { RemoveProductFromCollectionUseCase } from './application/use-cases/remove-product-from-collection.use-case';
import { ReorderCategoriesUseCase } from './application/use-cases/reorder-categories.use-case';
import { ReorderCollectionProductsUseCase } from './application/use-cases/reorder-collection-products.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { UpdateCollectionUseCase } from './application/use-cases/update-collection.use-case';
import { UpdateCollectionRulesUseCase } from './application/use-cases/update-collection-rules.use-case';
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma-category.repository';
import { PrismaCollectionRepository } from './infrastructure/persistence/prisma-collection.repository';
import { PrismaProductQueryRepository } from './infrastructure/persistence/prisma-product-query.repository';
import { AdminCategoriesController } from './presentation/controllers/admin-categories.controller';
import { AdminCollectionsController } from './presentation/controllers/admin-collections.controller';
import { PublicCategoriesController } from './presentation/controllers/public-categories.controller';
import { PublicCollectionsController } from './presentation/controllers/public-collections.controller';
import { CATEGORY_REPOSITORY, COLLECTION_REPOSITORY, PRODUCT_QUERY } from './taxonomy.constants';

@Module({
  imports: [IdentityModule],
  controllers: [
    AdminCategoriesController,
    PublicCategoriesController,
    AdminCollectionsController,
    PublicCollectionsController,
  ],
  providers: [
    TaxonomyCacheService,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    MoveCategoryUseCase,
    ReorderCategoriesUseCase,
    DeleteCategoryUseCase,
    GetCategoryUseCase,
    GetCategoryTreeUseCase,
    GetPublicCategoryTreeUseCase,
    GetCategoryPathUseCase,
    AssignProductsToCategoryUseCase,
    RemoveProductFromCategoryUseCase,
    CreateCollectionUseCase,
    UpdateCollectionUseCase,
    DeleteCollectionUseCase,
    GetCollectionUseCase,
    GetPublicCollectionUseCase,
    ListCollectionsUseCase,
    ListPublicCollectionsUseCase,
    AddProductsToCollectionUseCase,
    RemoveProductFromCollectionUseCase,
    ReorderCollectionProductsUseCase,
    UpdateCollectionRulesUseCase,
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    { provide: COLLECTION_REPOSITORY, useClass: PrismaCollectionRepository },
    { provide: PRODUCT_QUERY, useClass: PrismaProductQueryRepository },
  ],
})
export class TaxonomyModule {}
