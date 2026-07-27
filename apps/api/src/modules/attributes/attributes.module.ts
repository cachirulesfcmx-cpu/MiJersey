import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { AttributeCacheService } from './application/services/attribute-cache.service';
import { AssignAttributeToProductUseCase } from './application/use-cases/assign-attribute-to-product.use-case';
import { BulkAssignAttributesToProductUseCase } from './application/use-cases/bulk-assign-attributes-to-product.use-case';
import { CreateAttributeUseCase } from './application/use-cases/create-attribute.use-case';
import { DeleteAttributeUseCase } from './application/use-cases/delete-attribute.use-case';
import { GetAttributeUseCase } from './application/use-cases/get-attribute.use-case';
import { GetFiltersUseCase } from './application/use-cases/get-filters.use-case';
import { ListAttributesUseCase } from './application/use-cases/list-attributes.use-case';
import { ListProductAttributesUseCase } from './application/use-cases/list-product-attributes.use-case';
import { RemoveAttributeFromProductUseCase } from './application/use-cases/remove-attribute-from-product.use-case';
import { SearchProductsUseCase } from './application/use-cases/search-products.use-case';
import { UpdateAttributeUseCase } from './application/use-cases/update-attribute.use-case';
import {
  ATTRIBUTE_REPOSITORY,
  PRODUCT_ATTRIBUTE_REPOSITORY,
  PRODUCT_QUERY,
} from './attributes.constants';
import { PrismaAttributeRepository } from './infrastructure/persistence/prisma-attribute.repository';
import { PrismaProductAttributeRepository } from './infrastructure/persistence/prisma-product-attribute.repository';
import { PrismaProductQueryRepository } from './infrastructure/persistence/prisma-product-query.repository';
import { AdminAttributesController } from './presentation/controllers/admin-attributes.controller';
import { AdminProductAttributesController } from './presentation/controllers/admin-product-attributes.controller';
import { PublicFiltersController } from './presentation/controllers/public-filters.controller';

@Module({
  imports: [IdentityModule],
  controllers: [
    AdminAttributesController,
    AdminProductAttributesController,
    PublicFiltersController,
  ],
  providers: [
    AttributeCacheService,
    ListAttributesUseCase,
    GetAttributeUseCase,
    CreateAttributeUseCase,
    UpdateAttributeUseCase,
    DeleteAttributeUseCase,
    ListProductAttributesUseCase,
    AssignAttributeToProductUseCase,
    BulkAssignAttributesToProductUseCase,
    RemoveAttributeFromProductUseCase,
    GetFiltersUseCase,
    SearchProductsUseCase,
    { provide: ATTRIBUTE_REPOSITORY, useClass: PrismaAttributeRepository },
    { provide: PRODUCT_ATTRIBUTE_REPOSITORY, useClass: PrismaProductAttributeRepository },
    { provide: PRODUCT_QUERY, useClass: PrismaProductQueryRepository },
  ],
  // SearchProductsUseCase se exporta para que CatalogModule lo use en `GET /products/search`
  // (única excepción a la regla "el módulo nuevo lee Catalog vía su propio puerto": esa ruta
  // debe vivir en el controlador que ya es dueño de `/products` para no chocar con `:slug`).
  exports: [SearchProductsUseCase],
})
export class AttributesModule {}
