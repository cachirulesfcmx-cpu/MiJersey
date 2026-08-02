import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailLayoutRepositoryPort } from '../../domain/ports/email-layout.repository.port';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTransportPort } from '../../domain/ports/email-transport.port';
import { composeEmailHtml } from '../../domain/value-objects/compose-email.util';
import { renderTemplate } from '../../domain/value-objects/template-renderer.util';
import {
  EMAIL_LAYOUT_REPOSITORY,
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TRANSPORT,
} from '../../email-templates.constants';

export interface TestSendEmailTemplateInput {
  templateId: string;
  to: string;
  variables: Record<string, string>;
  actorUserId: string;
  ipAddress: string | null;
}

export interface TestSendEmailTemplateResult {
  subject: string;
  html: string;
  text: string;
  missingVariables: string[];
}

/** `POST /admin/email/templates/:id/test` — envía la plantilla tal como está en el borrador (no la versión publicada), para poder probar cambios antes de publicarlos. Las variables faltantes no bloquean el envío (mejor esfuerzo, como pediría cualquier editor de pruebas) pero se reportan para que el editor las muestre. */
@Injectable()
export class TestSendEmailTemplateUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
    @Inject(EMAIL_TRANSPORT) private readonly transport: EmailTransportPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: TestSendEmailTemplateInput): Promise<TestSendEmailTemplateResult> {
    const template = await this.templates.findById(input.templateId);
    if (!template) throw new EmailTemplateNotFoundError();

    const json = template.toJSON();
    const layout = json.layoutId ? await this.layouts.findById(json.layoutId) : null;

    const { html, missingVariables } = composeEmailHtml(
      json.html,
      input.variables,
      layout ? { html: layout.toJSON().html, css: layout.toJSON().css } : null,
    );
    const { output: subject } = renderTemplate(json.subject, input.variables, { escape: false });
    const { output: text } = renderTemplate(json.text, input.variables, { escape: false });

    await this.transport.send({ to: input.to, subject, html, text });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'email_template.test_sent',
      ipAddress: input.ipAddress,
      metadata: { templateId: input.templateId, to: input.to },
    });

    return { subject, html, text, missingVariables };
  }
}
