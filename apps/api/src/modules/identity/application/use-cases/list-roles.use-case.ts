import { Inject, Injectable } from '@nestjs/common';

import type { RoleRepositoryPort, RoleSummary } from '../../domain/ports/role.repository.port';
import { ROLE_REPOSITORY } from '../../identity.constants';

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort) {}

  execute(): Promise<RoleSummary[]> {
    return this.roles.listRoles();
  }
}
