import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import {
  DuplicateTrackingProviderError,
  InvalidTrackingConfigurationError,
} from '../../domain/errors/tracking.errors';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { CreateTrackingProviderUseCase } from './create-tracking-provider.use-case';

function buildProvider(): TrackingProviderEntity {
  return new TrackingProviderEntity({
    id: 'provider-1',
    provider: 'GOOGLE_ANALYTICS_4',
    status: 'INACTIVE',
    configuration: { measurementId: 'G-123' },
    consentCategory: 'analytics',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: TrackingProviderEntity | null } = {}) {
  const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
    findById: jest.fn(),
    findByProvider: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? null : options.existing),
    findMany: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn().mockResolvedValue(buildProvider()),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new CreateTrackingProviderUseCase(providers, auditLog), providers, auditLog };
}

describe('CreateTrackingProviderUseCase', () => {
  it('throws DuplicateTrackingProviderError when the provider already has a configuration', async () => {
    const { useCase } = buildUseCase({ existing: buildProvider() });

    await expect(
      useCase.execute({
        provider: 'GOOGLE_ANALYTICS_4',
        configuration: { measurementId: 'G-999' },
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(DuplicateTrackingProviderError);
  });

  it('throws InvalidTrackingConfigurationError when required fields are missing', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        provider: 'GOOGLE_ANALYTICS_4',
        configuration: {},
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(InvalidTrackingConfigurationError);
  });

  it('creates the provider and audits it', async () => {
    const { useCase, providers, auditLog } = buildUseCase();

    await useCase.execute({
      provider: 'GOOGLE_ANALYTICS_4',
      configuration: { measurementId: 'G-123' },
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(providers.create).toHaveBeenCalledWith('GOOGLE_ANALYTICS_4', {
      status: 'INACTIVE',
      configuration: { measurementId: 'G-123' },
      consentCategory: null,
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tracking.provider_created' }),
    );
  });
});
