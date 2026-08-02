import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import { EmailTemplateVersionEntity } from '../../domain/entities/email-template-version.entity';
import {
  EmailTemplateNotFoundError,
  EmailTemplateVersionNotFoundError,
} from '../../domain/errors/email-template.errors';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { EmailTemplateStatus } from '../../domain/value-objects/email-template-enums';
import { RestoreEmailTemplateVersionUseCase } from './restore-email-template-version.use-case';

function buildTemplate(subject = 'Asunto actual'): EmailTemplateEntity {
  return new EmailTemplateEntity({
    id: 'template-1',
    name: 'Confirmación',
    key: 'order.confirmation',
    language: 'es',
    subject,
    html: '<p>Hola</p>',
    text: 'Hola',
    status: EmailTemplateStatus.PUBLISHED,
    version: 3,
    layoutId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVersion(): EmailTemplateVersionEntity {
  return new EmailTemplateVersionEntity({
    id: 'version-1',
    templateId: 'template-1',
    versionNumber: 1,
    snapshot: {
      name: 'Confirmación (vieja)',
      key: 'order.confirmation',
      language: 'es',
      subject: 'Asunto viejo',
      html: '<p>Viejo</p>',
      text: 'Viejo',
      status: EmailTemplateStatus.DRAFT,
      layoutId: null,
    },
    createdAt: new Date(),
  });
}

function buildUseCase(options: { version?: EmailTemplateVersionEntity | null } = {}) {
  const templates: jest.Mocked<EmailTemplateRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(buildTemplate()),
    findByKeyAndLanguage: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest
      .fn()
      .mockImplementation((_id, data) => Promise.resolve(buildTemplate(data.subject))),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };
  const versions: jest.Mocked<EmailTemplateVersionRepositoryPort> = {
    findByTemplateAndNumber: jest
      .fn()
      .mockResolvedValue(options.version === undefined ? buildVersion() : options.version),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(4),
    create: jest.fn().mockResolvedValue({}),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new RestoreEmailTemplateVersionUseCase(templates, versions, auditLog),
    templates,
    versions,
    auditLog,
  };
}

describe('RestoreEmailTemplateVersionUseCase', () => {
  it('throws EmailTemplateNotFoundError when the template does not exist', async () => {
    const { useCase, templates } = buildUseCase();
    (templates.findById as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        templateId: 'template-1',
        versionNumber: 1,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('throws EmailTemplateVersionNotFoundError when the version does not exist', async () => {
    const { useCase } = buildUseCase({ version: null });

    await expect(
      useCase.execute({
        templateId: 'template-1',
        versionNumber: 99,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(EmailTemplateVersionNotFoundError);
  });

  it('applies the snapshot and creates a new version without touching the status', async () => {
    const { useCase, templates, versions } = buildUseCase();

    const result = await useCase.execute({
      templateId: 'template-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(templates.update).toHaveBeenCalledWith(
      'template-1',
      expect.objectContaining({ subject: 'Asunto viejo' }),
    );
    expect(versions.create).toHaveBeenCalled();
    expect(result.toJSON().subject).toBe('Asunto viejo');
  });

  it('records an audit entry noting the restored version', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      templateId: 'template-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email_template.version_restored',
        metadata: { templateId: 'template-1', restoredFrom: 1 },
      }),
    );
  });
});
