import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { RoleName } from '../../domain/value-objects/role-name';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissionKeysForRole(role: RoleName): Promise<string[]> {
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
      include: { permissions: { include: { permission: true } } },
    });

    return roleRecord?.permissions.map((rolePermission) => rolePermission.permission.key) ?? [];
  }
}
