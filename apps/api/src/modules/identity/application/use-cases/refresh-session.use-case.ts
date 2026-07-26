import { Inject, Injectable } from '@nestjs/common';

import type { UserEntity } from '../../domain/entities/user.entity';
import { SessionNotFoundError } from '../../domain/errors/identity.errors';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { SESSION_REPOSITORY, TOKEN_SERVICE, USER_REPOSITORY } from '../../identity.constants';
import { SessionIssuerService } from '../services/session-issuer.service';

export interface RefreshSessionResult {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(rawRefreshToken: string): Promise<RefreshSessionResult> {
    const hash = this.tokens.hashOpaqueToken(rawRefreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);

    if (!session || !session.isUsable()) {
      throw new SessionNotFoundError();
    }

    const user = await this.users.findById(session.userId);

    if (!user || !user.canAuthenticate()) {
      throw new SessionNotFoundError();
    }

    const issued = await this.sessionIssuer.rotate(session, user);

    return { user, accessToken: issued.accessToken, refreshToken: issued.refreshToken };
  }
}
