import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { CreateBlogCategoryUseCase } from '../../application/use-cases/create-blog-category.use-case';
import { CreateBlogTagUseCase } from '../../application/use-cases/create-blog-tag.use-case';
import { DeleteBlogCategoryUseCase } from '../../application/use-cases/delete-blog-category.use-case';
import { DeleteBlogTagUseCase } from '../../application/use-cases/delete-blog-tag.use-case';
import { ListBlogCategoriesUseCase } from '../../application/use-cases/list-blog-categories.use-case';
import { ListBlogTagsUseCase } from '../../application/use-cases/list-blog-tags.use-case';
import { UpdateBlogCategoryUseCase } from '../../application/use-cases/update-blog-category.use-case';
import { UpdateBlogTagUseCase } from '../../application/use-cases/update-blog-tag.use-case';
import { CreateBlogCategoryDto } from '../dto/create-blog-category.dto';
import { CreateBlogTagDto } from '../dto/create-blog-tag.dto';
import { UpdateBlogCategoryDto } from '../dto/update-blog-category.dto';
import { UpdateBlogTagDto } from '../dto/update-blog-tag.dto';
import { BlogExceptionFilter } from '../filters/blog-exception.filter';

/** CRUD de categorías y etiquetas de blog (spec 027 §3) — entidades mínimas (id/name/slug), mismo criterio de permisos que los artículos: lecturas bajo `admin:access`, mutaciones bajo `catalog:manage`. */
@Controller('admin/blog')
@UseGuards(PermissionsGuard)
@UseFilters(BlogExceptionFilter)
export class AdminBlogTaxonomyController {
  constructor(
    private readonly listCategories: ListBlogCategoriesUseCase,
    private readonly createCategory: CreateBlogCategoryUseCase,
    private readonly updateCategory: UpdateBlogCategoryUseCase,
    private readonly deleteCategory: DeleteBlogCategoryUseCase,
    private readonly listTags: ListBlogTagsUseCase,
    private readonly createTag: CreateBlogTagUseCase,
    private readonly updateTag: UpdateBlogTagUseCase,
    private readonly deleteTag: DeleteBlogTagUseCase,
  ) {}

  @Get('categories')
  @RequirePermission('admin:access')
  async categories() {
    const items = await this.listCategories.execute();
    return items.map((category) => category.toJSON());
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async createCategoryHandler(@Body() dto: CreateBlogCategoryDto) {
    const category = await this.createCategory.execute(dto);
    return category.toJSON();
  }

  @Patch('categories/:id')
  @RequirePermission('catalog:manage')
  async updateCategoryHandler(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    const category = await this.updateCategory.execute({ id, ...dto });
    return category.toJSON();
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async deleteCategoryHandler(@Param('id') id: string) {
    await this.deleteCategory.execute(id);
  }

  @Get('tags')
  @RequirePermission('admin:access')
  async tags() {
    const items = await this.listTags.execute();
    return items.map((tag) => tag.toJSON());
  }

  @Post('tags')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async createTagHandler(@Body() dto: CreateBlogTagDto) {
    const tag = await this.createTag.execute(dto);
    return tag.toJSON();
  }

  @Patch('tags/:id')
  @RequirePermission('catalog:manage')
  async updateTagHandler(@Param('id') id: string, @Body() dto: UpdateBlogTagDto) {
    const tag = await this.updateTag.execute({ id, ...dto });
    return tag.toJSON();
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async deleteTagHandler(@Param('id') id: string) {
    await this.deleteTag.execute(id);
  }
}
