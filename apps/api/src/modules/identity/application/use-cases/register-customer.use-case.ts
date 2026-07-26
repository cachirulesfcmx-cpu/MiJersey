import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { UserEntity } from '../../domain/entities/user.entity';
import { EmailAlreadyRegisteredError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { EmailVerificationRepositoryPort } from '../../domain/ports/email-verification.repository.port';
import type { MailerPort } from '../../domain/ports/mailer.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { Email } from '../../domain/value-objects/email.vo';
import { RoleName } from '../../domain/value-objects/role-name';
import {
  AUDIT_LOG_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  EMAIL_VERIFICATION_TTL_HOURS,
  MAILER,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ipAddress: string | null;
}

@Injectable()
export class RegisterCustomerUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(EMAIL_VERIFICATION_REPOSITORY)
    private readonly verifications: EmailVerificationRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(MAILER) private readonly mailer: MailerPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(input: RegisterCustomerInput): Promise<UserEntity> {
    const email = Email.create(input.email).toString();
    const existing = await this.users.findByEmail(email);

    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.users.create({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: RoleName.CUSTOMER,
    });

    const rawToken = this.tokens.generateOpaqueToken();
    const tokenHash = this.tokens.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
    await this.verifications.create(user.id, tokenHash, expiresAt);

    const link = `${this.config.publicWebUrl}/verify-email?token=${rawToken}`;
    await this.mailer.sendEmailVerification(user.email, link);

    await this.auditLog.record({
      userId: user.id,
      action: 'auth.register',
      ipAddress: input.ipAddress,
    });

    return user;
  }
}
