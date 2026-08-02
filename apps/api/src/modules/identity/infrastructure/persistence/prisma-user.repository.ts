import { Injectable } from '@nestjs/common';
import type { Prisma, Role, User as PrismaUser } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import type {
  CreateUserData,
  ListUsersParams,
  ListUsersResult,
  UpdateMfaData,
  UpdateProfileData,
  UserRepositoryPort,
} from '../../domain/ports/user.repository.port';
import type { RoleName } from '../../domain/value-objects/role-name';

type UserWithRole = PrismaUser & { role: Role };

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { role: true } });
    return user ? this.toEntity(user) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: data.role } });
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: role.id,
      },
      include: { role: true },
    });
    return this.toEntity(user);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { firstName: data.firstName, lastName: data.lastName },
    });
  }

  async updateRole(userId: string, role: RoleName): Promise<void> {
    const roleRecord = await this.prisma.role.findUniqueOrThrow({ where: { name: role } });
    await this.prisma.user.update({ where: { id: userId }, data: { roleId: roleRecord.id } });
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }

  async updateMfa(userId: string, data: UpdateMfaData): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: data.mfaSecret,
        mfaEnabled: data.mfaEnabled,
        mfaEnabledAt: data.mfaEnabledAt,
      },
    });
  }

  async findMany(params: ListUsersParams): Promise<ListUsersResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.UserWhereInput = {
      ...(filter?.roles && filter.roles.length > 0 ? { role: { name: { in: filter.roles } } } : {}),
      ...(filter?.search
        ? {
            OR: [
              { email: { contains: filter.search, mode: 'insensitive' } },
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: items.map((user) => this.toEntity(user)), total };
  }

  private toEntity(user: UserWithRole): UserEntity {
    return new UserEntity({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name as RoleName,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      mfaSecret: user.mfaSecret,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
    });
  }
}
