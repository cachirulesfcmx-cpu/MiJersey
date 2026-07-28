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
import { CreateHomeSectionUseCase } from '../../application/use-cases/create-home-section.use-case';
import { DeleteHomeSectionUseCase } from '../../application/use-cases/delete-home-section.use-case';
import { ListAdminHomeSectionsUseCase } from '../../application/use-cases/list-admin-home-sections.use-case';
import { ReorderHomeSectionsUseCase } from '../../application/use-cases/reorder-home-sections.use-case';
import { UpdateHomeSectionUseCase } from '../../application/use-cases/update-home-section.use-case';
import { CreateHomeSectionDto } from '../dto/create-home-section.dto';
import { ReorderHomeSectionsDto } from '../dto/reorder-home-sections.dto';
import { UpdateHomeSectionDto } from '../dto/update-home-section.dto';
import { HomeExceptionFilter } from '../filters/home-exception.filter';

@Controller('admin/home/sections')
@UseGuards(PermissionsGuard)
@UseFilters(HomeExceptionFilter)
export class AdminHomeController {
  constructor(
    private readonly listSectionsUseCase: ListAdminHomeSectionsUseCase,
    private readonly createSectionUseCase: CreateHomeSectionUseCase,
    private readonly updateSectionUseCase: UpdateHomeSectionUseCase,
    private readonly deleteSectionUseCase: DeleteHomeSectionUseCase,
    private readonly reorderSectionsUseCase: ReorderHomeSectionsUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const sections = await this.listSectionsUseCase.execute();
    return { items: sections.map((section) => section.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateHomeSectionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const section = await this.createSectionUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return section.toJSON();
  }

  @Patch('reorder')
  @RequirePermission('catalog:manage')
  async reorder(
    @Body() dto: ReorderHomeSectionsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.reorderSectionsUseCase.execute({
      order: dto.order,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHomeSectionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const section = await this.updateSectionUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return section.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteSectionUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
