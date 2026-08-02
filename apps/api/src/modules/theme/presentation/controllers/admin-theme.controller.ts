import {
  Body,
  Controller,
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
import { GetAdminThemeUseCase } from '../../application/use-cases/get-admin-theme.use-case';
import { ListThemeVersionsUseCase } from '../../application/use-cases/list-theme-versions.use-case';
import { PublishThemeUseCase } from '../../application/use-cases/publish-theme.use-case';
import { RestoreThemeVersionUseCase } from '../../application/use-cases/restore-theme-version.use-case';
import { UpdateThemeUseCase } from '../../application/use-cases/update-theme.use-case';
import { ListThemeVersionsQueryDto } from '../dto/list-theme-versions-query.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { ThemeExceptionFilter } from '../filters/theme-exception.filter';

/** Panel del tema (spec 029 §7): `GET` devuelve siempre el borrador (vigente en la BD), `PATCH` lo edita, `POST /publish` lo copia a la caché pública. Lecturas bajo `admin:access`, mutaciones bajo `catalog:manage` (mismo criterio que CMS Pages/Blog/Navigation). */
@Controller('admin/theme')
@UseGuards(PermissionsGuard)
@UseFilters(ThemeExceptionFilter)
export class AdminThemeController {
  constructor(
    private readonly getAdminTheme: GetAdminThemeUseCase,
    private readonly updateTheme: UpdateThemeUseCase,
    private readonly publishTheme: PublishThemeUseCase,
    private readonly listVersions: ListThemeVersionsUseCase,
    private readonly restoreVersion: RestoreThemeVersionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async get() {
    return this.getAdminTheme.execute();
  }

  @Patch()
  @RequirePermission('catalog:manage')
  async update(
    @Body() dto: UpdateThemeDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.updateTheme.execute({
      ...(dto.settings !== undefined ? { settings: dto.settings } : {}),
      ...(dto.sections !== undefined ? { sections: dto.sections } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Post('publish')
  @RequirePermission('catalog:manage')
  async publish(@CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    return this.publishTheme.execute({ actorUserId: user.sub, ipAddress: ip });
  }

  @Get('versions')
  @RequirePermission('admin:access')
  async versions(@Query() query: ListThemeVersionsQueryDto) {
    const result = await this.listVersions.execute({ page: query.page, pageSize: query.pageSize });
    return { ...result, items: result.items.map((version) => version.toJSON()) };
  }

  @Post('versions/:versionNumber/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('catalog:manage')
  async restore(
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.restoreVersion.execute({ versionNumber, actorUserId: user.sub, ipAddress: ip });
  }
}
