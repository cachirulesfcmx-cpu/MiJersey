import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
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
import { CreatePostUseCase } from '../../application/use-cases/create-post.use-case';
import { DeletePostUseCase } from '../../application/use-cases/delete-post.use-case';
import { GetPostUseCase } from '../../application/use-cases/get-post.use-case';
import { ListPostVersionsUseCase } from '../../application/use-cases/list-post-versions.use-case';
import { ListPostsUseCase } from '../../application/use-cases/list-posts.use-case';
import { PublishPostUseCase } from '../../application/use-cases/publish-post.use-case';
import { RestorePostVersionUseCase } from '../../application/use-cases/restore-post-version.use-case';
import { UpdatePostUseCase } from '../../application/use-cases/update-post.use-case';
import { CreatePostDto } from '../dto/create-post.dto';
import { ListPostVersionsQueryDto } from '../dto/list-post-versions-query.dto';
import { ListPostsQueryDto } from '../dto/list-posts-query.dto';
import { PublishPostDto } from '../dto/publish-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { BlogExceptionFilter } from '../filters/blog-exception.filter';

/** CRUD y publicación de artículos (spec 027 §7) — lecturas bajo `admin:access`, mutaciones bajo `catalog:manage`, mismo criterio que CMS Pages (026). */
@Controller('admin/blog/posts')
@UseGuards(PermissionsGuard)
@UseFilters(BlogExceptionFilter)
export class AdminBlogPostsController {
  constructor(
    private readonly listPosts: ListPostsUseCase,
    private readonly getPost: GetPostUseCase,
    private readonly createPost: CreatePostUseCase,
    private readonly updatePost: UpdatePostUseCase,
    private readonly deletePost: DeletePostUseCase,
    private readonly publishPost: PublishPostUseCase,
    private readonly listVersions: ListPostVersionsUseCase,
    private readonly restoreVersion: RestorePostVersionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListPostsQueryDto) {
    const result = await this.listPosts.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
    return { ...result, items: result.items.map((post) => post.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const post = await this.createPost.execute({
      title: dto.title,
      slug: dto.slug,
      excerpt: dto.excerpt ?? null,
      content: dto.content,
      featuredImage: dto.featuredImage ?? null,
      authorId: dto.authorId,
      seoTitle: dto.seoTitle ?? null,
      seoDescription: dto.seoDescription ?? null,
      categoryIds: dto.categoryIds ?? [],
      tagIds: dto.tagIds ?? [],
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return post.toJSON();
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const post = await this.getPost.execute(id);
    return post.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const post = await this.updatePost.execute({
      id,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.featuredImage !== undefined ? { featuredImage: dto.featuredImage } : {}),
      ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.categoryIds !== undefined ? { categoryIds: dto.categoryIds } : {}),
      ...(dto.tagIds !== undefined ? { tagIds: dto.tagIds } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return post.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deletePost.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Post(':id/publish')
  @RequirePermission('catalog:manage')
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishPostDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const post = await this.publishPost.execute({
      id,
      ...(dto.publishAt !== undefined ? { publishAt: new Date(dto.publishAt) } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return post.toJSON();
  }

  @Get(':id/versions')
  @RequirePermission('admin:access')
  async versions(@Param('id') id: string, @Query() query: ListPostVersionsQueryDto) {
    const result = await this.listVersions.execute({
      postId: id,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { ...result, items: result.items.map((version) => version.toJSON()) };
  }

  @Post(':id/versions/:versionNumber/restore')
  @RequirePermission('catalog:manage')
  async restore(
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const post = await this.restoreVersion.execute({
      postId: id,
      versionNumber,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return post.toJSON();
  }
}
