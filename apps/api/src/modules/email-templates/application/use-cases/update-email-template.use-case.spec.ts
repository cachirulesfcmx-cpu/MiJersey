import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { EmailTemplateStatus } from '../../domain/value-objects/email-template-enums';
import { UpdateEmailTemplateUseCase } from './update-email-template.use-case';

function buildTemplate(
  overrides: Partial<{ name: string; version: number }> = {},
): EmailTemplateEntity {
  return new EmailTemplateEntity({
    id: 'template-1',
    name: overrides.name ?? 'Confirmación de pedido',
    key: 'order.confirmation',
    language: 'es',
    subject: 'Tu pedido {{orderId}}',
    html: '<p>Hola {{name}}</p>',
    text: 'Hola {{name}}',
    status: EmailTemplateStatus.DRAFT,
    version: overrides.version ?? 2,
    layoutId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: EmailTemplateEntity | null } = {}) {
  const templates: jest.Mocked<EmailTemplateRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? buildTemplate() : options.existing),
    findByKeyAndLanguage: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockImplementation((_id, data) => Promise.resolve(buildTemplate(data))),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };
  const versions: jest.Mocked<EmailTemplateVersionRepositoryPort> = {
    findByTemplateAndNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(3),
    create: jest.fn().mockResolvedValue({}),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new UpdateEmailTemplateUseCase(templates, versions, auditLog),
    templates,
    versions,
    auditLog,
  };
}

describe('UpdateEmailTemplateUseCase', () => {
  it('throws EmailTemplateNotFoundError when the template does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'template-1', name: 'x', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('persists the update and creates a new version', async () => {
    const { useCase, templates, versions } = buildUseCase();

    await useCase.execute({
      id: 'template-1',
      name: 'Nuevo nombre',
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(templates.update).toHaveBeenCalledWith('template-1', { name: 'Nuevo nombre' });
    expect(versions.create).toHaveBeenCalledWith(
      'template-1',
      expect.objectContaining({ name: 'Nuevo nombre' }),
    );
  });

  it('records an audit entry listing the updated fields', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      id: 'template-1',
      subject: 'Nuevo asunto',
      html: '<p>Nuevo</p>',
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email_template.updated',
        metadata: { templateId: 'template-1', updatedFields: ['subject', 'html'] },
      }),
    );
  });
});
