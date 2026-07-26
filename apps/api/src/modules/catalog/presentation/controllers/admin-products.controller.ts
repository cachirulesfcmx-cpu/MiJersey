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
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ArchiveProductUseCase } from '../../application/use-cases/archive-product.use-case';
import { BulkDeleteProductsUseCase } from '../../application/use-cases/bulk-delete-products.use-case';
import { BulkUpdateProductStatusUseCase } from '../../application/use-cases/bulk-update-product-status.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { DuplicateProductUseCase } from '../../application/use-cases/duplicate-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { PublishProductUseCase } from '../../application/use-cases/publish-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { BulkProductIdsDto } from '../dto/bulk-product-ids.dto';
import { BulkUpdateProductStatusDto } from '../dto/bulk-update-product-status.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

@Controller('admin/products')
@UseGuards(PermissionsGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly publishProductUseCase: PublishProductUseCase,
    private readonly archiveProductUseCase: ArchiveProductUseCase,
    private readonly duplicateProductUseCase: DuplicateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly bulkUpdateProductStatusUseCase: BulkUpdateProductStatusUseCase,
    private readonly bulkDeleteProductsUseCase: BulkDeleteProductsUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListProductsQueryDto) {
    const result = await this.listProductsUseCase.execute({
      filter: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: [query.status] } : {}),
        ...(query.visibility ? { visibility: [query.visibility] } : {}),
        ...(query.type ? { type: [query.type] } : {}),
      },
      page: query.page,
      pageSize: query.pageSize,
      ...(query.sortBy ? { sortBy: query.sortBy } : {}),
      ...(query.sortDir ? { sortDir: query.sortDir } : {}),
    });

    return {
      items: result.items.map((product) => product.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getProductUseCase.execute(id)).toJSON();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const product = await this.createProductUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return product.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const product = await this.updateProductUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return product.toJSON();
  }

  @Patch(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.publishProductUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.archiveProductUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async duplicate(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const product = await this.duplicateProductUseCase.execute({
      id,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return product.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteProductUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Patch('bulk/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async bulkUpdateStatus(
    @Body() dto: BulkUpdateProductStatusDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.bulkUpdateProductStatusUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async bulkDelete(
    @Body() dto: BulkProductIdsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.bulkDeleteProductsUseCase.execute({
      ids: dto.ids,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
