import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { MailerPort } from '../../domain/ports/mailer.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/password-reset.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { Email } from '../../domain/value-objects/email.vo';
import {
  MAILER,
  PASSWORD_RESET_REPOSITORY,
  PASSWORD_RESET_TTL_HOURS,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly passwordResets: PasswordResetRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(MAILER) private readonly mailer: MailerPort,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(rawEmail: string): Promise<void> {
    const email = Email.create(rawEmail).toString();
    const user = await this.users.findByEmail(email);

    // No revela si el correo existe: protección contra enumeración de usuarios.
    if (!user) {
      return;
    }

    await this.passwordResets.invalidateAllForUser(user.id);

    const rawToken = this.tokens.generateOpaqueToken();
    const tokenHash = this.tokens.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000);

    await this.passwordResets.create(user.id, tokenHash, expiresAt);

    const link = `${this.config.publicWebUrl}/reset-password?token=${rawToken}`;
    await this.mailer.sendPasswordReset(user.email, link);
  }
}
