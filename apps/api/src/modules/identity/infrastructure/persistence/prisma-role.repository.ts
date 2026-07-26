import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { RoleRepositoryPort, RoleSummary } from '../../domain/ports/role.repository.port';
import type { RoleName } from '../../domain/value-objects/role-name';

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(): Promise<RoleSummary[]> {
    const roles = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      name: role.name as RoleName,
      description: role.description,
      permissions: role.permissions.map((rolePermission) => rolePermission.permission.key),
    }));
  }
}
