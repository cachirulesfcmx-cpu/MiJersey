import { Inject, Injectable } from '@nestjs/common';

import { CannotModifySelfError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import type { RoleName } from '../../domain/value-objects/role-name';
import { AUDIT_LOG_REPOSITORY, USER_REPOSITORY } from '../../identity.constants';

export interface UpdateUserRoleInput {
  targetUserId: string;
  role: RoleName;
  requestingUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateUserRoleInput): Promise<void> {
    if (input.targetUserId === input.requestingUserId) {
      throw new CannotModifySelfError();
    }

    const target = await this.users.findById(input.targetUserId);

    if (!target) {
      throw new UserNotFoundError();
    }

    await this.users.updateRole(input.targetUserId, input.role);

    await this.auditLog.record({
      userId: input.requestingUserId,
      action: 'admin.user.role_changed',
      ipAddress: input.ipAddress,
      metadata: {
        targetUserId: input.targetUserId,
        previousRole: target.role,
        newRole: input.role,
      },
    });
  }
}
