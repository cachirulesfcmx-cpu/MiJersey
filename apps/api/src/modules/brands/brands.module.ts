import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { MediaModule } from '../media/media.module';
import { AssignProductsToBrandUseCase } from './application/use-cases/assign-products-to-brand.use-case';
import { CreateBrandUseCase } from './application/use-cases/create-brand.use-case';
import { DeleteBrandUseCase } from './application/use-cases/delete-brand.use-case';
import { GetBrandUseCase } from './application/use-cases/get-brand.use-case';
import { GetPublicBrandUseCase } from './application/use-cases/get-public-brand.use-case';
import { ListBrandProductsUseCase } from './application/use-cases/list-brand-products.use-case';
import { ListBrandsUseCase } from './application/use-cases/list-brands.use-case';
import { ListPublicBrandsUseCase } from './application/use-cases/list-public-brands.use-case';
import { RemoveProductFromBrandUseCase } from './application/use-cases/remove-product-from-brand.use-case';
import { ReorderBrandsUseCase } from './application/use-cases/reorder-brands.use-case';
import { UpdateBrandUseCase } from './application/use-cases/update-brand.use-case';
import { BRAND_REPOSITORY, PRODUCT_QUERY } from './brands.constants';
import { PrismaBrandRepository } from './infrastructure/persistence/prisma-brand.repository';
import { PrismaProductQueryRepository } from './infrastructure/persistence/prisma-product-query.repository';
import { AdminBrandsController } from './presentation/controllers/admin-brands.controller';
import { PublicBrandsController } from './presentation/controllers/public-brands.controller';

@Module({
  imports: [IdentityModule, MediaModule],
  controllers: [AdminBrandsController, PublicBrandsController],
  providers: [
    ListBrandsUseCase,
    GetBrandUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase,
    ReorderBrandsUseCase,
    ListPublicBrandsUseCase,
    GetPublicBrandUseCase,
    ListBrandProductsUseCase,
    AssignProductsToBrandUseCase,
    RemoveProductFromBrandUseCase,
    { provide: BRAND_REPOSITORY, useClass: PrismaBrandRepository },
    { provide: PRODUCT_QUERY, useClass: PrismaProductQueryRepository },
  ],
})
export class BrandsModule {}
