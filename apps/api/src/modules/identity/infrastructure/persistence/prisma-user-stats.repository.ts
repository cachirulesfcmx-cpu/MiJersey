import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  UserStatsRepositoryPort,
  UserStatsSnapshot,
} from '../../domain/ports/user-stats.repository.port';
import { RoleName, STAFF_ROLES } from '../../domain/value-objects/role-name';

@Injectable()
export class PrismaUserStatsRepository implements UserStatsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(): Promise<UserStatsSnapshot> {
    const [totalUsers, totalCustomers, totalStaff, totalActiveUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: { name: RoleName.CUSTOMER } } }),
      this.prisma.user.count({ where: { role: { name: { in: [...STAFF_ROLES] } } } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return { totalUsers, totalCustomers, totalStaff, totalActiveUsers };
  }
}
