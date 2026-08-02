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
import { CreateEmailLayoutUseCase } from '../../application/use-cases/create-email-layout.use-case';
import { DeleteEmailLayoutUseCase } from '../../application/use-cases/delete-email-layout.use-case';
import { ListEmailLayoutsUseCase } from '../../application/use-cases/list-email-layouts.use-case';
import { UpdateEmailLayoutUseCase } from '../../application/use-cases/update-email-layout.use-case';
import { CreateEmailLayoutDto } from '../dto/create-email-layout.dto';
import { UpdateEmailLayoutDto } from '../dto/update-email-layout.dto';
import { EmailTemplateExceptionFilter } from '../filters/email-template-exception.filter';

/** Layouts reutilizables (spec 031 §2/§4/§6 "Layout Editor") — sin versionado propio, a diferencia de las plantillas. */
@Controller('admin/email/layouts')
@UseGuards(PermissionsGuard)
@UseFilters(EmailTemplateExceptionFilter)
export class AdminEmailLayoutController {
  constructor(
    private readonly listLayouts: ListEmailLayoutsUseCase,
    private readonly createLayout: CreateEmailLayoutUseCase,
    private readonly updateLayout: UpdateEmailLayoutUseCase,
    private readonly deleteLayout: DeleteEmailLayoutUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const layouts = await this.listLayouts.execute();
    return layouts.map((layout) => layout.toJSON());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateEmailLayoutDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const layout = await this.createLayout.execute({
      name: dto.name,
      html: dto.html,
      ...(dto.css !== undefined ? { css: dto.css } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return layout.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailLayoutDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const layout = await this.updateLayout.execute({
      id,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.html !== undefined ? { html: dto.html } : {}),
      ...(dto.css !== undefined ? { css: dto.css } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return layout.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteLayout.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
