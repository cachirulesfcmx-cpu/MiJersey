import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { AddProductsToCollectionUseCase } from '../../application/use-cases/add-products-to-collection.use-case';
import { CreateCollectionUseCase } from '../../application/use-cases/create-collection.use-case';
import { DeleteCollectionUseCase } from '../../application/use-cases/delete-collection.use-case';
import { GetCollectionUseCase } from '../../application/use-cases/get-collection.use-case';
import { ListCollectionsUseCase } from '../../application/use-cases/list-collections.use-case';
import { RemoveProductFromCollectionUseCase } from '../../application/use-cases/remove-product-from-collection.use-case';
import { ReorderCollectionProductsUseCase } from '../../application/use-cases/reorder-collection-products.use-case';
import { UpdateCollectionUseCase } from '../../application/use-cases/update-collection.use-case';
import { UpdateCollectionRulesUseCase } from '../../application/use-cases/update-collection-rules.use-case';
import { CollectionProductIdsDto } from '../dto/collection-product-ids.dto';
import { CreateCollectionDto } from '../dto/create-collection.dto';
import { ListCollectionsQueryDto } from '../dto/list-collections-query.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { ReorderCollectionProductsDto } from '../dto/reorder-collection-products.dto';
import { UpdateCollectionDto } from '../dto/update-collection.dto';
import { UpdateCollectionRulesDto } from '../dto/update-collection-rules.dto';
import { TaxonomyExceptionFilter } from '../filters/taxonomy-exception.filter';

@Controller('admin/collections')
@UseGuards(PermissionsGuard)
@UseFilters(TaxonomyExceptionFilter)
export class AdminCollectionsController {
  constructor(
    private readonly listCollectionsUseCase: ListCollectionsUseCase,
    private readonly getCollectionUseCase: GetCollectionUseCase,
    private readonly createCollectionUseCase: CreateCollectionUseCase,
    private readonly updateCollectionUseCase: UpdateCollectionUseCase,
    private readonly deleteCollectionUseCase: DeleteCollectionUseCase,
    private readonly updateCollectionRulesUseCase: UpdateCollectionRulesUseCase,
    private readonly addProductsToCollectionUseCase: AddProductsToCollectionUseCase,
    private readonly removeProductFromCollectionUseCase: RemoveProductFromCollectionUseCase,
    private readonly reorderCollectionProductsUseCase: ReorderCollectionProductsUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListCollectionsQueryDto) {
    const result = await this.listCollectionsUseCase.execute({
      filter: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: [query.status] } : {}),
        ...(query.type ? { type: [query.type] } : {}),
      },
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: result.items.map((collection) => collection.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    const { collection, products, total } = await this.getCollectionUseCase.execute({
      id,
      page: query.page,
      pageSize: query.pageSize,
    });

    return { ...collection.toJSON(), products, total, page: query.page, pageSize: query.pageSize };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateCollectionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const collection = await this.createCollectionUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return collection.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const collection = await this.updateCollectionUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return collection.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteCollectionUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Put(':id/rules')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async updateRules(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionRulesDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.updateCollectionRulesUseCase.execute({
      collectionId: id,
      matchType: dto.matchType,
      rules: dto.rules,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Post(':id/products')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async addProducts(
    @Param('id') id: string,
    @Body() dto: CollectionProductIdsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.addProductsToCollectionUseCase.execute({
      collectionId: id,
      productIds: dto.productIds,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Patch(':id/products/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async reorderProducts(
    @Param('id') id: string,
    @Body() dto: ReorderCollectionProductsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.reorderCollectionProductsUseCase.execute({
      collectionId: id,
      orderedProductIds: dto.orderedProductIds,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Delete(':id/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.removeProductFromCollectionUseCase.execute({
      collectionId: id,
      productId,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
