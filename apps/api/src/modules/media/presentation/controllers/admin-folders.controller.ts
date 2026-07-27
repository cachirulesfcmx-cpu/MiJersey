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
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case';
import { MoveFolderUseCase } from '../../application/use-cases/move-folder.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { MoveFolderDto } from '../dto/move-folder.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';
import { MediaExceptionFilter } from '../filters/media-exception.filter';

@Controller('admin/folders')
@UseGuards(PermissionsGuard)
@UseFilters(MediaExceptionFilter)
export class AdminFoldersController {
  constructor(
    private readonly listFoldersUseCase: ListFoldersUseCase,
    private readonly createFolderUseCase: CreateFolderUseCase,
    private readonly updateFolderUseCase: UpdateFolderUseCase,
    private readonly moveFolderUseCase: MoveFolderUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  list() {
    return this.listFoldersUseCase.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateFolderDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const folder = await this.createFolderUseCase.execute({
      ...dto,
      parentId: dto.parentId ?? null,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return folder.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const folder = await this.updateFolderUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return folder.toJSON();
  }

  @Patch(':id/move')
  @RequirePermission('catalog:manage')
  async move(
    @Param('id') id: string,
    @Body() dto: MoveFolderDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const folder = await this.moveFolderUseCase.execute({
      id,
      parentId: dto.parentId ?? null,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return folder.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteFolderUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
