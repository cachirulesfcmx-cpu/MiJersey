import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import {
  InvalidTrackingConfigurationError,
  TrackingProviderNotFoundError,
} from '../../domain/errors/tracking.errors';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { UpdateTrackingProviderUseCase } from './update-tracking-provider.use-case';

function buildProvider(
  overrides: Partial<{ configuration: Record<string, unknown> }> = {},
): TrackingProviderEntity {
  return new TrackingProviderEntity({
    id: 'provider-1',
    provider: 'META_PIXEL',
    status: 'INACTIVE',
    configuration: overrides.configuration ?? { pixelId: '123' },
    consentCategory: 'marketing',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: TrackingProviderEntity | null } = {}) {
  const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? buildProvider() : options.existing),
    findByProvider: jest.fn(),
    findMany: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(buildProvider()),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new UpdateTrackingProviderUseCase(providers, auditLog), providers, auditLog };
}

describe('UpdateTrackingProviderUseCase', () => {
  it('throws TrackingProviderNotFoundError when the provider does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'provider-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(TrackingProviderNotFoundError);
  });

  it('merges the new configuration with the existing one before validating', async () => {
    const { useCase, providers } = buildUseCase();

    await useCase.execute({
      id: 'provider-1',
      configuration: { extra: 'value' },
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(providers.update).toHaveBeenCalledWith('provider-1', {
      configuration: { pixelId: '123', extra: 'value' },
    });
  });

  it('throws InvalidTrackingConfigurationError when the merged configuration drops a required field', async () => {
    const { useCase } = buildUseCase({
      existing: buildProvider({ configuration: {} }),
    });

    await expect(
      useCase.execute({
        id: 'provider-1',
        configuration: { unrelated: 'x' },
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(InvalidTrackingConfigurationError);
  });

  it('updates the status without requiring configuration and audits the change', async () => {
    const { useCase, providers, auditLog } = buildUseCase();

    await useCase.execute({
      id: 'provider-1',
      status: 'ACTIVE',
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(providers.update).toHaveBeenCalledWith('provider-1', { status: 'ACTIVE' });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tracking.provider_updated' }),
    );
  });
});
