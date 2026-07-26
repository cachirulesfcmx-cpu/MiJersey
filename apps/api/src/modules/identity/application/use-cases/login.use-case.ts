import { Inject, Injectable } from '@nestjs/common';

import type { UserEntity } from '../../domain/entities/user.entity';
import { AccountInactiveError, InvalidCredentialsError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { Email } from '../../domain/value-objects/email.vo';
import {
  AUDIT_LOG_REPOSITORY,
  DUMMY_PASSWORD_HASH,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../../identity.constants';
import { SessionIssuerService } from '../services/session-issuer.service';

export interface LoginInput {
  email: string;
  password: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface LoginResult {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const email = Email.create(input.email).toString();
    const user = await this.users.findByEmail(email);

    // Compara siempre contra un hash (real o señuelo) para que el tiempo de
    // respuesta no delate si el correo existe.
    const isValid = await this.hasher.compare(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !isValid) {
      await this.auditLog.record({
        userId: user?.id ?? null,
        action: 'auth.login.failed',
        ipAddress: input.ipAddress,
      });
      throw new InvalidCredentialsError();
    }

    if (!user.canAuthenticate()) {
      throw new AccountInactiveError();
    }

    const issued = await this.sessionIssuer.issue(user, {
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.auditLog.record({
      userId: user.id,
      action: 'auth.login.success',
      ipAddress: input.ipAddress,
    });

    return { user, accessToken: issued.accessToken, refreshToken: issued.refreshToken };
  }
}
