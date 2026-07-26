import { Injectable, Logger } from '@nestjs/common';

import type { MailerPort } from '../../domain/ports/mailer.port';

/**
 * Adaptador de correo temporal: registra el enlace en el log estructurado
 * en vez de enviarlo. Un proveedor real (SMTP/ESP) llega con el módulo
 * 031-Email-Templates; el puerto MailerPort no cambia cuando eso pase.
 */
@Injectable()
export class ConsoleMailer implements MailerPort {
  private readonly logger = new Logger(ConsoleMailer.name);

  sendEmailVerification(to: string, link: string): Promise<void> {
    this.logger.log(`Verificación de correo para ${to}: ${link}`);
    return Promise.resolve();
  }

  sendPasswordReset(to: string, link: string): Promise<void> {
    this.logger.log(`Recuperación de contraseña para ${to}: ${link}`);
    return Promise.resolve();
  }
}
