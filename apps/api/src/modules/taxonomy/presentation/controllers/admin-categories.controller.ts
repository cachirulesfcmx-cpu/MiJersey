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
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { AssignProductsToCategoryUseCase } from '../../application/use-cases/assign-products-to-category.use-case';
import { toPlainTree } from '../../application/use-cases/category-tree.util';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case';
import { GetCategoryPathUseCase } from '../../application/use-cases/get-category-path.use-case';
import { GetCategoryTreeUseCase } from '../../application/use-cases/get-category-tree.use-case';
import { MoveCategoryUseCase } from '../../application/use-cases/move-category.use-case';
import { RemoveProductFromCategoryUseCase } from '../../application/use-cases/remove-product-from-category.use-case';
import { ReorderCategoriesUseCase } from '../../application/use-cases/reorder-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { CategoryProductIdsDto } from '../dto/category-product-ids.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { MoveCategoryDto } from '../dto/move-category.dto';
import { ReorderCategoriesDto } from '../dto/reorder-categories.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { TaxonomyExceptionFilter } from '../filters/taxonomy-exception.filter';

@Controller('admin/categories')
@UseGuards(PermissionsGuard)
@UseFilters(TaxonomyExceptionFilter)
export class AdminCategoriesController {
  constructor(
    private readonly getCategoryTreeUseCase: GetCategoryTreeUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly getCategoryPathUseCase: GetCategoryPathUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly reorderCategoriesUseCase: ReorderCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly moveCategoryUseCase: MoveCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly assignProductsToCategoryUseCase: AssignProductsToCategoryUseCase,
    private readonly removeProductFromCategoryUseCase: RemoveProductFromCategoryUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async getTree() {
    return toPlainTree(await this.getCategoryTreeUseCase.execute());
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getCategoryUseCase.execute(id)).toJSON();
  }

  @Get(':id/path')
  @RequirePermission('admin:access')
  async getPath(@Param('id') id: string) {
    const path = await this.getCategoryPathUseCase.execute(id);
    return path.map((category) => category.toJSON());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const category = await this.createCategoryUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return category.toJSON();
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async reorder(
    @Body() dto: ReorderCategoriesDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.reorderCategoriesUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const category = await this.updateCategoryUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return category.toJSON();
  }

  @Patch(':id/move')
  @RequirePermission('catalog:manage')
  async move(
    @Param('id') id: string,
    @Body() dto: MoveCategoryDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const category = await this.moveCategoryUseCase.execute({
      id,
      parentId: dto.parentId,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return category.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteCategoryUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Post(':id/products')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async assignProducts(
    @Param('id') id: string,
    @Body() dto: CategoryProductIdsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.assignProductsToCategoryUseCase.execute({
      categoryId: id,
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
    await this.removeProductFromCategoryUseCase.execute({
      categoryId: id,
      productId,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
