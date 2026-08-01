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
import { CreatePageUseCase } from '../../application/use-cases/create-page.use-case';
import { DeletePageUseCase } from '../../application/use-cases/delete-page.use-case';
import { GetPageUseCase } from '../../application/use-cases/get-page.use-case';
import { ListPageVersionsUseCase } from '../../application/use-cases/list-page-versions.use-case';
import { ListPagesUseCase } from '../../application/use-cases/list-pages.use-case';
import { PublishPageUseCase } from '../../application/use-cases/publish-page.use-case';
import { RestorePageVersionUseCase } from '../../application/use-cases/restore-page-version.use-case';
import { UpdatePageUseCase } from '../../application/use-cases/update-page.use-case';
import { CreatePageDto } from '../dto/create-page.dto';
import { ListPagesQueryDto } from '../dto/list-pages-query.dto';
import { ListVersionsQueryDto } from '../dto/list-versions-query.dto';
import { PublishPageDto } from '../dto/publish-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { CmsExceptionFilter } from '../filters/cms-exception.filter';

/** CRUD y publicación del CMS (spec 026 §7/§9) — lecturas bajo `admin:access`, mutaciones bajo `catalog:manage`, mismo criterio que Home Sections (013) y SEO (012) para contenido que impacta el storefront público. */
@Controller('admin/cms/pages')
@UseGuards(PermissionsGuard)
@UseFilters(CmsExceptionFilter)
export class AdminCmsController {
  constructor(
    private readonly listPages: ListPagesUseCase,
    private readonly getPage: GetPageUseCase,
    private readonly createPage: CreatePageUseCase,
    private readonly updatePage: UpdatePageUseCase,
    private readonly deletePage: DeletePageUseCase,
    private readonly publishPage: PublishPageUseCase,
    private readonly listVersions: ListPageVersionsUseCase,
    private readonly restoreVersion: RestorePageVersionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListPagesQueryDto) {
    const result = await this.listPages.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
    return { ...result, items: result.items.map((page) => page.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreatePageDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const page = await this.createPage.execute({
      title: dto.title,
      slug: dto.slug,
      ...(dto.template !== undefined ? { template: dto.template } : {}),
      seoTitle: dto.seoTitle ?? null,
      seoDescription: dto.seoDescription ?? null,
      blocks: dto.blocks ?? [],
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return page.toJSON();
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const page = await this.getPage.execute(id);
    return page.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const page = await this.updatePage.execute({
      id,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.template !== undefined ? { template: dto.template } : {}),
      ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.blocks !== undefined ? { blocks: dto.blocks } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return page.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deletePage.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Post(':id/publish')
  @RequirePermission('catalog:manage')
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishPageDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const page = await this.publishPage.execute({
      id,
      ...(dto.publishAt !== undefined ? { publishAt: new Date(dto.publishAt) } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return page.toJSON();
  }

  @Get(':id/versions')
  @RequirePermission('admin:access')
  async versions(@Param('id') id: string, @Query() query: ListVersionsQueryDto) {
    const result = await this.listVersions.execute({
      pageId: id,
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
    const page = await this.restoreVersion.execute({
      pageId: id,
      versionNumber,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return page.toJSON();
  }
}
