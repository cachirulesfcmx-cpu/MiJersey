import { Inject, Injectable } from '@nestjs/common';

import type { EmailLayoutRepositoryPort } from '../../../email-templates/domain/ports/email-layout.repository.port';
import type { EmailTemplateRepositoryPort } from '../../../email-templates/domain/ports/email-template.repository.port';
import type { EmailTransportPort } from '../../../email-templates/domain/ports/email-transport.port';
import { composeEmailHtml } from '../../../email-templates/domain/value-objects/compose-email.util';
import { renderTemplate } from '../../../email-templates/domain/value-objects/template-renderer.util';
import {
  EMAIL_LAYOUT_REPOSITORY,
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TRANSPORT,
} from '../../../email-templates/email-templates.constants';
import type {
  NotificationChannelPort,
  SendChannelMessageInput,
  SendChannelMessageResult,
} from '../../domain/ports/notification-channel.port';

const DEFAULT_LANGUAGE = 'es';

function toStringVariables(payload: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value)]));
}

/** Integración real con Email Templates (034 §5/§13 DoD) — resuelve la plantilla **publicada** para `templateKey`/`es` (a diferencia de `TestSendEmailTemplateUseCase`, que envía el borrador), compone el HTML con su layout y envía vía `EmailTransportPort`, reutilizando el mismo motor de interpolación de 031 sin duplicarlo. Si la plantilla no existe o no está publicada, lanza — `SendNotificationUseCase` lo captura y marca la notificación como `FAILED`. */
@Injectable()
export class EmailNotificationChannel implements NotificationChannelPort {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
    @Inject(EMAIL_TRANSPORT) private readonly transport: EmailTransportPort,
  ) {}

  async send(input: SendChannelMessageInput): Promise<SendChannelMessageResult> {
    const template = await this.templates.findByKeyAndLanguage(input.templateKey, DEFAULT_LANGUAGE);
    if (!template || template.status !== 'PUBLISHED') {
      throw new Error(
        `No hay una plantilla publicada para la clave "${input.templateKey}" (${DEFAULT_LANGUAGE})`,
      );
    }

    const json = template.toJSON();
    const layout = json.layoutId ? await this.layouts.findById(json.layoutId) : null;
    const variables = toStringVariables(input.payload);

    const { html } = composeEmailHtml(
      json.html,
      variables,
      layout ? { html: layout.toJSON().html, css: layout.toJSON().css } : null,
    );
    const { output: subject } = renderTemplate(json.subject, variables, { escape: false });
    const { output: text } = renderTemplate(json.text, variables, { escape: false });

    await this.transport.send({ to: input.recipient, subject, html, text });

    return { delivered: true, raw: { templateKey: input.templateKey, to: input.recipient } };
  }
}
