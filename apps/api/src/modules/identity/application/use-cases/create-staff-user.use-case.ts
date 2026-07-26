import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { UserEntity } from '../../domain/entities/user.entity';
import { EmailAlreadyRegisteredError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { MailerPort } from '../../domain/ports/mailer.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/password-reset.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { Email } from '../../domain/value-objects/email.vo';
import { RoleName, STAFF_ROLES } from '../../domain/value-objects/role-name';
import {
  AUDIT_LOG_REPOSITORY,
  MAILER,
  PASSWORD_HASHER,
  PASSWORD_RESET_REPOSITORY,
  PASSWORD_RESET_TTL_HOURS,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

export interface CreateStaffUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  invitedByUserId: string;
  ipAddress: string | null;
}

/**
 * Crea una cuenta de staff (nunca Customer) con una contraseña aleatoria
 * que nadie conoce, e invita a la persona a establecer la suya propia vía
 * el mismo flujo de recuperación de contraseña.
 */
@Injectable()
export class CreateStaffUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly passwordResets: PasswordResetRepositoryPort,
    @Inject(MAILER) private readonly mailer: MailerPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(input: CreateStaffUserInput): Promise<UserEntity> {
    const email = Email.create(input.email).toString();
    const existing = await this.users.findByEmail(email);

    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const role = STAFF_ROLES.includes(input.role) ? input.role : RoleName.SUPPORT;
    const temporaryPassword = this.tokens.generateOpaqueToken();
    const passwordHash = await this.hasher.hash(temporaryPassword);

    const user = await this.users.create({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role,
    });
    await this.users.markEmailVerified(user.id);

    const rawToken = this.tokens.generateOpaqueToken();
    const tokenHash = this.tokens.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000);
    await this.passwordResets.create(user.id, tokenHash, expiresAt);

    const link = `${this.config.publicAdminUrl}/reset-password?token=${rawToken}`;
    await this.mailer.sendPasswordReset(user.email, link);

    await this.auditLog.record({
      userId: input.invitedByUserId,
      action: 'admin.user.invited',
      ipAddress: input.ipAddress,
      metadata: { invitedUserId: user.id, role },
    });

    return user;
  }
}
