import { Inject, Injectable } from '@nestjs/common';

import type { SessionEntity } from '../../domain/entities/session.entity';
import type { UserEntity } from '../../domain/entities/user.entity';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import {
  REFRESH_TOKEN_TTL_DAYS,
  SESSION_REPOSITORY,
  TOKEN_SERVICE,
} from '../../identity.constants';

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  session: SessionEntity;
}

export interface SessionContext {
  userAgent: string | null;
  ipAddress: string | null;
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Encapsula la emisión y rotación de sesiones (access token + refresh token)
 * para que login y refresh no dupliquen esta lógica.
 */
@Injectable()
export class SessionIssuerService {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  async issue(user: UserEntity, context: SessionContext): Promise<IssuedSession> {
    const refreshToken = this.tokens.generateOpaqueToken();
    const refreshTokenHash = this.tokens.hashOpaqueToken(refreshToken);

    const session = await this.sessions.create({
      userId: user.id,
      refreshTokenHash,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt: refreshTokenExpiry(),
    });

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      role: user.role,
      sid: session.id,
    });

    return { accessToken, refreshToken, session };
  }

  async rotate(session: SessionEntity, user: UserEntity): Promise<IssuedSession> {
    const refreshToken = this.tokens.generateOpaqueToken();
    const refreshTokenHash = this.tokens.hashOpaqueToken(refreshToken);
    const expiresAt = refreshTokenExpiry();

    await this.sessions.rotate(session.id, refreshTokenHash, expiresAt);

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      role: user.role,
      sid: session.id,
    });

    return { accessToken, refreshToken, session };
  }
}
