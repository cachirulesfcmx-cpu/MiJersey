import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { CreateStaffUserUseCase } from '../../application/use-cases/create-staff-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { SetUserActiveUseCase } from '../../application/use-cases/set-user-active.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import type { AccessTokenPayload } from '../../domain/ports/token.service.port';
import { STAFF_ROLES } from '../../domain/value-objects/role-name';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { CreateStaffUserDto } from '../dto/create-staff-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { SetUserActiveDto } from '../dto/set-user-active.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { IdentityExceptionFilter } from '../filters/identity-exception.filter';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('admin/users')
@UseGuards(PermissionsGuard)
@UseFilters(IdentityExceptionFilter)
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createStaffUserUseCase: CreateStaffUserUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly setUserActiveUseCase: SetUserActiveUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute({
      roles: query.role ? [query.role] : [...STAFF_ROLES],
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search ? { search: query.search } : {}),
    });

    return {
      items: result.items.map((user) => user.toPublicProfile()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('identity:manage')
  async create(
    @Body() dto: CreateStaffUserDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createStaffUserUseCase.execute({
      ...dto,
      invitedByUserId: user.sub,
      ipAddress: ip,
    });
    return created.toPublicProfile();
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('identity:manage')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.updateUserRoleUseCase.execute({
      targetUserId: id,
      role: dto.role,
      requestingUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('identity:manage')
  async setActive(
    @Param('id') id: string,
    @Body() dto: SetUserActiveDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.setUserActiveUseCase.execute({
      targetUserId: id,
      isActive: dto.isActive,
      requestingUserId: user.sub,
      ipAddress: ip,
    });
  }
}
