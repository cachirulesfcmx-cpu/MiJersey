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
import { CreateMenuUseCase } from '../../application/use-cases/create-menu.use-case';
import { DeleteMenuUseCase } from '../../application/use-cases/delete-menu.use-case';
import { GetMenuUseCase } from '../../application/use-cases/get-menu.use-case';
import { ListMenuVersionsUseCase } from '../../application/use-cases/list-menu-versions.use-case';
import { ListMenusUseCase } from '../../application/use-cases/list-menus.use-case';
import { RestoreMenuVersionUseCase } from '../../application/use-cases/restore-menu-version.use-case';
import { UpdateMenuUseCase } from '../../application/use-cases/update-menu.use-case';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { ListMenuVersionsQueryDto } from '../dto/list-menu-versions-query.dto';
import { ListMenusQueryDto } from '../dto/list-menus-query.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { NavigationExceptionFilter } from '../filters/navigation-exception.filter';

/** CRUD del Navigation Builder (spec 028 §7) — lecturas bajo `admin:access`, mutaciones bajo `catalog:manage`, mismo criterio que CMS Pages (026) y Blog (027) para contenido que impacta el storefront público. */
@Controller('admin/navigation/menus')
@UseGuards(PermissionsGuard)
@UseFilters(NavigationExceptionFilter)
export class AdminNavigationController {
  constructor(
    private readonly listMenus: ListMenusUseCase,
    private readonly getMenu: GetMenuUseCase,
    private readonly createMenu: CreateMenuUseCase,
    private readonly updateMenu: UpdateMenuUseCase,
    private readonly deleteMenu: DeleteMenuUseCase,
    private readonly listVersions: ListMenuVersionsUseCase,
    private readonly restoreVersion: RestoreMenuVersionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListMenusQueryDto) {
    const result = await this.listMenus.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.location !== undefined ? { location: query.location } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
    return { ...result, items: result.items.map((menu) => menu.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateMenuDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const menu = await this.createMenu.execute({
      name: dto.name,
      location: dto.location,
      items: (dto.items ?? []).map((item) => ({
        tempId: item.tempId,
        parentTempId: item.parentTempId ?? null,
        label: item.label,
        type: item.type,
        target: item.target,
        icon: item.icon ?? null,
        sortOrder: item.sortOrder,
        visibilityRules: item.visibilityRules ?? null,
        openInNewTab: item.openInNewTab ?? false,
      })),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return menu.toJSON();
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const menu = await this.getMenu.execute(id);
    return menu.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const menu = await this.updateMenu.execute({
      id,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.items !== undefined
        ? {
            items: dto.items.map((item) => ({
              tempId: item.tempId,
              parentTempId: item.parentTempId ?? null,
              label: item.label,
              type: item.type,
              target: item.target,
              icon: item.icon ?? null,
              sortOrder: item.sortOrder,
              visibilityRules: item.visibilityRules ?? null,
              openInNewTab: item.openInNewTab ?? false,
            })),
          }
        : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return menu.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteMenu.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Get(':id/versions')
  @RequirePermission('admin:access')
  async versions(@Param('id') id: string, @Query() query: ListMenuVersionsQueryDto) {
    const result = await this.listVersions.execute({
      menuId: id,
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
    const menu = await this.restoreVersion.execute({
      menuId: id,
      versionNumber,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return menu.toJSON();
  }
}
