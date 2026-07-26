import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { EmailVerificationRepositoryPort } from '../../domain/ports/email-verification.repository.port';
import type { MailerPort } from '../../domain/ports/mailer.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { Email } from '../../domain/value-objects/email.vo';
import {
  EMAIL_VERIFICATION_REPOSITORY,
  EMAIL_VERIFICATION_TTL_HOURS,
  MAILER,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(EMAIL_VERIFICATION_REPOSITORY)
    private readonly verifications: EmailVerificationRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(MAILER) private readonly mailer: MailerPort,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(rawEmail: string): Promise<void> {
    const email = Email.create(rawEmail).toString();
    const user = await this.users.findByEmail(email);

    // No revela si la cuenta existe o ya está verificada.
    if (!user || user.isEmailVerified) {
      return;
    }

    await this.verifications.invalidateAllForUser(user.id);

    const rawToken = this.tokens.generateOpaqueToken();
    const tokenHash = this.tokens.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);

    await this.verifications.create(user.id, tokenHash, expiresAt);

    const link = `${this.config.publicWebUrl}/verify-email?token=${rawToken}`;
    await this.mailer.sendEmailVerification(user.email, link);
  }
}
