import type { EmailTemplateEntity } from '../entities/email-template.entity';
import type { EmailTemplateSnapshot } from '../entities/email-template-version.entity';

export function toEmailTemplateSnapshot(template: EmailTemplateEntity): EmailTemplateSnapshot {
  const json = template.toJSON();
  return {
    name: json.name,
    key: json.key,
    language: json.language,
    subject: json.subject,
    html: json.html,
    text: json.text,
    status: json.status,
    layoutId: json.layoutId,
  };
}
