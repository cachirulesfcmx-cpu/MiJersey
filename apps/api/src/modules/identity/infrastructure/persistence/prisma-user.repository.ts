import { Injectable } from '@nestjs/common';
import type { Role, User as PrismaUser } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import type { CreateUserData, UserRepositoryPort } from '../../domain/ports/user.repository.port';
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
      createdAt: user.createdAt,
    });
  }
}
