import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import { TrackingProviderNotFoundError } from '../../domain/errors/tracking.errors';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { DeleteTrackingProviderUseCase } from './delete-tracking-provider.use-case';

function buildUseCase(options: { existing?: TrackingProviderEntity | null } = {}) {
  const existing =
    options.existing === undefined
      ? new TrackingProviderEntity({
          id: 'provider-1',
          provider: 'TIKTOK_PIXEL',
          status: 'ACTIVE',
          configuration: { pixelId: '123' },
          consentCategory: 'marketing',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : options.existing;

  const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findByProvider: jest.fn(),
    findMany: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new DeleteTrackingProviderUseCase(providers, auditLog), providers, auditLog };
}

describe('DeleteTrackingProviderUseCase', () => {
  it('throws TrackingProviderNotFoundError when the provider does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'provider-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(TrackingProviderNotFoundError);
  });

  it('deletes the provider and audits it', async () => {
    const { useCase, providers, auditLog } = buildUseCase();

    await useCase.execute({ id: 'provider-1', actorUserId: 'admin-1', ipAddress: '127.0.0.1' });

    expect(providers.delete).toHaveBeenCalledWith('provider-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tracking.provider_deleted' }),
    );
  });
});
