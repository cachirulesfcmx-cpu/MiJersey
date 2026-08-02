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
import { CreateTrackingProviderUseCase } from '../../application/use-cases/create-tracking-provider.use-case';
import { DeleteTrackingProviderUseCase } from '../../application/use-cases/delete-tracking-provider.use-case';
import { ListTrackingProvidersUseCase } from '../../application/use-cases/list-tracking-providers.use-case';
import { UpdateTrackingProviderUseCase } from '../../application/use-cases/update-tracking-provider.use-case';
import { CreateTrackingProviderDto } from '../dto/create-tracking-provider.dto';
import { UpdateTrackingProviderDto } from '../dto/update-tracking-provider.dto';
import { TrackingExceptionFilter } from '../filters/tracking-exception.filter';

/** Gestión de proveedores (033 §7, extendida más allá del `GET`/`PATCH` literal del spec con `POST`/`DELETE` para que el Provider Manager admin sea un CRUD real) — bajo `system:configure`, no `catalog:manage`: la configuración incluye credenciales server-side (ej. `CONVERSION_API.accessToken`), mismo criterio que Site Configuration (030, "configuración crítica del sistema"). Lecturas bajo `admin:access`. */
@Controller('admin/tracking/providers')
@UseGuards(PermissionsGuard)
@UseFilters(TrackingExceptionFilter)
export class AdminTrackingProvidersController {
  constructor(
    private readonly listProviders: ListTrackingProvidersUseCase,
    private readonly createProvider: CreateTrackingProviderUseCase,
    private readonly updateProvider: UpdateTrackingProviderUseCase,
    private readonly deleteProvider: DeleteTrackingProviderUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const providers = await this.listProviders.execute();
    return providers.map((provider) => provider.toJSON());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('system:configure')
  async create(
    @Body() dto: CreateTrackingProviderDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const provider = await this.createProvider.execute({
      provider: dto.provider,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      configuration: dto.configuration,
      ...(dto.consentCategory !== undefined ? { consentCategory: dto.consentCategory } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return provider.toJSON();
  }

  @Patch(':id')
  @RequirePermission('system:configure')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTrackingProviderDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const provider = await this.updateProvider.execute({
      id,
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.configuration !== undefined ? { configuration: dto.configuration } : {}),
      ...(dto.consentCategory !== undefined ? { consentCategory: dto.consentCategory } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return provider.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('system:configure')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteProvider.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
