import { Inject, Injectable } from '@nestjs/common';

import type { ListUsersResult, UserRepositoryPort } from '../../domain/ports/user.repository.port';
import type { RoleName } from '../../domain/value-objects/role-name';
import { USER_REPOSITORY } from '../../identity.constants';

export interface ListUsersInput {
  roles?: RoleName[];
  search?: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  execute(input: ListUsersInput): Promise<ListUsersResult> {
    return this.users.findMany({
      filter: {
        ...(input.roles ? { roles: input.roles } : {}),
        ...(input.search ? { search: input.search } : {}),
      },
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
