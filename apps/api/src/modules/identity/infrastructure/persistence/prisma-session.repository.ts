import { Injectable } from '@nestjs/common';
import type { Session as PrismaSession } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { SessionEntity, type SessionStatus } from '../../domain/entities/session.entity';
import type {
  CreateSessionData,
  SessionRepositoryPort,
} from '../../domain/ports/session.repository.port';

@Injectable()
export class PrismaSessionRepository implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionData): Promise<SessionEntity> {
    const session = await this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
      },
    });
    return this.toEntity(session);
  }

  async findByRefreshTokenHash(hash: string): Promise<SessionEntity | null> {
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash } });
    return session ? this.toEntity(session) : null;
  }

  async findById(id: string): Promise<SessionEntity | null> {
    const session = await this.prisma.session.findUnique({ where: { id } });
    return session ? this.toEntity(session) : null;
  }

  async listActiveByUser(userId: string): Promise<SessionEntity[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map((session) => this.toEntity(session));
  }

  async rotate(id: string, newRefreshTokenHash: string, newExpiresAt: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string, exceptId?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, status: 'ACTIVE', ...(exceptId ? { id: { not: exceptId } } : {}) },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }

  private toEntity(session: PrismaSession): SessionEntity {
    return new SessionEntity({
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      status: session.status as SessionStatus,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    });
  }
}
