import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';

import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { IdentityExceptionFilter } from '../filters/identity-exception.filter';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('admin/roles')
@UseGuards(PermissionsGuard)
@UseFilters(IdentityExceptionFilter)
export class AdminRolesController {
  constructor(private readonly listRolesUseCase: ListRolesUseCase) {}

  @Get()
  @RequirePermission('admin:access')
  list() {
    return this.listRolesUseCase.execute();
  }
}
