import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { EmailLayoutEntity } from '../../domain/entities/email-layout.entity';
import { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailLayoutRepositoryPort } from '../../domain/ports/email-layout.repository.port';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTransportPort } from '../../domain/ports/email-transport.port';
import { EmailTemplateStatus } from '../../domain/value-objects/email-template-enums';
import { TestSendEmailTemplateUseCase } from './test-send-email-template.use-case';

function buildTemplate(layoutId: string | null = null): EmailTemplateEntity {
  return new EmailTemplateEntity({
    id: 'template-1',
    name: 'Confirmación',
    key: 'order.confirmation',
    language: 'es',
    subject: 'Tu pedido {{orderId}}',
    html: '<p>Hola {{name}}</p>',
    text: 'Hola {{name}}',
    status: EmailTemplateStatus.DRAFT,
    version: 1,
    layoutId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { template?: EmailTemplateEntity | null } = {}) {
  const templates: jest.Mocked<EmailTemplateRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.template === undefined ? buildTemplate() : options.template),
    findByKeyAndLanguage: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };
  const layouts: jest.Mocked<EmailLayoutRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(
      new EmailLayoutEntity({
        id: 'layout-1',
        name: 'Base',
        html: '<body>{{content}}</body>',
        css: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const transport: jest.Mocked<EmailTransportPort> = {
    send: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new TestSendEmailTemplateUseCase(templates, layouts, transport, auditLog),
    templates,
    layouts,
    transport,
    auditLog,
  };
}

describe('TestSendEmailTemplateUseCase', () => {
  it('throws EmailTemplateNotFoundError when the template does not exist', async () => {
    const { useCase } = buildUseCase({ template: null });

    await expect(
      useCase.execute({
        templateId: 'template-1',
        to: 'test@example.com',
        variables: {},
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('renders the draft content (not requiring PUBLISHED) and sends it via the transport', async () => {
    const { useCase, transport } = buildUseCase();

    const result = await useCase.execute({
      templateId: 'template-1',
      to: 'test@example.com',
      variables: { name: 'Ana', orderId: '123' },
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(transport.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Tu pedido 123',
      html: '<p>Hola Ana</p>',
      text: 'Hola Ana',
    });
    expect(result.missingVariables).toEqual([]);
  });

  it('composes with the layout when the template has one', async () => {
    const { useCase, transport } = buildUseCase({ template: buildTemplate('layout-1') });

    await useCase.execute({
      templateId: 'template-1',
      to: 'test@example.com',
      variables: { name: 'Ana', orderId: '123' },
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<body><p>Hola Ana</p></body>' }),
    );
  });

  it('reports missing variables without blocking the send', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({
      templateId: 'template-1',
      to: 'test@example.com',
      variables: {},
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(result.missingVariables).toEqual(['name']);
  });

  it('records an audit entry with the recipient', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      templateId: 'template-1',
      to: 'test@example.com',
      variables: { name: 'Ana' },
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email_template.test_sent',
        metadata: { templateId: 'template-1', to: 'test@example.com' },
      }),
    );
  });
});
