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
import { AssignProductsToBrandUseCase } from '../../application/use-cases/assign-products-to-brand.use-case';
import { CreateBrandUseCase } from '../../application/use-cases/create-brand.use-case';
import { DeleteBrandUseCase } from '../../application/use-cases/delete-brand.use-case';
import { GetBrandUseCase } from '../../application/use-cases/get-brand.use-case';
import { ListBrandProductsUseCase } from '../../application/use-cases/list-brand-products.use-case';
import { ListBrandsUseCase } from '../../application/use-cases/list-brands.use-case';
import { RemoveProductFromBrandUseCase } from '../../application/use-cases/remove-product-from-brand.use-case';
import { ReorderBrandsUseCase } from '../../application/use-cases/reorder-brands.use-case';
import { UpdateBrandUseCase } from '../../application/use-cases/update-brand.use-case';
import { AssignProductsDto } from '../dto/assign-products.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { DeleteBrandQueryDto } from '../dto/delete-brand-query.dto';
import { ListBrandProductsQueryDto } from '../dto/list-brand-products-query.dto';
import { ListBrandsQueryDto } from '../dto/list-brands-query.dto';
import { ReorderBrandsDto } from '../dto/reorder-brands.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { BrandExceptionFilter } from '../filters/brand-exception.filter';

@Controller('admin/brands')
@UseGuards(PermissionsGuard)
@UseFilters(BrandExceptionFilter)
export class AdminBrandsController {
  constructor(
    private readonly listBrandsUseCase: ListBrandsUseCase,
    private readonly getBrandUseCase: GetBrandUseCase,
    private readonly createBrandUseCase: CreateBrandUseCase,
    private readonly updateBrandUseCase: UpdateBrandUseCase,
    private readonly deleteBrandUseCase: DeleteBrandUseCase,
    private readonly reorderBrandsUseCase: ReorderBrandsUseCase,
    private readonly listBrandProductsUseCase: ListBrandProductsUseCase,
    private readonly assignProductsToBrandUseCase: AssignProductsToBrandUseCase,
    private readonly removeProductFromBrandUseCase: RemoveProductFromBrandUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListBrandsQueryDto) {
    const result = await this.listBrandsUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      filter: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
    });
    return { items: result.items.map((brand) => brand.toJSON()), total: result.total };
  }

  @Patch('reorder')
  @RequirePermission('catalog:manage')
  async reorder(
    @Body() dto: ReorderBrandsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.reorderBrandsUseCase.execute({
      orderedIds: dto.orderedIds,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getBrandUseCase.execute(id)).toJSON();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const brand = await this.createBrandUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return brand.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const brand = await this.updateBrandUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return brand.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(
    @Param('id') id: string,
    @Query() query: DeleteBrandQueryDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.deleteBrandUseCase.execute({
      id,
      ...(query.force !== undefined ? { force: query.force } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Get(':id/products')
  @RequirePermission('admin:access')
  async listProducts(@Param('id') id: string, @Query() query: ListBrandProductsQueryDto) {
    const result = await this.listBrandProductsUseCase.execute({
      brandId: id,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { items: result.items, total: result.total };
  }

  @Post(':id/products')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async assignProducts(
    @Param('id') id: string,
    @Body() dto: AssignProductsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.assignProductsToBrandUseCase.execute({
      brandId: id,
      productIds: dto.productIds,
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
    await this.removeProductFromBrandUseCase.execute({
      brandId: id,
      productId,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
