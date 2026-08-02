import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { EmailLayoutEntity } from '../../domain/entities/email-layout.entity';
import { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import {
  EmailTemplateNotFoundError,
  InvalidEmailTemplateError,
} from '../../domain/errors/email-template.errors';
import type { EmailLayoutRepositoryPort } from '../../domain/ports/email-layout.repository.port';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { EmailTemplateStatus } from '../../domain/value-objects/email-template-enums';
import type { EmailTemplateCacheService } from '../services/email-template-cache.service';
import { PublishEmailTemplateUseCase } from './publish-email-template.use-case';

function buildTemplate(
  overrides: Partial<{
    subject: string;
    status: EmailTemplateStatus;
    layoutId: string | null;
  }> = {},
): EmailTemplateEntity {
  return new EmailTemplateEntity({
    id: 'template-1',
    name: 'Confirmación de pedido',
    key: 'order.confirmation',
    language: 'es',
    subject: overrides.subject ?? 'Tu pedido {{orderId}}',
    html: '<p>Hola {{name}}</p>',
    text: 'Hola {{name}}',
    status: overrides.status ?? EmailTemplateStatus.DRAFT,
    version: 2,
    layoutId: overrides.layoutId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: EmailTemplateEntity | null } = {}) {
  const existing = options.existing === undefined ? buildTemplate() : options.existing;

  const templates: jest.Mocked<EmailTemplateRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findByKeyAndLanguage: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn().mockImplementation((_id, status) => {
      const json = existing?.toJSON();
      return Promise.resolve(
        buildTemplate({
          status,
          ...(json?.subject !== undefined ? { subject: json.subject } : {}),
          layoutId: json?.layoutId ?? null,
        }),
      );
    }),
    delete: jest.fn(),
  };
  const versions: jest.Mocked<EmailTemplateVersionRepositoryPort> = {
    findByTemplateAndNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(3),
    create: jest.fn().mockResolvedValue({}),
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
  const cache = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<EmailTemplateCacheService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new PublishEmailTemplateUseCase(templates, versions, layouts, cache, auditLog),
    templates,
    versions,
    layouts,
    cache,
    auditLog,
  };
}

describe('PublishEmailTemplateUseCase', () => {
  it('throws EmailTemplateNotFoundError when the template does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'template-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('rejects publishing a template with unbalanced variable braces', async () => {
    const { useCase, templates } = buildUseCase({
      existing: buildTemplate({ subject: 'Hola {{name' }),
    });

    await expect(
      useCase.execute({ id: 'template-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(InvalidEmailTemplateError);
    expect(templates.updateStatus).not.toHaveBeenCalled();
  });

  it('publishes, seeds the cache with the template and its layout, and creates a version', async () => {
    const { useCase, templates, cache, versions } = buildUseCase({
      existing: buildTemplate({ layoutId: 'layout-1' }),
    });

    await useCase.execute({ id: 'template-1', actorUserId: 'admin-1', ipAddress: null });

    expect(templates.updateStatus).toHaveBeenCalledWith(
      'template-1',
      EmailTemplateStatus.PUBLISHED,
    );
    expect(cache.set).toHaveBeenCalledWith(
      'order.confirmation',
      'es',
      expect.stringContaining('"layout":{'),
    );
    expect(versions.create).toHaveBeenCalled();
  });

  it('records an audit entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ id: 'template-1', actorUserId: 'admin-1', ipAddress: null });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'email_template.published' }),
    );
  });
});
