import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { GetPublicTrackingProvidersUseCase } from './get-public-tracking-providers.use-case';

describe('GetPublicTrackingProvidersUseCase', () => {
  it('returns only the public-safe projection of active providers', async () => {
    const active = new TrackingProviderEntity({
      id: 'provider-1',
      provider: 'META_PIXEL',
      status: 'ACTIVE',
      configuration: { pixelId: '123' },
      consentCategory: 'marketing',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
      findById: jest.fn(),
      findByProvider: jest.fn(),
      findMany: jest.fn(),
      findActive: jest.fn().mockResolvedValue([active]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const useCase = new GetPublicTrackingProvidersUseCase(providers);
    const result = await useCase.execute();

    expect(result).toEqual([
      {
        id: 'provider-1',
        provider: 'META_PIXEL',
        consentCategory: 'marketing',
        configuration: { pixelId: '123' },
      },
    ]);
  });
});
