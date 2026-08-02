import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { EmailTransportPort, SendEmailInput } from '../../domain/ports/email-transport.port';

/** Transporte real de correo (031) — el proveedor que `ConsoleMailer` (003) anticipaba. Sin `SMTP_HOST` configurado (desarrollo/pruebas sin credenciales), registra el correo en el log en vez de enviarlo, mismo comportamiento de `ConsoleMailer` para no romper flujos existentes cuando no hay SMTP disponible. `MailerPort` (identity) no cambia — es un puerto distinto para un caso de uso distinto (plantillas versionadas vs. enlaces simples). */
@Injectable()
export class NodemailerEmailTransport implements EmailTransportPort {
  private readonly logger = new Logger(NodemailerEmailTransport.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async send(input: SendEmailInput): Promise<void> {
    if (!this.config.smtpHost) {
      this.logger.log(`[SMTP no configurado] Correo para ${input.to} — asunto: "${input.subject}"`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpPort === 465,
      ...(this.config.smtpUser && this.config.smtpPassword
        ? { auth: { user: this.config.smtpUser, pass: this.config.smtpPassword } }
        : {}),
    });

    await transporter.sendMail({
      from: this.config.smtpFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
