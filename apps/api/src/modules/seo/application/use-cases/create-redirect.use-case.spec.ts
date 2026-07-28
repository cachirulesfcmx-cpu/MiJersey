import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { RedirectEntity } from '../../domain/entities/redirect.entity';
import {
  RedirectFromPathAlreadyExistsError,
  RedirectLoopError,
} from '../../domain/errors/seo.errors';
import type { RedirectRepositoryPort } from '../../domain/ports/redirect.repository.port';
import { CreateRedirectUseCase } from './create-redirect.use-case';

function buildUseCase(existingByFromPath: RedirectEntity | null) {
  const redirects: jest.Mocked<RedirectRepositoryPort> = {
    findById: jest.fn(),
    findByFromPath: jest.fn().mockResolvedValue(existingByFromPath),
    findMany: jest.fn(),
    create: jest.fn((data) =>
      Promise.resolve(new RedirectEntity({ id: 'redirect-1', createdAt: new Date(), ...data })),
    ),
    upsertByFromPath: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new CreateRedirectUseCase(redirects, auditLog), redirects };
}

describe('CreateRedirectUseCase', () => {
  it('rejects a redirect that points to itself', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({
        fromPath: '/old',
        toPath: '/old',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(RedirectLoopError);
  });

  it('rejects a duplicate origin path', async () => {
    const existing = new RedirectEntity({
      id: 'redirect-existing',
      fromPath: '/old',
      toPath: '/other',
      statusCode: 301,
      createdAt: new Date(),
    });
    const { useCase } = buildUseCase(existing);

    await expect(
      useCase.execute({
        fromPath: '/old',
        toPath: '/new',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(RedirectFromPathAlreadyExistsError);
  });

  it('creates a permanent redirect by default', async () => {
    const { useCase, redirects } = buildUseCase(null);

    await useCase.execute({
      fromPath: 'old-path',
      toPath: 'new-path',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(redirects.create).toHaveBeenCalledWith({
      fromPath: '/old-path',
      toPath: '/new-path',
      statusCode: 301,
    });
  });
});
