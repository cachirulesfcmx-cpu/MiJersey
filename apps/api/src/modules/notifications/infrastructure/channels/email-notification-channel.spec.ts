import { EmailTemplateEntity } from '../../../email-templates/domain/entities/email-template.entity';
import type { EmailLayoutRepositoryPort } from '../../../email-templates/domain/ports/email-layout.repository.port';
import type { EmailTemplateRepositoryPort } from '../../../email-templates/domain/ports/email-template.repository.port';
import type { EmailTransportPort } from '../../../email-templates/domain/ports/email-transport.port';
import { EmailTemplateStatus } from '../../../email-templates/domain/value-objects/email-template-enums';
import { EmailNotificationChannel } from './email-notification-channel';

function buildTemplate(status: EmailTemplateStatus): EmailTemplateEntity {
  return new EmailTemplateEntity({
    id: 'template-1',
    name: 'Confirmación de pedido',
    key: 'order.confirmation',
    language: 'es',
    subject: 'Tu pedido {{orderId}}',
    html: '<p>Hola {{name}}</p>',
    text: 'Hola {{name}}',
    status,
    version: 1,
    layoutId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildChannel(template: EmailTemplateEntity | null) {
  const templates: jest.Mocked<EmailTemplateRepositoryPort> = {
    findById: jest.fn(),
    findByKeyAndLanguage: jest.fn().mockResolvedValue(template),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };
  const layouts: jest.Mocked<EmailLayoutRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const transport: jest.Mocked<EmailTransportPort> = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  return {
    channel: new EmailNotificationChannel(templates, layouts, transport),
    templates,
    layouts,
    transport,
  };
}

describe('EmailNotificationChannel', () => {
  it('throws when there is no template for the key/language', async () => {
    const { channel } = buildChannel(null);

    await expect(
      channel.send({ recipient: 'a@mijersey.dev', templateKey: 'order.confirmation', payload: {} }),
    ).rejects.toThrow(/No hay una plantilla publicada/);
  });

  it('throws when the template exists but is not published', async () => {
    const { channel } = buildChannel(buildTemplate(EmailTemplateStatus.DRAFT));

    await expect(
      channel.send({ recipient: 'a@mijersey.dev', templateKey: 'order.confirmation', payload: {} }),
    ).rejects.toThrow(/No hay una plantilla publicada/);
  });

  it('composes and sends the published template with the interpolated payload', async () => {
    const { channel, transport } = buildChannel(buildTemplate(EmailTemplateStatus.PUBLISHED));

    const result = await channel.send({
      recipient: 'a@mijersey.dev',
      templateKey: 'order.confirmation',
      payload: { orderId: '123', name: 'Ana' },
    });

    expect(transport.send).toHaveBeenCalledWith({
      to: 'a@mijersey.dev',
      subject: 'Tu pedido 123',
      html: '<p>Hola Ana</p>',
      text: 'Hola Ana',
    });
    expect(result).toEqual({
      delivered: true,
      raw: { templateKey: 'order.confirmation', to: 'a@mijersey.dev' },
    });
  });
});
